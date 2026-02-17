---
title: "Тестовые зависимости и интерфейсы"
category: "golang"
categoryTitle: "Go"
section: "testing"
sectionTitle: "Тестирование"
sectionOrder: 7
order: 2
---

Тестировать чистые функции (вход -> выход) легко. Но что если ваш код ходит в базу данных, отправляет HTTP-запросы или пишет в файл? Запускать реальную БД для каждого теста — медленно и ненадежно.

Решение: **подмена зависимостей** через интерфейсы.

## Проблема

```go
type UserService struct{}

func (s *UserService) GetUser(id int) (*User, error) {
    // Реальный запрос в PostgreSQL
    row := db.QueryRow("SELECT name FROM users WHERE id = $1", id)
    // ...
}
```

Чтобы протестировать `GetUser`, нам нужна работающая БД с данными. Это сложно, медленно и хрупко.

## Решение: Интерфейс + Подмена

### Шаг 1: Выделяем интерфейс

Вместо прямого обращения к БД, сервис работает через **интерфейс**.

```go
// Контракт: "кто-то, кто умеет доставать пользователей"
type UserRepository interface {
    FindByID(id int) (*User, error)
}

type UserService struct {
    repo UserRepository // Зависимость через интерфейс
}

func NewUserService(repo UserRepository) *UserService {
    return &UserService{repo: repo}
}

func (s *UserService) GetUser(id int) (*User, error) {
    user, err := s.repo.FindByID(id)
    if err != nil {
        return nil, fmt.Errorf("не удалось найти пользователя: %w", err)
    }
    return user, nil
}
```

### Шаг 2: Реальная реализация (для продакшена)

```go
type PostgresUserRepo struct {
    db *sql.DB
}

func (r *PostgresUserRepo) FindByID(id int) (*User, error) {
    // Реальный запрос к PostgreSQL
    row := r.db.QueryRow("SELECT name, email FROM users WHERE id = $1", id)
    var u User
    err := row.Scan(&u.Name, &u.Email)
    return &u, err
}
```

### Шаг 3: Фейковая реализация (для тестов)

```go
// В файле user_service_test.go
type FakeUserRepo struct {
    users map[int]*User
}

func (r *FakeUserRepo) FindByID(id int) (*User, error) {
    user, ok := r.users[id]
    if !ok {
        return nil, fmt.Errorf("user %d not found", id)
    }
    return user, nil
}
```

### Шаг 4: Тест

```go
func TestGetUser(t *testing.T) {
    // Создаем фейковый репозиторий с данными
    fakeRepo := &FakeUserRepo{
        users: map[int]*User{
            1: {Name: "Alice", Email: "alice@mail.com"},
        },
    }

    // Подставляем фейк вместо реальной БД
    service := NewUserService(fakeRepo)

    // Тестируем
    user, err := service.GetUser(1)
    if err != nil {
        t.Fatalf("неожиданная ошибка: %v", err)
    }
    if user.Name != "Alice" {
        t.Errorf("имя = %s; хотели Alice", user.Name)
    }
}

func TestGetUser_NotFound(t *testing.T) {
    fakeRepo := &FakeUserRepo{users: map[int]*User{}}
    service := NewUserService(fakeRepo)

    _, err := service.GetUser(999)
    if err == nil {
        t.Error("ожидали ошибку, но получили nil")
    }
}
```

Тесты работают **мгновенно**, без базы данных, без Docker, без сети.

## Тестирование HTTP-обработчиков

Стандартная библиотека Go предоставляет пакет `httptest` для тестирования HTTP без реального сервера.

```go
func TestHealthHandler(t *testing.T) {
    // Создаем "фейковый" запрос
    req := httptest.NewRequest("GET", "/health", nil)
    
    // Создаем "фейковый" ResponseWriter
    w := httptest.NewRecorder()

    // Вызываем обработчик напрямую
    HealthHandler(w, req)

    // Проверяем результат
    if w.Code != http.StatusOK {
        t.Errorf("статус = %d; хотели 200", w.Code)
    }

    if w.Body.String() != "ok" {
        t.Errorf("тело = %s; хотели ok", w.Body.String())
    }
}
```

## Итог

1. Зависимости (БД, API, файлы) прячьте за **интерфейсами**.
2. В тестах подставляйте **фейковые** реализации.
3. Для HTTP-тестов используйте `httptest.NewRecorder`.
4. Тесты должны быть быстрыми и не зависеть от внешних сервисов.
