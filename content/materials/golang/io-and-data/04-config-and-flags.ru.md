---
title: "Конфигурация и параметры запуска"
category: "golang"
categoryTitle: "Go"
section: "io-and-data"
sectionTitle: "I/O и данные"
sectionOrder: 5
order: 4
---

Хардкодить (жестко прописывать) настройки в коде — плохая практика. Пароли от базы данных, порты сервера и ключи API должны приходить извне.

В Go есть стандартный способ читать аргументы командной строки — пакет `flag`.

## Флаги запуска

Представьте, что вы хотите запускать программу так:
`./my-app -port=8080 -env=production`

```go
import (
    "flag"
    "fmt"
)

func main() {
    // Объявляем флаги
    // Имя флага, значение по умолчанию, описание
    port := flag.Int("port", 3000, "Port to run server on")
    env := flag.String("env", "dev", "Environment (dev/prod)")
    isDebug := flag.Bool("debug", false, "Enable debug mode")

    // ОБЯЗАТЕЛЬНО вызываем Parse(), чтобы Go прочитал аргументы
    flag.Parse()

    // flag.Int возвращает УКАЗАТЕЛЬ (*int), поэтому разыменовываем через *
    fmt.Printf("Запуск на порту %d (env: %s)\n", *port, *env)
    
    if *isDebug {
        fmt.Println("Режим отладки включен!")
    }
}
```

Теперь, если пользователь запустит программу без аргументов, она возьмет значения по умолчанию (3000, dev). Если с аргументами — возьмет их.

## Переменные окружения (Environment Variables)

В мире Docker и Kubernetes настройки чаще передают через переменные окружения (`ENV`).

В Go их читают через `os.Getenv`.

```go
import (
    "os"
    "fmt"
)

func main() {
    // Получаем значение переменной DB_PASSWORD
    dbPass := os.Getenv("DB_PASSWORD")
    
    if dbPass == "" {
        fmt.Println("Внимание: пароль БД не задан!")
    } else {
        fmt.Println("Пароль получен успешно")
    }
}
```

## Итог

1. Используйте `flag` для параметров, которые удобно менять при ручном запуске (`-port`, `-verbose`).
2. Используйте `os.Getenv` для секретов и настроек при деплое в Docker/Kubernetes.
3. Не забудьте вызвать `flag.Parse()`!
