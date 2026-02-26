---
title: "Cobra — фреймворк для CLI"
category: "golang"
categoryTitle: "Go"
section: "cli"
sectionTitle: "CLI-разработка"
sectionOrder: 14
order: 2
---

**Cobra** — стандартный фреймворк для построения CLI в Go. На нём написаны **kubectl**, **Hugo**, **GitHub CLI** и сотни других инструментов. Cobra даёт подкоманды, автодополнение, встроенную документацию и многое другое.

## Установка

```
go get github.com/spf13/cobra@latest
```

Опционально — генератор для быстрого старта:

```
go install github.com/spf13/cobra-cli@latest
cobra-cli init myapp
cobra-cli add server
```

## Структура Cobra-приложения

Cobra строится вокруг двух типов:
- **cobra.Command** — команда или подкоманда.
- **cobra.Command.Flags()** — флаги для команды.

Типичная структура проекта:

```
myapp/
├── cmd/
│   ├── root.go       — корневая команда
│   ├── server.go     — подкоманда server
│   └── migrate.go    — подкоманда migrate
└── main.go
```

## main.go — точка входа

```
package main

import "myapp/cmd"

func main() {
    cmd.Execute()
}
```

## cmd/root.go — корневая команда

```
package cmd

import (
    "os"
    "github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
    Use:   "myapp",
    Short: "Мой CLI-инструмент",
    Long:  `Подробное описание инструмента. Показывается при myapp --help.`,
}

func Execute() {
    if err := rootCmd.Execute(); err != nil {
        os.Exit(1)
    }
}
```

## cmd/server.go — подкоманда с флагами

```
package cmd

import (
    "fmt"
    "github.com/spf13/cobra"
)

var (
    serverPort int
    serverHost string
)

var serverCmd = &cobra.Command{
    Use:   "server",
    Short: "Запустить HTTP-сервер",
    Long:  `Запускает HTTP-сервер на указанном хосте и порту.`,
    RunE: func(cmd *cobra.Command, args []string) error {
        fmt.Printf("Запуск сервера на %s:%d\n", serverHost, serverPort)
        return startServer(serverHost, serverPort)
    },
}

func init() {
    rootCmd.AddCommand(serverCmd)

    serverCmd.Flags().IntVarP(&serverPort, "port", "p", 8080, "порт сервера")
    serverCmd.Flags().StringVarP(&serverHost, "host", "H", "0.0.0.0", "хост сервера")
    serverCmd.MarkFlagRequired("port") // Обязательный флаг
}
```

**RunE** возвращает ошибку — Cobra автоматически напечатает её и выйдет с кодом 1.

## Флаги: локальные и постоянные

```
// Локальный флаг — только для этой команды
cmd.Flags().StringVarP(&output, "output", "o", "", "файл вывода")

// Постоянный флаг — для команды и всех её подкоманд
cmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "подробный вывод")
```

Постоянные флаги удобны для опций вроде **--config**, **--verbose**, **--output** которые нужны везде.

## Глобальные флаги в root

```
var cfgFile string
var verbose bool

func init() {
    rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "файл конфигурации")
    rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "подробный вывод")
}
```

## PreRun и PostRun

Cobra поддерживает хуки до и после выполнения команды:

```
var serverCmd = &cobra.Command{
    Use: "server",
    PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
        return initLogger(verbose)
    },
    RunE: func(cmd *cobra.Command, args []string) error {
        return startServer()
    },
    PostRunE: func(cmd *cobra.Command, args []string) error {
        return cleanup()
    },
}
```

**PersistentPreRunE** выполняется перед командой и всеми её подкомандами — удобно для инициализации.

## Позиционные аргументы

```
var getCmd = &cobra.Command{
    Use:   "get <resource> <name>",
    Short: "Получить ресурс",
    Args:  cobra.ExactArgs(2), // Требуем ровно 2 аргумента
    RunE: func(cmd *cobra.Command, args []string) error {
        resource := args[0]
        name := args[1]
        fmt.Printf("Получаем %s/%s\n", resource, name)
        return nil
    },
}
```

Встроенные валидаторы аргументов:
- **cobra.ExactArgs(n)** — ровно n аргументов
- **cobra.MinimumNArgs(n)** — минимум n аргументов
- **cobra.MaximumNArgs(n)** — максимум n аргументов
- **cobra.RangeArgs(min, max)** — от min до max
- **cobra.NoArgs** — аргументов не должно быть

## Автодополнение

Cobra автоматически генерирует скрипты автодополнения для bash, zsh, fish и PowerShell:

```
./myapp completion bash > /etc/bash_completion.d/myapp
./myapp completion zsh > ~/.zsh/completions/_myapp
```

Для кастомного автодополнения значений флагов:

```
serverCmd.RegisterFlagCompletionFunc("host", func(cmd *cobra.Command, args []string, toComplete string) ([]string, cobra.ShellCompDirective) {
    return []string{"localhost", "0.0.0.0", "127.0.0.1"}, cobra.ShellCompDirectiveNoFileComp
})
```

## Итого

Cobra — стандарт де-факто для CLI в Go. Основная структура: **корневая команда** в **root.go**, **подкоманды** в отдельных файлах в **cmd/**, регистрация через **init()**. Используйте **RunE** вместо **Run** — возврат ошибки чище, чем **os.Exit(1)**. **PersistentPreRunE** удобен для общей инициализации (логгер, конфиг, трассировка).
