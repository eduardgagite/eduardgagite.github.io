---
title: "Экосистема: sqlx, pgx, GORM"
category: "golang"
categoryTitle: "Go"
section: "database"
sectionTitle: "Базы данных"
sectionOrder: 9
order: 4
---

Стандартный **database/sql** — мощный, но многословный. Для каждого запроса приходится вручную вызывать **Scan** для каждой колонки. На реальных проектах это быстро утомляет. Экосистема Go предлагает три основных подхода поверх стандартной библиотеки.

## sqlx — расширение database/sql

**sqlx** — самая популярная надстройка над database/sql. Она добавляет удобные методы, но не меняет саму модель: вы по-прежнему пишете SQL руками.

```bash
go get github.com/jmoiron/sqlx
```

### Сканирование в структуру

Вместо ручного **Scan** по каждой колонке — автоматическое маппирование через теги **db**:

```go
type User struct {
    ID    int    `db:"id"`
    Name  string `db:"name"`
    Email string `db:"email"`
}

func getUser(db *sqlx.DB, id int) (User, error) {
    var user User
    err := db.Get(&user, "SELECT id, name, email FROM users WHERE id = $1", id)
    return user, err
}

func listUsers(db *sqlx.DB) ([]User, error) {
    var users []User
    err := db.Select(&users, "SELECT id, name, email FROM users ORDER BY id")
    return users, err
}
```

**db.Get** — одна строка в структуру. **db.Select** — несколько строк в слайс. Без ручного цикла **rows.Next()** + **rows.Scan()**.

### Named-запросы

```go
user := User{Name: "Alice", Email: "alice@example.com"}
_, err := db.NamedExec(
    "INSERT INTO users (name, email) VALUES (:name, :email)",
    user,
)
```

Вместо позиционных **$1**, **$2** используются имена полей структуры.

### Когда использовать

**sqlx** — хороший выбор, если вы хотите писать чистый SQL, но не хотите ручной **Scan**. Он не генерирует запросы и не скрывает SQL — только убирает рутину.

## pgx — нативный драйвер PostgreSQL

**pgx** — специализированный драйвер для PostgreSQL, который работает быстрее стандартного **lib/pq** и поддерживает продвинутые возможности Postgres.

```bash
go get github.com/jackc/pgx/v5
```

### Подключение

```go
import (
    "context"
    "github.com/jackc/pgx/v5/pgxpool"
)

func connectDB(ctx context.Context) (*pgxpool.Pool, error) {
    pool, err := pgxpool.New(ctx, "postgres://user:pass@localhost:5432/mydb")
    if err != nil {
        return nil, err
    }
    return pool, nil
}
```

**pgxpool.Pool** — встроенный пул соединений, заменяющий **sql.DB**.

### Запросы

```go
var name string
err := pool.QueryRow(ctx, "SELECT name FROM users WHERE id = $1", 42).Scan(&name)

rows, err := pool.Query(ctx, "SELECT id, name FROM users")
defer rows.Close()
for rows.Next() {
    var id int
    var name string
    rows.Scan(&id, &name)
}
```

### Поддержка типов PostgreSQL

pgx нативно поддерживает типы, которые database/sql не умеет: **jsonb**, **uuid**, **inet**, **hstore**, массивы, **COPY**-протокол для массовой вставки.

```go
import "github.com/jackc/pgx/v5/pgtype"

var data pgtype.JSONBCodec
```

### pgx как database/sql драйвер

Если нужна совместимость с database/sql (например, для sqlx или миграций):

```go
import (
    "database/sql"
    _ "github.com/jackc/pgx/v5/stdlib"
)

db, err := sql.Open("pgx", "postgres://user:pass@localhost:5432/mydb")
```

### Когда использовать

**pgx** — лучший выбор для PostgreSQL-проектов. Быстрее lib/pq, поддерживает больше типов данных, активно развивается. Для новых проектов с PostgreSQL рекомендуется использовать pgx вместо lib/pq.

## GORM — ORM для Go

**GORM** — полноценный ORM (Object-Relational Mapping). Вместо SQL вы работаете со структурами, а GORM генерирует запросы.

```bash
go get gorm.io/gorm
go get gorm.io/driver/postgres
```

### Подключение

```go
import (
    "gorm.io/gorm"
    "gorm.io/driver/postgres"
)

func connectDB() (*gorm.DB, error) {
    dsn := "host=localhost user=myuser password=secret dbname=mydb port=5432 sslmode=disable"
    return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}
```

### Модели

```go
type User struct {
    ID        uint   `gorm:"primaryKey"`
    Name      string `gorm:"size:255;not null"`
    Email     string `gorm:"uniqueIndex"`
    CreatedAt time.Time
    UpdatedAt time.Time
}
```

GORM автоматически создаст таблицу через **AutoMigrate**:

```go
db.AutoMigrate(&User{})
```

### CRUD-операции

```go
// Create
user := User{Name: "Alice", Email: "alice@example.com"}
db.Create(&user)

// Read
var found User
db.First(&found, 1)                               // по ID
db.Where("email = ?", "alice@example.com").First(&found)  // по условию

// Update
db.Model(&found).Update("name", "Bob")

// Delete
db.Delete(&found)

// List с пагинацией
var users []User
db.Limit(10).Offset(20).Find(&users)
```

### Связи (Associations)

```go
type Order struct {
    ID     uint
    Total  float64
    UserID uint
    User   User
}

// Eager loading
var orders []Order
db.Preload("User").Find(&orders)
```

### Когда использовать

GORM подходит для **CRUD-приложений** с простыми запросами: админки, REST API, прототипы. Для сложных запросов (аналитика, агрегации, оконные функции) GORM становится помехой — проще написать SQL напрямую.

## Сравнение подходов

| | database/sql | sqlx | pgx | GORM |
|---|---|---|---|---|
| SQL вручную | да | да | да | нет (генерирует) |
| Автосканирование | нет | да | нет (есть pgx/v5 с CollectRows) | да |
| Поддержка БД | все | все | только PostgreSQL | все (через драйверы) |
| Миграции | нет | нет | нет | AutoMigrate |
| Производительность | высокая | высокая | максимальная | средняя |
| Кривая обучения | низкая | низкая | средняя | высокая |

## Рекомендация для новых проектов

1. **PostgreSQL** → pgx + sqlx (через pgx/stdlib). Максимальная производительность и удобство.
2. **Любая БД** + простой CRUD → GORM. Быстрый старт, автомиграции.
3. **Любая БД** + сложные запросы → database/sql или sqlx. Полный контроль над SQL.
4. **Типобезопасность** → sqlc (генерирует Go-код из SQL-запросов). См. статью «go generate и кодогенерация».

## Итого

**database/sql** — фундамент, но многословный. **sqlx** добавляет удобство (Get, Select, NamedExec) без смены парадигмы. **pgx** — лучший драйвер для PostgreSQL с нативной поддержкой типов. **GORM** — полноценный ORM для CRUD-приложений. Выбирайте инструмент под задачу: для простого API — GORM, для контроля — sqlx, для PostgreSQL — pgx.

## Смотрите также

- **database/sql и подключение** — основы работы с БД в Go (раздел «Базы данных → database/sql и подключение»).
- **Транзакции и prepared statements** — управление транзакциями (раздел «Базы данных → Транзакции и prepared statements»).
- **go generate и кодогенерация** — sqlc для типобезопасных SQL-запросов (раздел «Продвинутые возможности → go generate и кодогенерация»).
