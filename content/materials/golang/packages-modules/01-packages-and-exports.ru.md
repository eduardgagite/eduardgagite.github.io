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

Пакет — это просто папка с **.go** файлами. Все файлы в одной папке принадлежат одному пакету.

## Как устроен пакет

В начале каждого файла **обязательно** стоит строка **package имя_пакета**.

```
package math

func Add(a, b int) int {
    return a + b
}

func Multiply(a, b int) int {
    return a * b
}
```

Все файлы в одной папке должны иметь **одинаковое** имя пакета. Нельзя в одной папке смешивать **package main** и **package math** — будет ошибка компиляции.

## Экспорт: Публичное vs Приватное

В Go нет ключевых слов **public**, **private** или **protected**. Видимость определяется **регистром первой буквы** имени.

### С Заглавной буквы — Экспортируемое (public)

Функции, типы и переменные, начинающиеся с большой буквы, **видны** из других пакетов.

```
package user

func CreateUser(name string) { ... }

type User struct {
    Name  string
    Email string
    age   int
}
```

### Со строчной буквы — Приватное (private)

Имена с маленькой буквы доступны **только внутри своего пакета**.

```
package user

func helperFunc() { ... }

func validateEmail(email string) bool { ... }
```

### Практический пример

```
package store

type Store struct {
    items []string
}

func NewStore() *Store {
    return &Store{items: make([]string, 0)}
}

func (s *Store) AddItem(item string) {
    s.items = append(s.items, item)
}

func (s *Store) Count() int {
    return len(s.items)
}
```

```
package main

import (
    "fmt"
    "myproject/store"
)

func main() {
    s := store.NewStore()
    s.AddItem("Go книга")
    fmt.Println(s.Count()) // 1
}
```

Мы **скрыли** внутреннее устройство Store (поле **items**) и дали пользователям только безопасные методы. Это называется **инкапсуляция**.

## Импорт пакетов

```
import (
    "fmt"
    "strings"
    "myproject/store"
    "github.com/gin-gonic/gin"
)
```

### Алиасы (переименование при импорте)

Если два пакета имеют одинаковое имя, можно задать алиас.

```
import (
    "math/rand"
    crand "crypto/rand"
)
```

### Пустой импорт

Иногда пакет нужно импортировать только ради его побочных эффектов (регистрация драйвера БД, например).

```
import _ "github.com/lib/pq"
```

## Пакет main

Пакет **main** — особенный. Он говорит компилятору: "Это не библиотека, а программа". В нём обязательно должна быть функция **main()**.

Если вы создаете библиотеку (которую другие будут импортировать), пакет **не должен** называться **main**.

## Итог

1. **Папка = Пакет**. Все файлы в папке принадлежат одному пакету.
2. **Заглавная буква** = Видно всем (**CreateUser**, **Store**).
3. **Строчная буква** = Видно только внутри пакета (**helperFunc**, **items**).
4. Используйте приватность, чтобы скрыть внутренности и показать только безопасный API.
