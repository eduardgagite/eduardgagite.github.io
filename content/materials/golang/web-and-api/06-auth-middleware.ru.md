---
title: "Аутентификация и авторизация"
category: "golang"
categoryTitle: "Go"
section: "web-and-api"
sectionTitle: "Web и API"
sectionOrder: 8
order: 6
---

Аутентификация отвечает на вопрос "Кто ты?", а авторизация — "Что тебе можно?". В Go оба механизма обычно реализуются через **middleware** — функции-обёртки вокруг HTTP-обработчиков.

## JWT — стандарт для stateless аутентификации

**JWT** (JSON Web Token) — компактный токен, который содержит информацию о пользователе. Сервер выдаёт токен при логине, клиент хранит его и передаёт в каждом запросе. Сервер проверяет подпись и читает данные без обращения к базе.

Популярная библиотека:

```
go get github.com/golang-jwt/jwt/v5
```

### Создание токена при логине

```
import (
    "time"
    "github.com/golang-jwt/jwt/v5"
)

var secretKey = []byte("your-secret-key-min-32-bytes-long")

type Claims struct {
    UserID int    `json:"user_id"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

func generateToken(userID int, role string) (string, error) {
    claims := Claims{
        UserID: userID,
        Role:   role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(secretKey)
}
```

### Проверка токена

```
func parseToken(tokenStr string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
        if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("неожиданный метод подписи: %v", t.Header["alg"])
        }
        return secretKey, nil
    })
    if err != nil {
        return nil, err
    }

    claims, ok := token.Claims.(*Claims)
    if !ok || !token.Valid {
        return nil, fmt.Errorf("невалидный токен")
    }
    return claims, nil
}
```

## Middleware для аутентификации

Middleware — это функция, которая оборачивает handler. Она проверяет токен, и если всё в порядке — передаёт управление следующему обработчику:

```
type contextKey string

const userClaimsKey contextKey = "claims"

func AuthMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            http.Error(w, "Authorization header required", http.StatusUnauthorized)
            return
        }

        // Ожидаем формат "Bearer <token>"
        parts := strings.SplitN(authHeader, " ", 2)
        if len(parts) != 2 || parts[0] != "Bearer" {
            http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
            return
        }

        claims, err := parseToken(parts[1])
        if err != nil {
            http.Error(w, "Invalid token: "+err.Error(), http.StatusUnauthorized)
            return
        }

        // Кладём claims в контекст — handlers смогут их прочитать
        ctx := context.WithValue(r.Context(), userClaimsKey, claims)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Хелпер для получения claims в handler
func ClaimsFromContext(ctx context.Context) (*Claims, bool) {
    claims, ok := ctx.Value(userClaimsKey).(*Claims)
    return claims, ok
}
```

## Middleware для авторизации по ролям

```
func RequireRole(role string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            claims, ok := ClaimsFromContext(r.Context())
            if !ok {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
                return
            }

            if claims.Role != role {
                http.Error(w, "Forbidden", http.StatusForbidden)
                return
            }

            next.ServeHTTP(w, r)
        })
    }
}
```

## Применение middleware в маршрутах

```
func main() {
    mux := http.NewServeMux()

    // Публичные роуты — без авторизации
    mux.HandleFunc("POST /login", loginHandler)
    mux.HandleFunc("GET /health", healthHandler)

    // Защищённые роуты — оборачиваем в AuthMiddleware
    mux.Handle("GET /profile", AuthMiddleware(http.HandlerFunc(profileHandler)))

    // Роут только для администраторов
    adminOnly := AuthMiddleware(RequireRole("admin")(http.HandlerFunc(adminHandler)))
    mux.Handle("GET /admin/users", adminOnly)

    http.ListenAndServe(":8080", mux)
}

func profileHandler(w http.ResponseWriter, r *http.Request) {
    claims, _ := ClaimsFromContext(r.Context())
    fmt.Fprintf(w, "Привет, пользователь %d!\n", claims.UserID)
}
```

## Handler для логина

```
type LoginRequest struct {
    Email    string `json:"email"`
    Password string `json:"password"`
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
    var req LoginRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid request body", http.StatusBadRequest)
        return
    }

    // Проверка пользователя в базе (заглушка)
    user, err := findUserByEmail(req.Email)
    if err != nil || !checkPassword(user, req.Password) {
        http.Error(w, "Invalid credentials", http.StatusUnauthorized)
        return
    }

    token, err := generateToken(user.ID, user.Role)
    if err != nil {
        http.Error(w, "Token generation failed", http.StatusInternalServerError)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"token": token})
}
```

## Refresh tokens — долгоживущие сессии

Хороший паттерн: выдавать два токена.
- **Access token** — короткий (15 минут). Используется в каждом запросе.
- **Refresh token** — длинный (7-30 дней). Хранится безопасно, используется только для получения нового access token.

Когда access token истёк, клиент отправляет refresh token на отдельный endpoint и получает новую пару токенов. Это ограничивает ущерб при утечке access token.

## Итого

Аутентификация в Go строится на **middleware** — это функции-обёртки, которые проверяют токен до вызова handler. JWT подходит для stateless API: сервер не хранит сессии, вся информация о пользователе в токене. **Передавайте claims через контекст запроса** — это стандартный способ донести данные о пользователе до handler без глобальных переменных.
