---
title: "Потоки и буферизация"
category: "golang"
categoryTitle: "Go"
section: "io-and-data"
sectionTitle: "I/O и данные"
sectionOrder: 5
order: 2
---

Что делать, если файл весит 10 ГБ, а памяти у вас всего 2 ГБ? Читать его целиком нельзя — программа упадет.

Здесь на помощь приходят **потоки** (Streams). Идея: мы читаем файл не весь сразу, а маленькими кусочками (буфером), обрабатываем и выбрасываем. В любой момент в памяти находится только текущий кусок.

## Чтение построчно (bufio.Scanner)

Пакет **bufio** (Buffered I/O) — главный инструмент для потокового чтения текста.

```
import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    file, err := os.Open("access.log")
    if err != nil {
        panic(err)
    }
    defer file.Close()

    scanner := bufio.NewScanner(file)

    lineNum := 0
    for scanner.Scan() {
        lineNum++
        line := scanner.Text()
        fmt.Printf("Строка %d: %s\n", lineNum, line)
    }

    if err := scanner.Err(); err != nil {
        fmt.Println("Ошибка:", err)
    }
}
```

Этот код обработает файл **любого** размера — хоть терабайт — потребляя всего пару килобайт памяти.

### Ограничение размера строки

По умолчанию **Scanner** читает строки до 64 КБ. Если строка длиннее (например, JSON на одну строку), нужно увеличить буфер:

```
scanner := bufio.NewScanner(file)
scanner.Buffer(make([]byte, 1024*1024), 1024*1024)
```

## Запись через буфер (bufio.Writer)

Запись по одному символу напрямую в файл — медленно (каждый раз системный вызов). **bufio.Writer** накапливает данные в буфере и пишет на диск большими порциями.

```
file, _ := os.Create("output.txt")
defer file.Close()

writer := bufio.NewWriter(file)

for i := 0; i < 10000; i++ {
    writer.WriteString(fmt.Sprintf("Строка %d\n", i))
}

writer.Flush()
```

## Интерфейсы io.Reader и io.Writer

Это **фундамент** I/O в Go. Почти всё, что можно прочитать, реализует **io.Reader**. Почти всё, куда можно записать, реализует **io.Writer**.

```
type Reader interface {
    Read(p []byte) (n int, err error)
}

type Writer interface {
    Write(p []byte) (n int, err error)
}
```

Почему это важно? Потому что вы можете написать **одну функцию**, которая работает с любым источником данных.

```
func countLines(r io.Reader) int {
    scanner := bufio.NewScanner(r)
    count := 0
    for scanner.Scan() {
        count++
    }
    return count
}

func main() {
    f, _ := os.Open("data.txt")
    defer f.Close()
    fmt.Println(countLines(f))

    s := strings.NewReader("строка 1\nстрока 2\nстрока 3")
    fmt.Println(countLines(s)) // 3

    resp, _ := http.Get("https://example.com")
    defer resp.Body.Close()
    fmt.Println(countLines(resp.Body))
}
```

Одна и та же функция **countLines** работает с файлом, строкой и HTTP-ответом. Всё благодаря интерфейсу **io.Reader**.

## Итог

1. Для больших файлов — **bufio.Scanner** (построчное чтение без загрузки в память).
2. Для массовой записи — **bufio.Writer** (буферизация ускоряет запись).
3. **io.Reader** и **io.Writer** — универсальные интерфейсы. Пишите функции, которые принимают их, а не конкретные типы файлов.
