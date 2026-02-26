---
title: "Пакет fmt"
category: "golang"
categoryTitle: "Go"
section: "stdlib"
sectionTitle: "Стандартная библиотека"
sectionOrder: 12
order: 1
---

Пакет **fmt** — один из самых используемых в Go. Он отвечает за форматированный вывод и сканирование данных. Почти каждая программа начинается с **fmt.Println**.

## Основные функции вывода

```
fmt.Print("Hello")           // без перевода строки
fmt.Println("Hello", "Go")   // с переводом строки, пробел между аргументами
fmt.Printf("Name: %s\n", name) // форматированный вывод
```

Разница между ними:
- **Print** — выводит без перевода строки. Между аргументами пробел только если ни один не строка.
- **Println** — всегда добавляет пробелы между аргументами и перевод строки в конце.
- **Printf** — форматирование по шаблону с глаголами (verbs).

## Форматные глаголы (verbs)

Глагол — это спецификатор формата, начинающийся с **%**:

```
name := "Gopher"
age := 5
pi := 3.14159
active := true

fmt.Printf("%s\n", name)    // Gopher        — строка
fmt.Printf("%d\n", age)     // 5             — целое число
fmt.Printf("%f\n", pi)      // 3.141590      — дробное число
fmt.Printf("%.2f\n", pi)    // 3.14          — дробное, 2 знака после точки
fmt.Printf("%t\n", active)  // true          — булево
fmt.Printf("%v\n", name)    // Gopher        — значение в стандартном формате
fmt.Printf("%T\n", age)     // int           — тип переменной
fmt.Printf("%p\n", &name)   // 0xc0000b4010  — адрес в памяти
```

Самый универсальный глагол — **%v**: он работает с любым типом. Для структур **%+v** выводит имена полей, а **%#v** — Go-синтаксис:

```
type User struct {
    Name string
    Age  int
}

u := User{"Alice", 30}
fmt.Printf("%v\n", u)   // {Alice 30}
fmt.Printf("%+v\n", u)  // {Name:Alice Age:30}
fmt.Printf("%#v\n", u)  // main.User{Name:"Alice", Age:30}
```

## Sprintf — форматирование в строку

**Sprintf** не выводит, а возвращает отформатированную строку:

```
msg := fmt.Sprintf("Пользователь %s, возраст %d", name, age)
// msg = "Пользователь Gopher, возраст 5"
```

Это основной способ собрать строку из разных частей. Используйте его вместо конкатенации **+** когда типы разные.

## Errorf — создание ошибок

**fmt.Errorf** создаёт ошибку с форматированным сообщением:

```
userID := 42
err := fmt.Errorf("пользователь %d не найден", userID)
```

С Go 1.13 появился глагол **%w** для оборачивания ошибок. Это позволяет сохранить исходную ошибку внутри:

```
originalErr := sql.ErrNoRows
wrappedErr := fmt.Errorf("getUser: %w", originalErr)

// Распаковать можно через errors.Is или errors.As
if errors.Is(wrappedErr, sql.ErrNoRows) {
    fmt.Println("Запись не найдена")
}
```

## Fprintf — вывод в произвольный io.Writer

**Fprintf** пишет не в стандартный вывод, а в любой **io.Writer**: файл, HTTP-ответ, буфер:

```
// В файл
file, _ := os.Create("log.txt")
fmt.Fprintf(file, "Время: %s\n", time.Now())

// В HTTP-ответ
func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, %s!\n", r.URL.Query().Get("name"))
}

// В буфер
var buf bytes.Buffer
fmt.Fprintf(&buf, "count: %d", 42)
s := buf.String() // "count: 42"
```

## Sscanf — разбор строк по формату

Если **Printf** форматирует значения в строку, то **Sscanf** делает обратное — извлекает значения из строки:

```
var name string
var age int

n, err := fmt.Sscanf("Alice 30", "%s %d", &name, &age)
// name = "Alice", age = 30, n = 2 (количество успешно считанных значений)
```

## Stringer — кастомный вывод ваших типов

Если реализовать метод **String() string** для своего типа, **fmt** будет использовать его автоматически:

```
type Color int

const (
    Red Color = iota
    Green
    Blue
)

func (c Color) String() string {
    switch c {
    case Red:
        return "Red"
    case Green:
        return "Green"
    case Blue:
        return "Blue"
    default:
        return "Unknown"
    }
}

fmt.Println(Red)           // Red
fmt.Printf("%v\n", Green)  // Green
```

## Итого

**fmt** — это форматированный ввод-вывод. **Printf/Sprintf** с глаголами (**%s**, **%d**, **%v**, **%w**) покрывают 90% задач. **Sprintf** собирает строки, **Errorf** с **%w** оборачивает ошибки сохраняя цепочку. **Метод String()** на своих типах делает вывод читаемым везде — в логах, тестах, отладке.
