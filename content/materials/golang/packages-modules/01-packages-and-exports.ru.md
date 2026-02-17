---
title: "Пакеты и экспортируемые имена"
category: "golang"
categoryTitle: "Go"
section: "packages-modules"
sectionTitle: "Пакеты и модули"
sectionOrder: 4
order: 1
---

Когда проект растет, держать весь код в одном файле становится невозможно. Нужна организация. В Go код организуется в **пакеты** (packages).

Пакет — это просто папка с `.go` файлами. Все файлы в одной папке принадлежат одному пакету.

## Как устроен пакет

В начале каждого файла **обязательно** стоит строка `package имя_пакета`.

```go
// Файл: math/calculator.go
package math

func Add(a, b int) int {
    return a + b
}

func Multiply(a, b int) int {
    return a * b
}
```

Все файлы в одной папке должны иметь **одинаковое** имя пакета. Нельзя в одной папке смешивать `package main` и `package math` — будет ошибка компиляции.

## Экспорт: Публичное vs Приватное

В Go нет ключевых слов `public`, `private` или `protected`. Видимость определяется **регистром первой буквы** имени.

### С Заглавной буквы — Экспортируемое (public)

Функции, типы и переменные, начинающиеся с большой буквы, **видны** из других пакетов.

```go
package user

// ExportedFunc — видна всем, кто импортирует пакет user
func CreateUser(name string) { ... }

// User — структура видна всем
type User struct {
    Name  string // Поле видно всем
    Email string // Поле видно всем
    age   int    // Поле СКРЫТО (маленькая буква)
}
```

### Со строчной буквы — Приватное (private)

Имена с маленькой буквы доступны **только внутри своего пакета**.

```go
package user

// helperFunc — НЕ видна снаружи
func helperFunc() { ... }

// validateEmail — тоже скрыта
func validateEmail(email string) bool { ... }
```

### Практический пример

```go
// Файл: store/store.go
package store

type Store struct {
    items []string // Скрыто — прямой доступ закрыт
}

// NewStore — экспортирован, можно вызвать из main
func NewStore() *Store {
    return &Store{items: make([]string, 0)}
}

// AddItem — экспортирован
func (s *Store) AddItem(item string) {
    s.items = append(s.items, item)
}

// Count — экспортирован
func (s *Store) Count() int {
    return len(s.items)
}
```

```go
// Файл: main.go
package main

import (
    "fmt"
    "myproject/store"
)

func main() {
    s := store.NewStore()
    s.AddItem("Go книга")
    fmt.Println(s.Count())  // 1

    // s.items — ОШИБКА! Поле items приватное
}
```

Мы **скрыли** внутреннее устройство Store (поле `items`) и дали пользователям только безопасные методы. Это называется **инкапсуляция**.

## Импорт пакетов

```go
import (
    "fmt"                    // Стандартная библиотека
    "strings"                // Стандартная библиотека
    "myproject/store"        // Наш локальный пакет
    "github.com/gin-gonic/gin" // Внешняя библиотека
)
```

### Алиасы (переименование при импорте)

Если два пакета имеют одинаковое имя, можно задать алиас.

```go
import (
    "math/rand"          // Стандартный rand
    crand "crypto/rand"  // Криптографический rand (через алиас)
)
```

### Пустой импорт

Иногда пакет нужно импортировать только ради его побочных эффектов (регистрация драйвера БД, например).

```go
import _ "github.com/lib/pq" // Регистрирует PostgreSQL драйвер
```

## Пакет main

Пакет `main` — особенный. Он говорит компилятору: "Это не библиотека, а программа". В нём обязательно должна быть функция `main()`.

Если вы создаете библиотеку (которую другие будут импортировать), пакет **не должен** называться `main`.

## Итог

1. **Папка = Пакет**. Все файлы в папке принадлежат одному пакету.
2. **Заглавная буква** = Видно всем (`CreateUser`, `Store`).
3. **Строчная буква** = Видно только внутри пакета (`helperFunc`, `items`).
4. Используйте приватность, чтобы скрыть внутренности и показать только безопасный API.
