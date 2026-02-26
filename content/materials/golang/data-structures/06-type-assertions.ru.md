---
title: "Type assertions и type switch"
category: "golang"
categoryTitle: "Go"
section: "data-structures"
sectionTitle: "Структуры данных"
sectionOrder: 3
order: 6
---

Интерфейсы в Go хранят значения любого типа, реализующего нужный набор методов. Но иногда нужно узнать конкретный тип за интерфейсом и получить доступ к его специфическим методам. Для этого существуют **type assertion** и **type switch**.

## Type assertion — проверка и извлечение типа

Если у вас есть значение типа **interface{}** (или любого другого интерфейса) и вы хотите получить конкретный тип, используйте **type assertion**:

```
var i interface{} = "hello"

s := i.(string)
fmt.Println(s) // hello
```

Запись **i.(string)** означает: "Я утверждаю, что внутри **i** лежит значение типа **string**. Достань его."

Если утверждение неверно, программа запаникует:

```
var i interface{} = 42
s := i.(string) // panic: interface conversion: interface {} is int, not string
```

### Безопасная форма — с двумя возвращаемыми значениями

Чтобы не получить panic, используйте форму с двумя значениями:

```
var i interface{} = 42

s, ok := i.(string)
if !ok {
    fmt.Println("Это не строка")
    return
}
fmt.Println(s)
```

**ok** будет **false** если тип не совпадает, а **s** получит нулевое значение для своего типа. Паника не произойдёт. Всегда используйте эту форму при работе с динамическими данными.

## Type switch — удобный выбор по типу

Когда нужно обработать несколько возможных типов, **type switch** удобнее цепочки **if-else**:

```
func describe(i interface{}) string {
    switch v := i.(type) {
    case int:
        return fmt.Sprintf("int: %d", v)
    case string:
        return fmt.Sprintf("string: %q", v)
    case bool:
        return fmt.Sprintf("bool: %t", v)
    case []int:
        return fmt.Sprintf("[]int с длиной %d", len(v))
    default:
        return fmt.Sprintf("неизвестный тип: %T", v)
    }
}
```

Синтаксис **switch v := i.(type)** — это специальная форма, которая работает только в **switch**. Переменная **v** внутри каждого кейса имеет именно тот тип, который указан в **case**.

## Практический пример: обработка ошибок по типу

Самый частый use-case — разбор ошибок. В Go ошибки — это интерфейс, и конкретный тип ошибки несёт дополнительную информацию:

```
type NotFoundError struct {
    Resource string
    ID       int
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s с ID %d не найден", e.Resource, e.ID)
}

type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("поле %s: %s", e.Field, e.Message)
}

func handleError(err error) {
    switch e := err.(type) {
    case *NotFoundError:
        fmt.Printf("404: %s\n", e.Resource)
    case *ValidationError:
        fmt.Printf("400: некорректное поле %s\n", e.Field)
    default:
        fmt.Printf("500: %v\n", err)
    }
}
```

## errors.As — идиоматичный способ в современном Go

Начиная с Go 1.13, для работы с цепочками ошибок (wrapped errors) рекомендуется **errors.As** вместо type assertion:

```
var notFound *NotFoundError

if errors.As(err, &notFound) {
    fmt.Printf("Ресурс не найден: %s\n", notFound.Resource)
}
```

**errors.As** ищет ошибку нужного типа в цепочке обёрток. Это важно, когда ошибка обёрнута через **fmt.Errorf("...: %w", err)**.

## Интерфейс any и пустой интерфейс

В Go 1.18 появился псевдоним **any** для **interface{}**:

```
func printValue(v any) {
    switch val := v.(type) {
    case string:
        fmt.Println("строка:", val)
    case int:
        fmt.Println("число:", val)
    default:
        fmt.Printf("тип %T: %v\n", val, val)
    }
}
```

Предпочитайте **any** вместо **interface{}** в новом коде — это стандарт с Go 1.18.

## Когда использовать, а когда нет

Type assertion уместен, когда:
- Вы работаете с ошибками и нужно достать специфические поля.
- Вы пишете универсальный код (сериализация, логирование, тесты).
- Интерфейс намеренно скрывает конкретный тип.

Не нужен, когда:
- Вы постоянно приводите к конкретному типу — лучше использовать этот тип напрямую.
- Дженерики решают задачу лучше (с Go 1.18+).

## Итого

**Type assertion** позволяет достать конкретный тип из интерфейса, а **type switch** — элегантно обработать несколько вариантов. **Всегда используйте безопасную форму с ok**, если не уверены в типе. Для ошибок с Go 1.13+ используйте **errors.As** — это правильный идиоматичный способ проверки типа ошибки в цепочке обёрток.
