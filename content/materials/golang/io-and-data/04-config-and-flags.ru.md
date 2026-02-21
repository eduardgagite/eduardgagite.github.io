---
title: "Конфигурация и параметры запуска"
category: "golang"
categoryTitle: "Go"
section: "io-and-data"
sectionTitle: "I/O и данные"
sectionOrder: 5
order: 4
---

Хардкодить (жестко прописывать) настройки в коде — плохая практика. Порт сервера, адрес базы данных, API-ключи — всё это должно приходить извне, чтобы один и тот же код работал в разных окружениях (разработка, тестирование, продакшен).

В Go есть два стандартных подхода: **флаги командной строки** и **переменные окружения**.

## Флаги командной строки (flag)

Представьте, что вы хотите запускать программу так:

```
./myapp -port=8080 -env=production -debug
```

Пакет **flag** из стандартной библиотеки разбирает такие аргументы.

```
import (
    "flag"
    "fmt"
)

func main() {
    port := flag.Int("port", 3000, "Port to run server on")
    env := flag.String("env", "dev", "Environment (dev/staging/prod)")
    debug := flag.Bool("debug", false, "Enable debug mode")

    flag.Parse()

    fmt.Printf("Порт: %d\n", *port)
    fmt.Printf("Окружение: %s\n", *env)

    if *debug {
        fmt.Println("Режим отладки включен")
    }
}
```

### Автоматическая справка

Если пользователь запустит программу с флагом **-help** или **-h**, Go автоматически покажет описание всех флагов:

```
./myapp -help
# Usage of ./myapp:
#   -debug
#         Enable debug mode
#   -env string
#         Environment (dev/staging/prod) (default "dev")
#   -port int
#         Port to run server on (default 3000)
```

## Переменные окружения (Environment Variables)

В мире Docker и Kubernetes настройки чаще передают через переменные окружения. Это стандарт для облачных приложений.

```
DB_HOST=localhost DB_PORT=5432 DB_PASSWORD=secret ./myapp
```

В Go их читают через **os.Getenv**.

```
import (
    "os"
    "fmt"
)

func main() {
    dbHost := os.Getenv("DB_HOST")
    dbPort := os.Getenv("DB_PORT")
    dbPass := os.Getenv("DB_PASSWORD")

    if dbHost == "" {
        dbHost = "localhost"
    }

    fmt.Printf("Подключение к %s:%s\n", dbHost, dbPort)
}
```

### Проблема: os.Getenv не отличает "пусто" от "не задано"

**os.Getenv("MISSING")** вернет пустую строку **""**. Но что если переменная специально задана как пустая?

Используйте **os.LookupEnv**, чтобы различить эти случаи:

```
value, exists := os.LookupEnv("DB_PASSWORD")
if !exists {
    fmt.Println("Переменная DB_PASSWORD не задана!")
} else if value == "" {
    fmt.Println("Переменная задана, но пустая")
} else {
    fmt.Println("Пароль получен")
}
```

## Комбинированный подход

На практике часто используют оба способа с приоритетом:
1. Флаг командной строки (высший приоритет).
2. Переменная окружения.
3. Значение по умолчанию.

```
func getConfig() string {
    port := flag.Int("port", 0, "Server port")
    flag.Parse()

    if *port != 0 {
        return fmt.Sprintf(":%d", *port)
    }

    if envPort := os.Getenv("PORT"); envPort != "" {
        return ":" + envPort
    }

    return ":3000"
}
```

## Конфигурационные файлы

Для сложных конфигураций (десятки параметров) удобнее использовать файл. Go умеет читать JSON "из коробки":

```
type Config struct {
    Port     int    `json:"port"`
    Database string `json:"database_url"`
    Debug    bool   `json:"debug"`
}

func LoadConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, err
    }

    var cfg Config
    if err := json.Unmarshal(data, &cfg); err != nil {
        return nil, err
    }
    return &cfg, nil
}
```

## Итог

1. **flag** — для параметров, которые удобно менять при ручном запуске (**-port**, **-verbose**).
2. **os.Getenv** — для секретов и настроек в Docker/Kubernetes.
3. Комбинируйте: флаг > переменная окружения > значение по умолчанию.
4. Для сложных конфигов — читайте JSON/YAML файл.
