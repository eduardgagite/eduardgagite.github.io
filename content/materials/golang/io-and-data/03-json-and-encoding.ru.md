---
title: "JSON и сериализация"
category: "golang"
categoryTitle: "Go"
section: "io-and-data"
sectionTitle: "I/O и данные"
sectionOrder: 5
order: 3
---

JSON — это формат обмена данными, который используется повсеместно: REST API, конфигурационные файлы, логи, межсервисное общение. Go имеет встроенную поддержку JSON в пакете `encoding/json`.

## Теги структур (Struct Tags)

Чтобы Go знал, как превратить структуру в JSON (и обратно), используются **теги** — метаданные, записанные в обратных кавычках после типа поля.

```go
type User struct {
    Name     string `json:"username"`
    Age      int    `json:"age"`
    Password string `json:"-"`
    Email    string `json:"email,omitempty"`
}
```

### Разбор тегов

- `json:"username"` — В JSON это поле будет называться `username` (а не `Name`).
- `json:"-"` — Минус означает "не включать в JSON вообще". Идеально для паролей, токенов и секретов.
- `json:"email,omitempty"` — Если поле пустое (нулевое значение), оно не попадет в JSON. Удобно, чтобы не засорять ответ полями типа `"email": ""`.

**Важно**: Поля должны начинаться с **Заглавной** буквы. Приватные поля (с маленькой буквы) пакет `json` просто не увидит — они не попадут ни в JSON, ни обратно.

## Сериализация (Структура -> JSON)

Функция `json.Marshal` превращает Go-структуру в срез байтов (JSON).

```go
user := User{
    Name:     "Alice",
    Age:      25,
    Password: "super_secret",
    Email:    "alice@mail.com",
}

data, err := json.Marshal(user)
if err != nil {
    panic(err)
}

fmt.Println(string(data))
// {"username":"Alice","age":25,"email":"alice@mail.com"}
// Password не попал (json:"-"), Email попал (не пустой)
```

### Красивый вывод (MarshalIndent)

Для отладки или логов удобно использовать `MarshalIndent` — он добавляет переносы строк и отступы.

```go
data, _ := json.MarshalIndent(user, "", "  ")
fmt.Println(string(data))
// {
//   "username": "Alice",
//   "age": 25,
//   "email": "alice@mail.com"
// }
```

## Десериализация (JSON -> Структура)

Функция `json.Unmarshal` делает обратное: берет JSON и заполняет структуру.

```go
jsonStr := `{"username": "Bob", "age": 40, "email": "bob@mail.com"}`

var user User
err := json.Unmarshal([]byte(jsonStr), &user)
if err != nil {
    fmt.Println("Ошибка парсинга:", err)
    return
}

fmt.Println(user.Name)  // Bob
fmt.Println(user.Age)   // 40
fmt.Println(user.Email) // bob@mail.com
```

**Обратите внимание**: Передаем `&user` (указатель), чтобы функция могла изменить нашу переменную. Без `&` Go создаст копию, заполнит её и выбросит.

### Что если в JSON есть лишние поля?

Go спокойно их проигнорирует. Это удобно: API может вернуть 20 полей, а вам нужны только 3.

```go
jsonStr := `{"username": "Bob", "age": 40, "country": "USA", "phone": "+1234"}`

var user User
json.Unmarshal([]byte(jsonStr), &user)
// country и phone просто проигнорируются, ошибки не будет
```

## Потоковый JSON (Encoder/Decoder)

Если вы работаете с `io.Writer` (HTTP-ответ, файл), удобнее использовать `json.Encoder`. Он пишет JSON напрямую в поток, без промежуточного создания `[]byte`.

```go
// Запись JSON в HTTP ответ
func handler(w http.ResponseWriter, r *http.Request) {
    user := User{Name: "Alice", Age: 25}
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}
```

Аналогично `json.Decoder` читает JSON из `io.Reader`:

```go
// Чтение JSON из тела HTTP запроса
func handler(w http.ResponseWriter, r *http.Request) {
    var user User
    json.NewDecoder(r.Body).Decode(&user)
    fmt.Println(user.Name)
}
```

## Итог

1. Используйте **теги** `json:"name"`, чтобы управлять именами полей в JSON.
2. `json:"-"` — скрыть поле (пароли, секреты).
3. `json:"field,omitempty"` — не включать пустые значения.
4. `Marshal` / `Unmarshal` — для работы с `[]byte`.
5. `Encoder` / `Decoder` — для потоков (HTTP, файлы).
