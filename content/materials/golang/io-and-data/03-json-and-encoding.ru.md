---
title: "JSON и сериализация"
category: "golang"
categoryTitle: "Go"
section: "io-and-data"
sectionTitle: "I/O и данные"
sectionOrder: 5
order: 3
---

В веб-разработке мы постоянно гоняем данные туда-сюда в формате JSON. Go имеет отличную встроенную поддержку JSON в пакете `encoding/json`.

## Теги структур

Чтобы Go знал, как превратить вашу структуру в JSON, используются **теги** (tags) — текст в обратных кавычках после типа поля.

```go
type User struct {
    Name     string `json:"username"`        // В JSON будет "username"
    Age      int    `json:"age"`             // В JSON будет "age"
    Password string `json:"-"`               // Это поле вообще не попадет в JSON
    Email    string `json:"email,omitempty"` // Если пусто, поле не попадет в JSON
}
```

**Важно**: Поля должны начинаться с **Заглавной** буквы, чтобы пакет `json` мог их прочитать (вспоминаем про публичность/приватность).

## Сериализация (Marshal)

Превращение структуры в JSON (байты).

```go
user := User{Name: "Alice", Age: 25, Password: "123"}

// data — это []byte
data, err := json.Marshal(user)
if err != nil {
    panic(err)
}

fmt.Println(string(data))
// Вывод: {"username":"Alice","age":25}
// (Password пропал, т.к. json:"-")
```

## Десериализация (Unmarshal)

Превращение JSON (байтов) обратно в структуру.

```go
jsonStr := `{"username": "Bob", "age": 40}`

var user User

// Передаем ссылку &user, чтобы функция могла изменить нашу переменную
err := json.Unmarshal([]byte(jsonStr), &user)
if err != nil {
    fmt.Println("Ошибка парсинга:", err)
}

fmt.Println(user.Name) // Bob
```

## Итог

1. Используйте теги `json:"name"`, чтобы управлять именами полей.
2. `Marshal` — из структуры в JSON.
3. `Unmarshal` — из JSON в структуру (нужен указатель `&`).
4. Поля должны быть экспортируемыми (с большой буквы), иначе JSON будет пустым.
