---
title: "Рефлексия (reflect)"
category: "golang"
categoryTitle: "Go"
section: "advanced"
sectionTitle: "Продвинутые возможности"
sectionOrder: 13
order: 1
---

Рефлексия позволяет программе изучать и изменять свою структуру во время выполнения. В Go это реализовано через пакет **reflect**. Он используется в стандартной библиотеке повсюду — в **fmt**, **encoding/json**, **database/sql** — но в прикладном коде нужен редко.

## Два ключевых типа: Type и Value

Пакет **reflect** строится вокруг двух типов:
- **reflect.Type** — описывает тип переменной.
- **reflect.Value** — содержит само значение и позволяет с ним работать.

```
x := 42
t := reflect.TypeOf(x)
v := reflect.ValueOf(x)

fmt.Println(t)          // int
fmt.Println(t.Kind())   // int
fmt.Println(v)          // 42
fmt.Println(v.Int())    // 42
```

**Kind** — это более грубая классификация типа: **int**, **string**, **struct**, **ptr**, **slice**, **map** и т.д. **Type** — точный тип, например **time.Duration** (который на уровне Kind тоже **int64**).

## Изучение структуры

```
type User struct {
    Name  string `json:"name"`
    Age   int    `json:"age,omitempty"`
    email string // неэкспортированное поле
}

u := User{Name: "Alice", Age: 30}
t := reflect.TypeOf(u)

fmt.Println(t.Name())   // User
fmt.Println(t.NumField()) // 3

for i := 0; i < t.NumField(); i++ {
    field := t.Field(i)
    fmt.Printf("Поле: %s, тип: %s, тег: %s\n",
        field.Name, field.Type, field.Tag.Get("json"))
}
// Поле: Name, тип: string, тег: name
// Поле: Age, тип: int, тег: age,omitempty
// Поле: email, тип: string, тег:
```

Чтение тегов структуры — это то, как **encoding/json** знает, какой JSON-ключ соответствует какому полю.

## Чтение и изменение значений

Чтобы изменить значение через рефлексию, нужно передать **указатель**:

```
u := User{Name: "Alice", Age: 30}
v := reflect.ValueOf(&u).Elem() // Elem() разыменовывает указатель

// Чтение
nameField := v.FieldByName("Name")
fmt.Println(nameField.String()) // Alice

// Запись (только для экспортированных полей)
if nameField.CanSet() {
    nameField.SetString("Bob")
}
fmt.Println(u.Name) // Bob
```

**CanSet** возвращает **false** для неэкспортированных полей — их нельзя изменить через рефлексию.

## Вызов методов

```
type Greeter struct {
    Name string
}

func (g Greeter) Hello(greeting string) string {
    return fmt.Sprintf("%s, %s!", greeting, g.Name)
}

g := Greeter{Name: "World"}
v := reflect.ValueOf(g)

method := v.MethodByName("Hello")
args := []reflect.Value{reflect.ValueOf("Hello")}
result := method.Call(args)

fmt.Println(result[0].String()) // Hello, World!
```

## Практический пример: универсальный принтер структур

```
func printStruct(v interface{}) {
    t := reflect.TypeOf(v)
    val := reflect.ValueOf(v)

    if t.Kind() == reflect.Ptr {
        t = t.Elem()
        val = val.Elem()
    }

    if t.Kind() != reflect.Struct {
        fmt.Printf("%v\n", v)
        return
    }

    fmt.Printf("Тип: %s\n", t.Name())
    for i := 0; i < t.NumField(); i++ {
        field := t.Field(i)
        value := val.Field(i)
        if field.IsExported() {
            fmt.Printf("  %s: %v\n", field.Name, value.Interface())
        }
    }
}
```

## Когда использовать рефлексию

Рефлексия уместна в:
- Библиотеках сериализации (JSON, YAML, XML).
- ORM-библиотеках для маппинга структур на таблицы.
- Тестовых утилитах (deep equal, генерация тестовых данных).
- Dependency injection фреймворках.

В прикладном коде рефлексия — признак что-то пошло не так. Если вы пишете рефлексию в бизнес-логике, скорее всего задачу лучше решить через интерфейсы или дженерики.

## Производительность

Рефлексия медленная — в 10-100 раз медленнее прямых вызовов. Если вам нужна высокая производительность при работе со структурами, рассмотрите:
- **Кодогенерацию** (go generate) — генерируете обычный код.
- **Unsafe** — для очень специфических случаев.
- **Дженерики** (Go 1.18+) — решают многие задачи без рефлексии.

## Итого

Пакет **reflect** даёт полный доступ к типам и значениям во время выполнения. Он лежит в основе JSON, ORM и других библиотек. **В прикладном коде используйте его с осторожностью** — рефлексия медленная и делает код труднее для понимания. Для новых задач сначала оцените, решают ли проблему дженерики или интерфейсы.
