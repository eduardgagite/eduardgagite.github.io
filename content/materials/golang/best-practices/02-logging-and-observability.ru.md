---
title: "Логирование и наблюдаемость"
category: "golang"
categoryTitle: "Go"
section: "best-practices"
sectionTitle: "Практики и качество"
sectionOrder: 11
order: 2
---

Когда приложение работает в продакшене, вы не можете подключиться к нему отладчиком и поставить breakpoint. Единственный способ понять, что происходит — **логи**.

Хорошие логи экономят часы при поиске багов. Плохие — создают шум и не помогают.

## Стандартный пакет log

Go поставляется с пакетом **log**. Он простой, но ограниченный.

```go
import "log"

func main() {
    log.Println("Сервер запущен")
    log.Printf("Порт: %d", 8080)

    log.Fatal("Критическая ошибка, выключаюсь")
}
```

Вывод:
```text
2025/01/28 14:30:00 Сервер запущен
2025/01/28 14:30:00 Порт: 8080
```

## Структурированное логирование (slog)

Начиная с Go 1.21, в стандартной библиотеке появился пакет **log/slog** — современный логгер со структурированным выводом.

### Почему структурированные логи лучше?

Обычный лог:
```text
2025-01-28 14:30:00 Ошибка при получении пользователя: connection refused
```

Структурированный лог (JSON):
```json
{"time":"2025-01-28T14:30:00Z","level":"ERROR","msg":"Ошибка при получении пользователя","user_id":42,"error":"connection refused"}
```

Второй вариант легко парсить, фильтровать и искать в системах мониторинга (Grafana, Kibana, Datadog).

### Использование slog

```go
import "log/slog"

func main() {
    slog.Info("Сервер запущен", "port", 8080)

    slog.Warn("Медленный запрос", "duration_ms", 1500, "path", "/api/users")

    slog.Error("Не удалось подключиться к БД", "error", err, "host", "db.example.com")
}
```

### JSON-формат (для продакшена)

```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
slog.SetDefault(logger)

slog.Info("Запрос обработан", "method", "GET", "path", "/users", "status", 200)
```

## Уровни логирования

Используйте правильные уровни:

- **Debug**: Детали для разработки. Не включайте в продакшене.
- **Info**: Важные события: "Сервер запущен", "Миграции применены".
- **Warn**: Что-то подозрительное, но работа продолжается: "Медленный запрос".
- **Error**: Что-то сломалось: "Не удалось подключиться к БД".

### Фильтрация по уровню

```go
opts := &slog.HandlerOptions{Level: slog.LevelWarn}
logger := slog.New(slog.NewJSONHandler(os.Stdout, opts))
```

## Что логировать

**Логируйте**:
- Старт и остановку сервера.
- Входящие запросы (метод, путь, время выполнения, статус).
- Ошибки с контекстом (ID пользователя, параметры запроса).
- Подключение/отключение от внешних сервисов.

**Не логируйте**:
- Пароли, токены, персональные данные.
- Каждую итерацию цикла (забьете диск за минуты).
- Успешные проверки (логируйте только отклонения).

## Три столпа наблюдаемости

Логирование — лишь один из трёх компонентов наблюдаемости (observability). Полная картина включает:

1. **Логи** — что произошло (события и ошибки).
2. **Метрики** — числовые показатели: кол-во запросов, время ответа, использование памяти.
3. **Трейсинг** — путь запроса через все сервисы (от HTTP-запроса через API → сервис → БД).

### OpenTelemetry

**OpenTelemetry** (OTel) — стандарт индустрии для сбора телеметрии. Go имеет официальный SDK:

```bash
go get go.opentelemetry.io/otel
go get go.opentelemetry.io/otel/trace
go get go.opentelemetry.io/otel/exporters/stdout/stdouttrace
```

### Трейсинг: пример

Трейс отслеживает путь запроса через систему. Каждая операция — это **span** (отрезок):

```go
import (
    "context"
    "go.opentelemetry.io/otel"
)

var tracer = otel.Tracer("myapp")

func GetUser(ctx context.Context, id int) (*User, error) {
    ctx, span := tracer.Start(ctx, "GetUser")
    defer span.End()

    span.SetAttributes(attribute.Int("user.id", id))

    user, err := db.FindUser(ctx, id)
    if err != nil {
        span.RecordError(err)
        return nil, err
    }
    return user, nil
}
```

Каждый span содержит: имя операции, время начала/конца, атрибуты и ошибки. Трейсы отправляются в системы визуализации (Jaeger, Grafana Tempo, Datadog) и показывают «водопад» всех операций запроса.

### Метрики: пример

```go
import "go.opentelemetry.io/otel/metric"

var meter = otel.Meter("myapp")

func initMetrics() {
    requestCount, _ := meter.Int64Counter("http.requests.total",
        metric.WithDescription("Количество HTTP-запросов"),
    )

    requestDuration, _ := meter.Float64Histogram("http.request.duration",
        metric.WithDescription("Время обработки запроса"),
        metric.WithUnit("s"),
    )

    // Использование в middleware
    requestCount.Add(ctx, 1, metric.WithAttributes(
        attribute.String("method", r.Method),
        attribute.Int("status", statusCode),
    ))
}
```

Метрики отправляются в Prometheus, Grafana или другие системы мониторинга.

## Итог

1. Используйте **log/slog** для структурированного логирования.
2. В разработке — текстовый формат. В продакшене — JSON.
3. Добавляйте контекст к логам: **"user_id", 42, "method", "GET"**.
4. Никогда не логируйте секреты (пароли, токены, ключи API).
5. Для полной наблюдаемости подключайте **OpenTelemetry** — трейсинг показывает путь запроса, метрики дают числовую картину здоровья системы.

## Смотрите также

- **Профилирование** — как находить узкие места производительности с помощью pprof (раздел «Лучшие практики → Профилирование»).
- **Context и отмена** — как передавать трейс-контекст между горутинами (раздел «Конкурентность → Context и отмена»).
