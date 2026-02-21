---
title: "Обёртки ошибок и контекст"
category: "golang"
categoryTitle: "Go"
section: "best-practices"
sectionTitle: "Практики и качество"
sectionOrder: 11
order: 1
---

В разделе "Базовые конструкции" мы разобрали основы: **if err != nil**. Но в реальном проекте этого мало. Когда ошибка проходит через 5 слоев (HTTP -> Service -> Repository -> SQL), к моменту логирования нужно понимать, **где** она произошла и **почему**.

## Проблема: Потеря контекста

```
func GetUser(id int) (*User, error) {
    user, err := db.FindUser(id)
    if err != nil {
        return nil, err
    }
    return user, nil
}
```

Когда эта ошибка долетит до логов, вы увидите: **connection refused**. Но к какому сервису? В каком методе? С каким ID?

## Решение: fmt.Errorf с %w

Оператор **%w** в **fmt.Errorf** **оборачивает** ошибку: добавляет контекст, но сохраняет оригинал внутри.

```
func GetUser(id int) (*User, error) {
    user, err := db.FindUser(id)
    if err != nil {
        return nil, fmt.Errorf("GetUser(id=%d): %w", id, err)
    }
    return user, nil
}
```

Теперь в логах: **GetUser(id=42): connection refused**. Сразу понятно, что случилось и где.

### Цепочка обёрток

Каждый слой добавляет свой контекст:

```
func (r *Repo) FindUser(id int) (*User, error) {
    err := r.db.QueryRow(...)
    if err != nil {
        return nil, fmt.Errorf("FindUser query: %w", err)
    }
}

func (s *Service) GetUser(id int) (*User, error) {
    user, err := s.repo.FindUser(id)
    if err != nil {
        return nil, fmt.Errorf("GetUser(id=%d): %w", id, err)
    }
}

func handleGetUser(w http.ResponseWriter, r *http.Request) {
    user, err := service.GetUser(42)
    if err != nil {
        log.Printf("handleGetUser: %v", err)
    }
}
```

## Проверка типа ошибки (errors.Is, errors.As)

Иногда нужно понять, **какая именно** ошибка произошла, несмотря на обёртки.

### errors.Is — проверка на конкретную ошибку

```
import "errors"

if errors.Is(err, sql.ErrNoRows) {
    http.Error(w, "Not Found", 404)
} else {
    log.Printf("Ошибка: %v", err)
    http.Error(w, "Internal Error", 500)
}
```

**errors.Is** "разворачивает" всю цепочку обёрток и проверяет, есть ли внутри **sql.ErrNoRows**.

### errors.As — извлечение типизированной ошибки

```
var pgErr *pgconn.PgError
if errors.As(err, &pgErr) {
    fmt.Println("Код ошибки PostgreSQL:", pgErr.Code)
}
```

## Свои типы ошибок

Для сложных проектов полезно создать свои типы ошибок.

```
type NotFoundError struct {
    Entity string
    ID     int
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s с ID %d не найден", e.Entity, e.ID)
}

func GetUser(id int) (*User, error) {
    user, err := repo.Find(id)
    if err != nil {
        return nil, &NotFoundError{Entity: "User", ID: id}
    }
    return user, nil
}

var nfErr *NotFoundError
if errors.As(err, &nfErr) {
    fmt.Printf("%s не найден\n", nfErr.Entity)
}
```

## Итог

1. **Оборачивайте** ошибки через **fmt.Errorf("контекст: %w", err)**.
2. Каждый слой добавляет свой контекст (имя функции, параметры).
3. **errors.Is** — проверка на конкретную ошибку (через цепочку обёрток).
4. **errors.As** — извлечение типизированной ошибки.
5. Не оборачивайте ошибки, которые вы обрабатываете на месте (только те, что прокидываете вверх).
