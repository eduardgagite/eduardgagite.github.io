---
title: "HTTP-сервер на стандартной библиотеке"
category: "golang"
categoryTitle: "Go"
section: "web-and-api"
sectionTitle: "Веб и API"
sectionOrder: 8
order: 1
---

Go прославился как язык для веб-серверов. И не зря: стандартная библиотека **net/http** настолько мощная, что многие проекты обходятся без фреймворков.

В Java вам нужен Spring Boot, в Python — Flask или Django, в Node.js — Express. В Go вы можете поднять полноценный HTTP-сервер за 10 строк кода.

## Минимальный сервер

```
package main

import (
    "fmt"
    "net/http"
)

func main() {
    http.HandleFunc("/hello", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintln(w, "Hello, World!")
    })

    fmt.Println("Сервер запущен на http://localhost:8080")
    http.ListenAndServe(":8080", nil)
}
```

Откройте браузер по адресу **http://localhost:8080/hello** — и увидите ответ.

## Обработчик (Handler)

Каждый обработчик получает два аргумента:
- **w http.ResponseWriter** — сюда мы **пишем** ответ (тело, заголовки, статус).
- **r \*http.Request** — отсюда мы **читаем** входящий запрос (URL, тело, заголовки, метод).

### Возврат JSON

```
func usersHandler(w http.ResponseWriter, r *http.Request) {
    users := []map[string]string{
        {"name": "Alice", "email": "alice@mail.com"},
        {"name": "Bob", "email": "bob@mail.com"},
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(users)
}
```

### Чтение тела запроса (POST)

```
type CreateUserRequest struct {
    Name  string `json:"name"`
    Email string `json:"email"`
}

func createUserHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Метод не поддерживается", http.StatusMethodNotAllowed)
        return
    }

    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Невалидный JSON", http.StatusBadRequest)
        return
    }

    fmt.Fprintf(w, "Создан пользователь: %s", req.Name)
}
```

### Чтение URL-параметров

```
func userHandler(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")
    fmt.Fprintf(w, "Запрошен пользователь с ID: %s", id)
}

http.HandleFunc("GET /users/{id}", userHandler)
```

## Структура типичного API

```
func main() {
    mux := http.NewServeMux()

    mux.HandleFunc("GET /health", healthHandler)
    mux.HandleFunc("GET /users", listUsersHandler)
    mux.HandleFunc("GET /users/{id}", getUserHandler)
    mux.HandleFunc("POST /users", createUserHandler)

    fmt.Println("API запущен на :8080")
    http.ListenAndServe(":8080", mux)
}
```

## Graceful Shutdown (Корректное завершение)

В продакшене нельзя просто убить сервер — нужно дождаться завершения текущих запросов.

```
func main() {
    srv := &http.Server{Addr: ":8080"}

    go func() {
        if err := srv.ListenAndServe(); err != http.ErrServerClosed {
            log.Fatal(err)
        }
    }()

    quit := make(chan os.Signal, 1)
    signal.Notify(quit, os.Interrupt)
    <-quit

    fmt.Println("Завершаю работу...")
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    srv.Shutdown(ctx)
}
```

## Итог

1. **net/http** достаточно для большинства задач. Фреймворк необязателен.
2. **http.HandleFunc** регистрирует обработчик для пути.
3. **w** — пишем ответ, **r** — читаем запрос.
4. Для продакшена используйте Graceful Shutdown.
