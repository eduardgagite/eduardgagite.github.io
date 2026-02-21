---
title: "database/sql и подключение"
category: "golang"
categoryTitle: "Go"
section: "database"
sectionTitle: "Базы данных"
sectionOrder: 9
order: 1
---

Большинство бэкендов работают с реляционными базами данных (PostgreSQL, MySQL, SQLite). В Go для этого есть стандартный пакет **database/sql**.

Он не привязан к конкретной БД — это абстракция. Конкретную БД подключает **драйвер** (отдельная библиотека).

## Установка драйвера

Для PostgreSQL:

```
go get github.com/lib/pq
```

Для MySQL:

```
go get github.com/go-sql-driver/mysql
```

## Подключение

```
import (
    "database/sql"
    "fmt"
    _ "github.com/lib/pq"
)

func main() {
    connStr := "host=localhost port=5432 user=myuser password=secret dbname=mydb sslmode=disable"

    db, err := sql.Open("postgres", connStr)
    if err != nil {
        panic(err)
    }
    defer db.Close()

    if err := db.Ping(); err != nil {
        panic(fmt.Sprintf("БД недоступна: %v", err))
    }

    fmt.Println("Подключено к БД!")
}
```

### Важно: sql.Open НЕ подключается к БД

**sql.Open** только создает объект **\*sql.DB** — это **пул соединений**. Реальное подключение произойдет при первом запросе (или при вызове **db.Ping()**).

### Настройка пула

Пул соединений управляет тем, сколько подключений к БД открыто одновременно.

```
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(10)
db.SetConnMaxLifetime(5 * time.Minute)
```

Без этих настроек Go будет открывать соединения бесконтрольно, что может перегрузить базу данных.

## Выполнение запросов

### SELECT (одна строка)

```
var name string
var age int

err := db.QueryRow("SELECT name, age FROM users WHERE id = $1", 42).Scan(&name, &age)

if err == sql.ErrNoRows {
    fmt.Println("Пользователь не найден")
} else if err != nil {
    fmt.Println("Ошибка:", err)
} else {
    fmt.Printf("Имя: %s, Возраст: %d\n", name, age)
}
```

**$1** — это placeholder (заполнитель). Go автоматически экранирует значения, защищая от SQL-инъекций. **Никогда** не склеивайте запросы через **fmt.Sprintf**!

### SELECT (несколько строк)

```
rows, err := db.Query("SELECT id, name FROM users WHERE age > $1", 18)
if err != nil {
    panic(err)
}
defer rows.Close()

for rows.Next() {
    var id int
    var name string
    if err := rows.Scan(&id, &name); err != nil {
        panic(err)
    }
    fmt.Printf("ID: %d, Имя: %s\n", id, name)
}

if err := rows.Err(); err != nil {
    panic(err)
}
```

### INSERT / UPDATE / DELETE

Для запросов, которые не возвращают строки, используйте **Exec**.

```
result, err := db.Exec("INSERT INTO users (name, age) VALUES ($1, $2)", "Alice", 30)
if err != nil {
    panic(err)
}

rowsAffected, _ := result.RowsAffected()
fmt.Printf("Добавлено строк: %d\n", rowsAffected)

lastID, _ := result.LastInsertId()
fmt.Printf("ID: %d\n", lastID)
```

## Запросы с контекстом

В продакшене всегда передавайте контекст, чтобы запрос можно было отменить.

```
ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
defer cancel()

row := db.QueryRowContext(ctx, "SELECT name FROM users WHERE id = $1", 42)
```

Если запрос не выполнится за 3 секунды, он будет отменен.

## Итог

1. **sql.Open** создает **пул соединений**, а не одно соединение.
2. Настройте пул: **SetMaxOpenConns**, **SetMaxIdleConns**.
3. Используйте **placeholders** (**$1**, **$2**) для защиты от SQL-инъекций.
4. Не забывайте **defer rows.Close()** и **defer db.Close()**.
5. В продакшене передавайте **context** через **QueryContext** / **ExecContext**.
