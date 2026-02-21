---
title: "Миграции и схема"
category: "golang"
categoryTitle: "Go"
section: "database"
sectionTitle: "Базы данных"
sectionOrder: 9
order: 3
---

Код приложения хранится в Git. Любое изменение можно посмотреть, откатить, перенести на другой сервер. А что насчет структуры базы данных?

Если один разработчик добавил колонку в таблицу, а другой об этом не знает — приложение сломается. **Миграции** решают эту проблему: структура БД тоже хранится в коде и применяется автоматически.

## Что такое миграция

Миграция — это файл с SQL-командами, которые изменяют структуру базы. Каждая миграция имеет:
1. **Порядковый номер** (или timestamp) — чтобы применять в правильном порядке.
2. **Up** — что делать при применении (добавить таблицу, колонку).
3. **Down** — что делать при откате (удалить таблицу, колонку).

```
migrations/
├── 001_create_users.up.sql
├── 001_create_users.down.sql
├── 002_add_email_to_users.up.sql
└── 002_add_email_to_users.down.sql
```

### Пример файлов

```
-- 001_create_users.up.sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

```
-- 001_create_users.down.sql
DROP TABLE IF EXISTS users;
```

```
-- 002_add_email_to_users.up.sql
ALTER TABLE users ADD COLUMN email VARCHAR(255);
```

```
-- 002_add_email_to_users.down.sql
ALTER TABLE users DROP COLUMN email;
```

## Инструмент: golang-migrate

Самый популярный инструмент для миграций в Go — **golang-migrate**.

### Установка

```
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

### Создание миграции

```
migrate create -ext sql -dir migrations -seq add_orders_table
```

Создаст два файла: **000003_add_orders_table.up.sql** и **000003_add_orders_table.down.sql**.

### Применение

```
migrate -path migrations -database "postgres://user:pass@localhost:5432/mydb?sslmode=disable" up

migrate -path migrations -database "..." down 1

migrate -path migrations -database "..." version
```

## Миграции из кода

Можно запускать миграции при старте приложения (удобно для Docker).

```
import (
    "github.com/golang-migrate/migrate/v4"
    _ "github.com/golang-migrate/migrate/v4/database/postgres"
    _ "github.com/golang-migrate/migrate/v4/source/file"
)

func runMigrations(dbURL string) error {
    m, err := migrate.New("file://migrations", dbURL)
    if err != nil {
        return err
    }

    if err := m.Up(); err != nil && err != migrate.ErrNoChange {
        return err
    }

    fmt.Println("Миграции применены")
    return nil
}
```

## Правила работы с миграциями

1. **Никогда не редактируйте** уже примененную миграцию. Если нужно изменить таблицу — создайте новую миграцию.
2. **Всегда пишите down-миграцию**. Это страховка: можно откатить изменения, если что-то пошло не так.
3. **Коммитьте миграции в Git**. Они — часть кода приложения.
4. **Тестируйте миграции**: применил up, потом down, потом снова up. Если не сломалось — всё ок.

## Итог

1. Миграции — это версионирование структуры БД.
2. Каждое изменение — отдельный файл (up + down).
3. Используйте **golang-migrate** для управления миграциями.
4. Никогда не меняйте таблицы руками на продакшене — только через миграции.
