---
title: "Пакеты strings и bytes"
category: "golang"
categoryTitle: "Go"
section: "stdlib"
sectionTitle: "Стандартная библиотека"
sectionOrder: 12
order: 2
---

Строки в Go — неизменяемые последовательности байт. Пакет **strings** предоставляет все операции над строками, а **bytes** — аналогичные операции над срезами байт **[]byte**. API у них почти идентичный.

## Основные операции со строками

```
s := "Hello, Gopher!"

fmt.Println(strings.ToUpper(s))          // HELLO, GOPHER!
fmt.Println(strings.ToLower(s))          // hello, gopher!
fmt.Println(strings.TrimSpace("  hi "))  // hi
fmt.Println(strings.Trim("--hi--", "-")) // hi — убрать указанные символы с краёв
fmt.Println(strings.TrimPrefix(s, "Hello, ")) // Gopher!
fmt.Println(strings.TrimSuffix(s, "!"))       // Hello, Gopher
```

## Поиск и проверки

```
s := "Hello, Gopher!"

fmt.Println(strings.Contains(s, "Gopher"))        // true
fmt.Println(strings.HasPrefix(s, "Hello"))         // true
fmt.Println(strings.HasSuffix(s, "!"))             // true
fmt.Println(strings.Count(s, "o"))                 // 2
fmt.Println(strings.Index(s, "Gopher"))            // 7 (позиция первого вхождения)
fmt.Println(strings.LastIndex("go/go/go", "go"))   // 6
fmt.Println(strings.ContainsAny(s, "aeiou"))       // true — есть хотя бы один символ из набора
```

## Замена и разбивка

```
s := "foo bar foo baz foo"

// Replace — заменить n первых вхождений (-1 = все)
fmt.Println(strings.Replace(s, "foo", "qux", 2))    // qux bar qux baz foo
fmt.Println(strings.ReplaceAll(s, "foo", "qux"))     // qux bar qux baz qux

// Split — разбить строку по разделителю
parts := strings.Split("a,b,c", ",")
fmt.Println(parts)      // [a b c]
fmt.Println(len(parts)) // 3

// SplitN — не более N частей
parts2 := strings.SplitN("a,b,c,d", ",", 2)
fmt.Println(parts2) // [a b,c,d]

// Fields — разбить по пробельным символам
words := strings.Fields("  hello   world  ")
fmt.Println(words) // [hello world]

// Join — объединить срез в строку
fmt.Println(strings.Join([]string{"a", "b", "c"}, "-")) // a-b-c
```

## strings.Builder — эффективная сборка строк

Конкатенация через **+** в цикле создаёт новую строку на каждой итерации. Для эффективной сборки используйте **strings.Builder**:

```
var b strings.Builder
for i := 0; i < 5; i++ {
    fmt.Fprintf(&b, "item%d ", i)
}
result := b.String() // item0 item1 item2 item3 item4
```

**strings.Builder** реализует **io.Writer**, поэтому с ним работает **fmt.Fprintf**.

## strings.Reader — строка как io.Reader

Когда функция принимает **io.Reader**, а у вас строка:

```
r := strings.NewReader("hello world")
data, _ := io.ReadAll(r)
fmt.Println(string(data)) // hello world
```

Это полезно в тестах: вместо создания файла передаёте строку.

## Пакет bytes — те же операции для []byte

**bytes** — это зеркало **strings** для **[]byte**. Все функции аналогичны:

```
b := []byte("Hello, Gopher!")

fmt.Println(bytes.Contains(b, []byte("Gopher")))   // true
fmt.Println(bytes.ToUpper(b))                       // [72 69 76 76 79 ...]
fmt.Println(string(bytes.ToUpper(b)))               // HELLO, GOPHER!

parts := bytes.Split(b, []byte(","))
fmt.Println(len(parts)) // 2
```

**bytes.Buffer** — аналог **strings.Builder** для байт:

```
var buf bytes.Buffer
buf.WriteString("Hello")
buf.WriteString(", ")
buf.WriteString("World!")
fmt.Println(buf.String()) // Hello, World!
```

**bytes.Buffer** также реализует **io.Reader** и **io.Writer** — удобно при работе с сетью или файлами в тестах.

## Когда string, а когда []byte

Используйте **string** для:
- Текстовых данных, ключей карт, идентификаторов.
- Данных, которые не меняются.

Используйте **[]byte** для:
- Данных, которые нужно модифицировать.
- Работы с бинарными данными (файлы, сеть, шифрование).
- Производительных операций — преобразование **string → []byte** копирует данные.

Преобразование между ними:
```
s := "hello"
b := []byte(s)    // string → []byte (копирование)
s2 := string(b)   // []byte → string (копирование)
```

В Go 1.20+ добавили **unsafe.String** и **unsafe.SliceData** для преобразования без копирования, но это нужно редко.

## Итого

**strings** и **bytes** — парные пакеты с одинаковым API. **strings.Builder** незаменим при сборке строк в цикле. **strings.NewReader** и **bytes.Buffer** — мосты между строками/байтами и интерфейсом **io.Reader/Writer**, которые используются повсюду в стандартной библиотеке.
