---
title: "Паттерны проектирования в Go"
category: "golang"
categoryTitle: "Go"
section: "best-practices"
sectionTitle: "Практики и качество"
sectionOrder: 11
order: 5
---

Go — язык с минималистичной философией. Здесь нет абстрактных фабрик, декораторов и стратегий в классическом виде. Вместо них — простые, идиоматичные паттерны, которые встречаются в стандартной библиотеке и в каждом серьёзном Go-проекте.

## Functional Options — гибкое конфигурирование

Задача: создать HTTP-сервер с множеством настроек (порт, таймаут, логгер, TLS), но не заставлять пользователя указывать все. Классические подходы (конструктор с 10 параметрами или struct с полями) неудобны.

```
type Server struct {
    port    int
    timeout time.Duration
    logger  *slog.Logger
}

type Option func(*Server)

func WithPort(port int) Option {
    return func(s *Server) {
        s.port = port
    }
}

func WithTimeout(d time.Duration) Option {
    return func(s *Server) {
        s.timeout = d
    }
}

func WithLogger(l *slog.Logger) Option {
    return func(s *Server) {
        s.logger = l
    }
}

func NewServer(opts ...Option) *Server {
    s := &Server{
        port:    8080,
        timeout: 30 * time.Second,
        logger:  slog.Default(),
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}
```

Можно создать сервер с настройками по умолчанию или указать только нужные параметры:

```
srv := NewServer()

srv := NewServer(
    WithPort(9090),
    WithTimeout(10 * time.Second),
)
```

Этот паттерн используется в **grpc.NewServer**, **http.Server** и десятках популярных библиотек. Он позволяет добавлять новые опции без изменения сигнатуры конструктора.

## Dependency Injection через интерфейсы

В Go нет фреймворков для DI (Spring, Dagger). Зависимости передаются явно — через аргументы конструктора. Это проще, прозрачнее и легче тестировать.

```
type UserRepository interface {
    FindByID(ctx context.Context, id int64) (*User, error)
    Save(ctx context.Context, user *User) error
}

type UserService struct {
    repo   UserRepository
    cache  Cache
    logger *slog.Logger
}

func NewUserService(repo UserRepository, cache Cache, logger *slog.Logger) *UserService {
    return &UserService{
        repo:   repo,
        cache:  cache,
        logger: logger,
    }
}
```

В **main** собираем граф зависимостей:

```
func main() {
    db := connectDB()
    repo := postgres.NewUserRepo(db)
    cache := redis.NewCache(redisClient)
    logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))

    userService := NewUserService(repo, cache, logger)
    handler := NewHandler(userService)

    http.ListenAndServe(":8080", handler)
}
```

В тестах подставляем моки:

```
func TestUserService(t *testing.T) {
    repo := &mockRepo{users: map[int64]*User{1: {Name: "Alice"}}}
    cache := &mockCache{}
    logger := slog.New(slog.NewTextHandler(io.Discard, nil))

    svc := NewUserService(repo, cache, logger)
    user, err := svc.GetUser(context.Background(), 1)
    // ...
}
```

Правило: зависимости — это интерфейсы, реализации создаются в **main** и передаются вниз по цепочке.

## Graceful Shutdown — корректное завершение

Когда сервер получает сигнал остановки (Ctrl+C, SIGTERM от Kubernetes), он не должен обрывать текущие запросы. Нужно дождаться их завершения, закрыть соединения с базой и только потом выключиться.

```
func main() {
    srv := &http.Server{Addr: ":8080", Handler: router}

    go func() {
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("ошибка сервера: %v", err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Завершение: ждём текущие запросы...")

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    if err := srv.Shutdown(ctx); err != nil {
        log.Fatalf("принудительное завершение: %v", err)
    }

    db.Close()
    log.Println("Сервер остановлен")
}
```

**srv.Shutdown** перестаёт принимать новые соединения и ждёт завершения текущих. Если за 10 секунд не уложились — контекст отменяется и соединения обрываются принудительно.

## Middleware — цепочка обработчиков

Middleware — функция, которая оборачивает HTTP-обработчик, добавляя поведение до или после обработки запроса.

```
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()
        next.ServeHTTP(w, r)
        slog.Info("запрос обработан",
            "method", r.Method,
            "path", r.URL.Path,
            "duration", time.Since(start),
        )
    })
}

func authMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            http.Error(w, "Unauthorized", http.StatusUnauthorized)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

Middleware собираются в цепочку:

```
handler := loggingMiddleware(authMiddleware(router))
http.ListenAndServe(":8080", handler)
```

Каждый запрос проходит через логирование, потом через проверку авторизации, потом попадает в роутер. Если авторизация не прошла — запрос не дойдёт до роутера.

## Table-Driven конструирование

Паттерн табличных тестов работает не только для тестов. Его можно применить для маршрутизации, маппинга и конфигурации.

```
type route struct {
    method  string
    path    string
    handler http.HandlerFunc
}

func setupRoutes(mux *http.ServeMux) {
    routes := []route{
        {"GET", "/health", handleHealth},
        {"GET", "/users", handleListUsers},
        {"POST", "/users", handleCreateUser},
        {"GET", "/users/{id}", handleGetUser},
    }

    for _, r := range routes {
        mux.HandleFunc(r.method+" "+r.path, r.handler)
    }
}
```

Все маршруты в одном месте, легко читать, легко добавлять.

## Итог

**Functional Options** — для конструкторов с множеством параметров. **Dependency Injection** — через интерфейсы и явную передачу зависимостей в конструктор. **Graceful Shutdown** — для корректного завершения сервера (обязательно в продакшене). **Middleware** — для общей логики (логирование, авторизация, метрики). Go не нуждается в сложных паттернах проектирования — **простота и явность ценятся выше, чем абстрактность и гибкость.**
