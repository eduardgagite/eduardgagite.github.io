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

```
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

```
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

```
os.Exit(0)  // успешное завершение
os.Exit(1)  // завершение с ошибкой
```

**Важно**: **os.Exit** не выполняет отложенные функции **defer**. Если нужна очистка — используйте код возврата из **main** или паникуйте с recover.

## Информация о системе

```
hostname, _ := os.Hostname()
fmt.Println(hostname) // my-server

wd, _ := os.Getwd()
fmt.Println(wd) // /home/user/projects

pid := os.Getpid()
fmt.Println(pid) // 12345
```

## Временные файлы и директории

```
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

```
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

```
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

```
cmd := exec.Command("wc", "-l")
cmd.Stdin = strings.NewReader("строка1\nстрока2\nстрока3\n")

output, err := cmd.Output()
fmt.Println(strings.TrimSpace(string(output))) // 3
```

## Переменные окружения для дочернего процесса

```
cmd := exec.Command("printenv", "MY_VAR")
cmd.Env = append(os.Environ(), "MY_VAR=hello_from_parent")

output, _ := cmd.Output()
fmt.Println(string(output)) // hello_from_parent
```

Если **cmd.Env** не задан — дочерний процесс наследует окружение родителя. Если задан явно — используется только то, что указано.

## Потоковый вывод команды

Иногда нужно читать вывод команды в реальном времени:

```
cmd := exec.Command("ping", "-c", "4", "8.8.8.8")
cmd.Stdout = os.Stdout // пробрасываем напрямую в наш stdout
cmd.Stderr = os.Stderr

if err := cmd.Run(); err != nil {
    log.Fatal(err)
}
```

## Проверка существования программы

```
path, err := exec.LookPath("git")
if err != nil {
    fmt.Println("git не найден в PATH")
} else {
    fmt.Println("git находится по пути:", path)
}
```

## Контекст с таймаутом для команды

```
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
