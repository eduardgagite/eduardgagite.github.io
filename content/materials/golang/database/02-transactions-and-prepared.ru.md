---
title: "Транзакции и подготовленные выражения"
category: "golang"
categoryTitle: "Go"
section: "database"
sectionTitle: "Базы данных"
sectionOrder: 9
order: 2
---

Иногда нужно выполнить несколько SQL-запросов как одну атомарную операцию: либо все выполнились, либо ни один. Например, перевод денег: списать с одного счета и зачислить на другой. Если программа упадет между двумя запросами — деньги пропадут.

Для этого существуют **транзакции**.

## Транзакция (Transaction)

Транзакция гарантирует: если что-то пошло не так, все изменения откатятся назад, как будто ничего не было.

```go
func transferMoney(db *sql.DB, from, to int, amount int) error {
    // Начинаем транзакцию
    tx, err := db.Begin()
    if err != nil {
        return err
    }

    // Списываем деньги
    _, err = tx.Exec("UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, from)
    if err != nil {
        tx.Rollback() // Откатываем все изменения
        return err
    }

    // Зачисляем деньги
    _, err = tx.Exec("UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, to)
    if err != nil {
        tx.Rollback() // Откатываем все изменения
        return err
    }

    // Всё прошло хорошо — фиксируем
    return tx.Commit()
}
```

### Паттерн с defer

Чтобы не забыть откатить транзакцию при ошибке:

```go
func transferMoney(db *sql.DB, from, to int, amount int) error {
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    // Если мы не дойдем до Commit, откатим всё
    defer tx.Rollback()

    if _, err := tx.Exec("UPDATE accounts SET balance = balance - $1 WHERE id = $2", amount, from); err != nil {
        return err
    }

    if _, err := tx.Exec("UPDATE accounts SET balance = balance + $1 WHERE id = $2", amount, to); err != nil {
        return err
    }

    // Если дошли сюда, значит ошибок нет
    return tx.Commit() // Rollback после Commit — безопасен (ничего не сделает)
}
```

## Подготовленные выражения (Prepared Statements)

Если вы выполняете один и тот же запрос много раз (например, вставка 1000 строк), выгоднее "подготовить" его один раз, а потом многократно выполнять с разными параметрами.

```go
// Подготавливаем запрос один раз
stmt, err := db.Prepare("INSERT INTO users (name, email) VALUES ($1, $2)")
if err != nil {
    panic(err)
}
defer stmt.Close()

// Выполняем много раз с разными данными
users := []struct{ Name, Email string }{
    {"Alice", "alice@mail.com"},
    {"Bob", "bob@mail.com"},
    {"Charlie", "charlie@mail.com"},
}

for _, u := range users {
    _, err := stmt.Exec(u.Name, u.Email)
    if err != nil {
        fmt.Printf("Ошибка при вставке %s: %v\n", u.Name, err)
    }
}
```

### Зачем это?

1. **Производительность**: БД парсит и оптимизирует запрос один раз, а не тысячу.
2. **Безопасность**: Параметры автоматически экранируются (защита от SQL-инъекций).

## Сканирование в структуру

На практике результаты запросов часто сканируют в структуры.

```go
type User struct {
    ID    int
    Name  string
    Email string
}

func getUserByID(db *sql.DB, id int) (*User, error) {
    var u User
    err := db.QueryRow(
        "SELECT id, name, email FROM users WHERE id = $1", id,
    ).Scan(&u.ID, &u.Name, &u.Email)

    if err == sql.ErrNoRows {
        return nil, nil // Не найден
    }
    if err != nil {
        return nil, err
    }
    return &u, nil
}
```

## Итог

1. **Транзакции** гарантируют атомарность: либо все запросы выполнились, либо ни один.
2. Используйте `defer tx.Rollback()` сразу после `Begin()`.
3. **Prepared Statements** ускоряют массовые операции.
4. Порядок полей в `Scan()` должен совпадать с порядком столбцов в `SELECT`.
