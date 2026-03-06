---
title: "Пакеты os и os/exec"
category: "golang"
categoryTitle: "Go"
section: "stdlib"
sectionTitle: "Стандартная библиотека"
sectionOrder: 12
order: 7
---

Пакет **os** — это интерфейс к операционной системе: переменные окружения, аргументы командной строки, файловая система, сигналы. Пакет **os/exec** позволяет запускать внешние команды и программы.

## Переменные окружения

```go
// Получить значение переменной
home := os.Getenv("HOME")
fmt.Println(home) // /Users/username

// Получить с проверкой наличия
val, ok := os.LookupEnv("DATABASE_URL")
if !ok {
    log.Fatal("DATABASE_URL не задан")
}

// Установить переменную (только для текущего процесса)
os.Setenv("MY_VAR", "hello")

// Удалить переменную
os.Unsetenv("MY_VAR")

// Все переменные окружения
for _, env := range os.Environ() {
    fmt.Println(env) // KEY=VALUE
}
```

## Аргументы командной строки

```go
// os.Args[0] — путь к исполняемому файлу
// os.Args[1:] — аргументы
fmt.Println(os.Args)     // [./myapp arg1 arg2]
fmt.Println(os.Args[0])  // ./myapp
fmt.Println(os.Args[1:]) // [arg1 arg2]

if len(os.Args) < 2 {
    fmt.Fprintln(os.Stderr, "Использование: myapp <имя>")
    os.Exit(1)
}
name := os.Args[1]
```

## Выход из программы

```go
os.Exit(0)  // успешное завершение
os.Exit(1)  // завершение с ошибкой
```

**Важно**: **os.Exit** не выполняет отложенные функции **defer**. Если нужна очистка — используйте код возврата из **main** или паникуйте с recover.

## Информация о системе

```go
hostname, _ := os.Hostname()
fmt.Println(hostname) // my-server

wd, _ := os.Getwd()
fmt.Println(wd) // /home/user/projects

pid := os.Getpid()
fmt.Println(pid) // 12345
```

## Временные файлы и директории

```go
// Временный файл
tmpFile, err := os.CreateTemp("", "myapp-*.txt")
if err != nil {
    log.Fatal(err)
}
defer os.Remove(tmpFile.Name()) // удалить после использования
fmt.Println(tmpFile.Name()) // /tmp/myapp-123456.txt

// Временная директория
tmpDir, err := os.MkdirTemp("", "myapp-*")
if err != nil {
    log.Fatal(err)
}
defer os.RemoveAll(tmpDir)
```

Первый аргумент — базовая директория (пустая строка = системная tmp). Второй — паттерн для имени, **\*** заменяется случайным суффиксом.

## os/exec — запуск внешних команд

```go
import "os/exec"

// Простой запуск команды
cmd := exec.Command("ls", "-la")
output, err := cmd.Output()
if err != nil {
    log.Fatal(err)
}
fmt.Println(string(output))
```

**cmd.Output()** запускает команду и возвращает её stdout. Если команда завершилась с ненулевым кодом — возвращается **\*exec.ExitError**.

## Захват stdout и stderr по отдельности

```go
cmd := exec.Command("go", "build", "./...")

var stdout, stderr bytes.Buffer
cmd.Stdout = &stdout
cmd.Stderr = &stderr

err := cmd.Run()
if err != nil {
    fmt.Println("Ошибка:", err)
    fmt.Println("Stderr:", stderr.String())
}
fmt.Println("Stdout:", stdout.String())
```

## Передача входных данных через stdin

```go
cmd := exec.Command("wc", "-l")
cmd.Stdin = strings.NewReader("строка1\nстрока2\nстрока3\n")

output, err := cmd.Output()
fmt.Println(strings.TrimSpace(string(output))) // 3
```

## Переменные окружения для дочернего процесса

```go
cmd := exec.Command("printenv", "MY_VAR")
cmd.Env = append(os.Environ(), "MY_VAR=hello_from_parent")

output, _ := cmd.Output()
fmt.Println(string(output)) // hello_from_parent
```

Если **cmd.Env** не задан — дочерний процесс наследует окружение родителя. Если задан явно — используется только то, что указано.

## Потоковый вывод команды

Иногда нужно читать вывод команды в реальном времени:

```go
cmd := exec.Command("ping", "-c", "4", "8.8.8.8")
cmd.Stdout = os.Stdout // пробрасываем напрямую в наш stdout
cmd.Stderr = os.Stderr

if err := cmd.Run(); err != nil {
    log.Fatal(err)
}
```

## Проверка существования программы

```go
path, err := exec.LookPath("git")
if err != nil {
    fmt.Println("git не найден в PATH")
} else {
    fmt.Println("git находится по пути:", path)
}
```

## Контекст с таймаутом для команды

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

cmd := exec.CommandContext(ctx, "sleep", "10")
if err := cmd.Run(); err != nil {
    if ctx.Err() == context.DeadlineExceeded {
        fmt.Println("Команда прервана по таймауту")
    }
}
```

**exec.CommandContext** автоматически убьёт процесс при отмене контекста.

## Итого

Пакет **os** — стандартный способ работать с окружением, процессом и системой. Для переменных окружения предпочитайте **LookupEnv** вместо **Getenv** — он показывает, задана ли переменная вообще. **os/exec** запускает внешние команды; всегда используйте **CommandContext с таймаутом** для команд, которые могут зависнуть.

## Практика

1. Напишите утилиту, которая читает переменные окружения `APP_HOST` и `APP_PORT` (через `os.LookupEnv`) и выводит адрес сервера. Если переменные не заданы, используйте значения по умолчанию.
2. Напишите функцию `FindFiles(dir, ext string) ([]string, error)`, которая возвращает список файлов с заданным расширением в директории (используя `os.ReadDir`).
3. Напишите обёртку над `exec.CommandContext`, которая выполняет произвольную команду с таймаутом 5 секунд и возвращает `stdout`, `stderr` и ошибку.
