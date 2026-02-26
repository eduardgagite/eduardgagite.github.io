---
title: "Паттерны CLI-инструментов"
category: "golang"
categoryTitle: "Go"
section: "cli"
sectionTitle: "CLI-разработка"
sectionOrder: 14
order: 3
---

Хороший CLI-инструмент предсказуем и удобен: корректные коды завершения, правильные потоки вывода, обработка сигналов, прогресс для долгих операций. Эти паттерны встречаются в каждом серьёзном Go-инструменте.

## Коды завершения

По стандарту Unix: **0** — успех, ненулевой код — ошибка. Никогда не выходите с кодом 0 при ошибке.

```
func main() {
    if err := run(); err != nil {
        fmt.Fprintln(os.Stderr, err)
        os.Exit(1)
    }
}

func run() error {
    // Вся логика здесь
    if err := doWork(); err != nil {
        return fmt.Errorf("работа завершилась с ошибкой: %w", err)
    }
    return nil
}
```

Паттерн **func run() error** в **main.go** — стандарт для Go CLI. Он позволяет использовать **defer** для очистки (в отличие от **os.Exit**) и тестировать логику без реального запуска.

## Стандартные потоки вывода

```
// stdout — результат работы программы (можно перенаправить в файл)
fmt.Println("user@example.com 30")

// stderr — диагностика, ошибки, прогресс (не мешает результату)
fmt.Fprintln(os.Stderr, "Подключение к базе данных...")
fmt.Fprintln(os.Stderr, "Обработано 150 записей")
```

Правило: если пользователь делает **myapp > output.txt**, в файл должен попасть только результат, а не сообщения о прогрессе.

## Graceful shutdown по сигналу

CLI-инструменты должны корректно завершаться по **Ctrl+C** (SIGINT) и **SIGTERM**:

```
func run() error {
    ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
    defer stop()

    // Передаём контекст во все долгие операции
    if err := processFiles(ctx, files); err != nil {
        if errors.Is(err, context.Canceled) {
            fmt.Fprintln(os.Stderr, "\nПрервано пользователем")
            return nil // Не ошибка, если пользователь нажал Ctrl+C
        }
        return err
    }
    return nil
}
```

**signal.NotifyContext** (Go 1.16+) создаёт контекст, который отменяется при получении сигнала. Это элегантнее, чем вручную слушать канал сигналов.

## Прогресс для долгих операций

Простой прогресс через **\r** (возврат каретки без новой строки):

```
func processWithProgress(items []string) {
    total := len(items)
    for i, item := range items {
        fmt.Fprintf(os.Stderr, "\rОбработка: %d/%d (%s)...", i+1, total, item)
        process(item)
    }
    fmt.Fprintln(os.Stderr, "\rГотово!                        ")
}
```

Для серьёзных инструментов используйте библиотеки вроде **github.com/schollz/progressbar/v3**:

```
bar := progressbar.Default(int64(len(items)))
for _, item := range items {
    process(item)
    bar.Add(1)
}
```

## Цветной вывод

Цвета полезны, но должны отключаться при выводе не в терминал:

```
import "github.com/fatih/color"

// color автоматически отключает цвета, если stdout — не терминал (NO_COLOR, CI)
color.Green("✓ Успешно")
color.Red("✗ Ошибка")
color.Yellow("⚠ Предупреждение")
```

Или минималистично через ANSI-коды:

```
const (
    colorReset  = "\033[0m"
    colorRed    = "\033[31m"
    colorGreen  = "\033[32m"
    colorYellow = "\033[33m"
)

func isTerminal() bool {
    fi, err := os.Stdout.Stat()
    if err != nil {
        return false
    }
    return (fi.Mode() & os.ModeCharDevice) != 0
}
```

## Конфигурация: флаги → переменные окружения → файл конфига

Порядок приоритетов в стандартных инструментах:

```
type Config struct {
    Host     string
    Port     int
    LogLevel string
}

func loadConfig(flags *Flags) Config {
    cfg := Config{
        // 1. Значения по умолчанию
        Host:     "localhost",
        Port:     8080,
        LogLevel: "info",
    }

    // 2. Переменные окружения
    if v := os.Getenv("APP_HOST"); v != "" {
        cfg.Host = v
    }
    if v := os.Getenv("APP_PORT"); v != "" {
        cfg.Port, _ = strconv.Atoi(v)
    }

    // 3. Флаги командной строки (наивысший приоритет)
    if flags.Host != "" {
        cfg.Host = flags.Host
    }
    if flags.Port != 0 {
        cfg.Port = flags.Port
    }

    return cfg
}
```

Этот паттерн используют **kubectl**, **docker** и другие инструменты. Пользователь может настроить через env (в Docker/CI) или явным флагом.

## Читаемый вывод таблиц

Для вывода структурированных данных используйте выравнивание:

```
import "text/tabwriter"

func printUsers(users []User) {
    w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
    fmt.Fprintln(w, "ID\tИМЯ\tEMAIL\tСТАТУС")
    fmt.Fprintln(w, "--\t---\t-----\t------")
    for _, u := range users {
        fmt.Fprintf(w, "%d\t%s\t%s\t%s\n", u.ID, u.Name, u.Email, u.Status)
    }
    w.Flush()
}
```

Вывод:

```
ID  ИМЯ      EMAIL              СТАТУС
--  ---      -----              ------
1   Alice    alice@example.com  active
2   Bob      bob@example.com    inactive
```

## Итого

Хорошее CLI строится на простых принципах: **ошибки в stderr, результат в stdout**, корректные коды завершения, graceful shutdown через контекст. Паттерн **func run() error** в main — стандарт Go-сообщества, который делает код тестируемым и предсказуемым. Для конфигурации соблюдайте порядок приоритетов: **флаги > переменные окружения > файл конфига > значения по умолчанию**.
