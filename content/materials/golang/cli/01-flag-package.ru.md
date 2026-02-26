---
title: "Пакет flag"
category: "golang"
categoryTitle: "Go"
section: "cli"
sectionTitle: "CLI-разработка"
sectionOrder: 14
order: 1
---

CLI-утилиты — одна из сильных сторон Go. Язык компилируется в один бинарник без зависимостей, что делает дистрибуцию инструментов очень удобной. Стандартная библиотека включает пакет **flag** для разбора аргументов командной строки.

## Основы пакета flag

Пакет **flag** разбирает флаги вида **-name value** и **-name=value**:

```
package main

import (
    "flag"
    "fmt"
)

func main() {
    host := flag.String("host", "localhost", "адрес сервера")
    port := flag.Int("port", 8080, "порт сервера")
    verbose := flag.Bool("verbose", false, "подробный вывод")

    flag.Parse()

    fmt.Printf("Подключение к %s:%d\n", *host, *port)
    if *verbose {
        fmt.Println("Режим подробного вывода включён")
    }
}
```

Запуск:

```
./myapp -host=example.com -port=9090 -verbose
./myapp -host example.com -port 9090
```

Три аргумента функций **flag.String/Int/Bool**:
1. Имя флага.
2. Значение по умолчанию.
3. Описание (показывается в **-help**).

Возвращаются **указатели** — разыменовывайте через **\***.

## Автоматическая справка

**flag.Parse()** автоматически добавляет флаг **-help** (или **-h**):

```
./myapp -help

Usage of ./myapp:
  -host string
        адрес сервера (default "localhost")
  -port int
        порт сервера (default 8080)
  -verbose
        подробный вывод
```

## Флаги, привязанные к переменным

Если не хочется работать с указателями, используйте **flag.StringVar** и аналоги:

```
var (
    host    string
    port    int
    verbose bool
)

func main() {
    flag.StringVar(&host, "host", "localhost", "адрес сервера")
    flag.IntVar(&port, "port", 8080, "порт сервера")
    flag.BoolVar(&verbose, "verbose", false, "подробный вывод")

    flag.Parse()

    fmt.Printf("Подключение к %s:%d\n", host, port)
}
```

Теперь **host**, **port**, **verbose** — обычные переменные без разыменования.

## Позиционные аргументы

После всех флагов могут идти позиционные аргументы (без **-**). Получить их можно через **flag.Args()**:

```
// ./myapp -verbose file1.txt file2.txt

flag.Parse()
files := flag.Args()    // ["file1.txt", "file2.txt"]
fmt.Println(flag.NArg()) // 2 — количество аргументов
```

## Кастомный тип флага

Для нестандартных типов реализуйте интерфейс **flag.Value**:

```
type StringSlice []string

func (s *StringSlice) String() string {
    return strings.Join(*s, ",")
}

func (s *StringSlice) Set(value string) error {
    *s = append(*s, value)
    return nil
}

func main() {
    var tags StringSlice
    flag.Var(&tags, "tag", "тег (можно указать несколько раз)")
    flag.Parse()

    fmt.Println(tags)
}
```

Запуск: **./myapp -tag go -tag backend -tag api** → **[go backend api]**

## FlagSet — подкоманды

Для нескольких подкоманд (как у **git**: **git commit**, **git push**) используйте **flag.FlagSet**:

```
func main() {
    if len(os.Args) < 2 {
        fmt.Println("Использование: myapp <команда> [флаги]")
        os.Exit(1)
    }

    switch os.Args[1] {
    case "server":
        serverCmd := flag.NewFlagSet("server", flag.ExitOnError)
        port := serverCmd.Int("port", 8080, "порт")
        serverCmd.Parse(os.Args[2:])
        fmt.Println("Запуск сервера на порту", *port)

    case "migrate":
        migrateCmd := flag.NewFlagSet("migrate", flag.ExitOnError)
        dsn := migrateCmd.String("dsn", "", "строка подключения к БД")
        migrateCmd.Parse(os.Args[2:])
        fmt.Println("Миграция БД:", *dsn)

    default:
        fmt.Printf("Неизвестная команда: %s\n", os.Args[1])
        os.Exit(1)
    }
}
```

## Ограничения пакета flag

Пакет **flag** прост, но у него есть ограничения:
- Использует **-flag** вместо GNU-стиля **--flag**.
- Нет поддержки коротких флагов (-v вместо --verbose).
- Нет автодополнения.
- Нет вложенных подкоманд.

Для серьёзных CLI-инструментов используйте **cobra** (следующая статья).

## Итого

Пакет **flag** — встроенный и достаточный для простых утилит. **flag.Parse()** обязателен перед использованием значений. Используйте **flag.StringVar** чтобы избежать разыменования указателей. Для подкоманд — **flag.FlagSet**. Для сложных CLI с подкомандами, --long-flags и автодополнением переходите на **cobra**.
