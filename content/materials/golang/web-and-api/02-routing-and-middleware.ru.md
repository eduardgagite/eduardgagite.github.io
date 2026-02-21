---
title: "Маршрутизация и middleware"
category: "golang"
categoryTitle: "Go"
section: "web-and-api"
sectionTitle: "Веб и API"
sectionOrder: 8
order: 2
---

Когда API растет, появляется необходимость в двух вещах:
1. **Маршрутизация**: Куда направить запрос в зависимости от URL и метода.
2. **Middleware**: Общая логика, которая выполняется для **каждого** запроса (логирование, авторизация, CORS).

## Маршрутизация

### Стандартный ServeMux (Go 1.22+)

Начиная с Go 1.22, стандартный маршрутизатор поддерживает методы и параметры в URL.

```
mux := http.NewServeMux()

mux.HandleFunc("GET /api/users", listUsers)
mux.HandleFunc("GET /api/users/{id}", getUser)
mux.HandleFunc("POST /api/users", createUser)
mux.HandleFunc("DELETE /api/users/{id}", deleteUser)

http.ListenAndServe(":8080", mux)
```

Для большинства проектов этого достаточно. Фреймворк нужен, только если вам нужны группы маршрутов, встроенная валидация или WebSocket.

## Middleware

Middleware — это функция-обертка вокруг обработчика. Она выполняется **до** и/или **после** основного кода.

Типичные задачи для middleware:
- Логирование (записать, какой запрос пришел и сколько занял).
- Авторизация (проверить токен).
- Паника-рекавери (если обработчик запаниковал, не ронять весь сервер).
- CORS (разрешить запросы с других доменов).

### Как это выглядит

Middleware — это функция, которая принимает **http.Handler** и возвращает новый **http.Handler**.

```
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        next.ServeHTTP(w, r)

        duration := time.Since(start)
        fmt.Printf("%s %s — %v\n", r.Method, r.URL.Path, duration)
    })
}
```

### Применение

```
func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /api/users", listUsers)

    handler := loggingMiddleware(mux)

    http.ListenAndServe(":8080", handler)
}
```

Теперь каждый запрос будет логироваться: **GET /api/users — 2.3ms**.

### Цепочка middleware

Middleware можно вкладывать друг в друга. Запрос проходит через них как через слои луковицы.

```
func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("GET /api/users", listUsers)

    handler := recoveryMiddleware(loggingMiddleware(corsMiddleware(mux)))

    http.ListenAndServe(":8080", handler)
}
```

### Recovery Middleware (защита от паники)

Если обработчик запаниковал, весь сервер упадет. Этот middleware ловит панику и возвращает 500 вместо краша.

```
func recoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                fmt.Printf("PANIC: %v\n", err)
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            }
        }()
        next.ServeHTTP(w, r)
    })
}
```

## Итог

1. Стандартный **ServeMux** (Go 1.22+) поддерживает методы и параметры URL — этого хватает для большинства API.
2. **Middleware** — обертка вокруг обработчика для общей логики (логирование, авторизация).
3. Middleware вкладываются друг в друга: **recovery(logging(cors(handler)))**.
4. Recovery middleware — обязателен в продакшене, чтобы сервер не падал от паники.
