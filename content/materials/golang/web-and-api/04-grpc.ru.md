---
title: "gRPC и Protocol Buffers"
category: "golang"
categoryTitle: "Go"
section: "web-and-api"
sectionTitle: "Веб и API"
sectionOrder: 8
order: 4
---

REST с JSON — привычный выбор для API. Но когда сервисы общаются между собой (микросервисная архитектура), часто нужно что-то быстрее и строже. **gRPC** — это фреймворк удалённого вызова процедур от Google. Вместо "отправь JSON на endpoint" вы вызываете метод на удалённом сервере так, будто он локальный.

Почему Go-разработчики часто выбирают gRPC:
- Бинарный протокол (**Protocol Buffers**) вместо текстового JSON — компактнее и быстрее.
- Строгая типизация — контракт описан в **.proto**-файле, клиент и сервер генерируются автоматически.
- Двунаправленные стримы — сервер и клиент могут обмениваться данными в реальном времени.
- Встроенная кодогенерация для Go, Python, Java и других языков.

## Protocol Buffers — формат данных

Прежде чем писать gRPC-сервис, нужно описать данные и методы в **.proto**-файле.

```
syntax = "proto3";

package user;

option go_package = "github.com/myapp/proto/user";

message GetUserRequest {
  int64 id = 1;
}

message User {
  int64 id = 1;
  string name = 2;
  string email = 3;
}

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (stream User);
}

message ListUsersRequest {
  int32 limit = 1;
}
```

Каждое поле имеет номер (**= 1**, **= 2**). Эти номера — идентификаторы полей в бинарном формате. Менять их после публикации нельзя (сломается обратная совместимость), а добавлять новые — можно.

## Кодогенерация

Из **.proto**-файла генерируются Go-структуры и интерфейс сервиса.

```
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

protoc --go_out=. --go-grpc_out=. proto/user.proto
```

Команда создаст два файла:
- **user.pb.go** — структуры **GetUserRequest**, **User**, **ListUsersRequest**.
- **user_grpc.pb.go** — интерфейс **UserServiceServer** (для сервера) и клиент **UserServiceClient**.

## Реализация сервера

Сгенерированный интерфейс нужно реализовать.

```
type userServer struct {
    user.UnimplementedUserServiceServer
}

func (s *userServer) GetUser(ctx context.Context, req *user.GetUserRequest) (*user.User, error) {
    if req.Id <= 0 {
        return nil, status.Errorf(codes.InvalidArgument, "невалидный ID: %d", req.Id)
    }

    return &user.User{
        Id:    req.Id,
        Name:  "Alice",
        Email: "alice@example.com",
    }, nil
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("не удалось слушать: %v", err)
    }

    grpcServer := grpc.NewServer()
    user.RegisterUserServiceServer(grpcServer, &userServer{})

    log.Println("gRPC-сервер слушает :50051")
    if err := grpcServer.Serve(lis); err != nil {
        log.Fatalf("ошибка сервера: %v", err)
    }
}
```

Встраивание **UnimplementedUserServiceServer** — обязательный паттерн. Он гарантирует, что при добавлении новых методов в **.proto** сервер скомпилируется (новые методы вернут ошибку "not implemented"), а не сломается.

## Реализация клиента

```
func main() {
    conn, err := grpc.Dial("localhost:50051", grpc.WithTransportCredentials(insecure.NewCredentials()))
    if err != nil {
        log.Fatalf("не удалось подключиться: %v", err)
    }
    defer conn.Close()

    client := user.NewUserServiceClient(conn)

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    resp, err := client.GetUser(ctx, &user.GetUserRequest{Id: 42})
    if err != nil {
        log.Fatalf("ошибка вызова: %v", err)
    }

    fmt.Printf("Пользователь: %s (%s)\n", resp.Name, resp.Email)
}
```

Вызов **client.GetUser** выглядит как вызов обычного метода, но под капотом данные сериализуются в Protocol Buffers, летят по сети через HTTP/2 и десериализуются на другой стороне.

## Обработка ошибок

gRPC использует свою систему кодов ошибок (аналог HTTP-статусов, но для RPC).

```
import (
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
)

func (s *userServer) GetUser(ctx context.Context, req *user.GetUserRequest) (*user.User, error) {
    u, err := s.db.FindUser(req.Id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, status.Errorf(codes.NotFound, "пользователь %d не найден", req.Id)
        }
        return nil, status.Errorf(codes.Internal, "ошибка базы данных: %v", err)
    }
    return u, nil
}
```

Основные коды: **NotFound**, **InvalidArgument**, **Internal**, **Unauthenticated**, **PermissionDenied**, **DeadlineExceeded**. На стороне клиента код ошибки можно извлечь:

```
resp, err := client.GetUser(ctx, req)
if err != nil {
    st, ok := status.FromError(err)
    if ok && st.Code() == codes.NotFound {
        fmt.Println("Пользователь не найден")
    }
}
```

## Стриминг

gRPC поддерживает три вида стримов помимо обычного unary-вызова.

### Server streaming — сервер отдаёт поток данных

```
func (s *userServer) ListUsers(req *user.ListUsersRequest, stream user.UserService_ListUsersServer) error {
    users := fetchUsersFromDB(req.Limit)
    for _, u := range users {
        if err := stream.Send(u); err != nil {
            return err
        }
    }
    return nil
}
```

Клиент читает данные по мере поступления:

```
stream, err := client.ListUsers(ctx, &user.ListUsersRequest{Limit: 100})
if err != nil {
    log.Fatal(err)
}

for {
    u, err := stream.Recv()
    if err == io.EOF {
        break
    }
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Получен: %s\n", u.Name)
}
```

Стриминг полезен, когда данных много и нет смысла загружать всё в память целиком.

## Когда выбрать gRPC, а когда REST

**gRPC** — для общения сервисов между собой (backend-to-backend), когда важна скорость и строгий контракт.

**REST + JSON** — для публичных API, браузерных клиентов, когда нужна простота отладки (JSON читается человеком).

Многие проекты используют оба подхода: gRPC внутри кластера, REST/JSON наружу для фронтенда и мобильных приложений.

## Итог

gRPC — протокол удалённого вызова процедур с бинарной сериализацией (Protocol Buffers), кодогенерацией и стримингом. В Go он поддерживается на уровне стандарта де-факто. **Для межсервисного общения gRPC быстрее и надёжнее REST, но для публичных API классический HTTP + JSON по-прежнему проще и универсальнее.**
