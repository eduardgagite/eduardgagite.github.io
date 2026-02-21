---
title: "Context и отмена задач"
category: "golang"
categoryTitle: "Go"
section: "concurrency"
sectionTitle: "Конкурентность"
sectionOrder: 6
order: 4
---

Пакет **context** — это "нервная система" Go-приложений. Он связывает все процессы воедино и позволяет управлять ими.

Представьте ситуацию:
1. Пользователь делает HTTP запрос к вашему серверу.
2. Сервер начинает сложный расчет и идет в базу данных.
3. Пользователь передумал и закрыл вкладку браузера.

Без контекста сервер продолжит считать и грузить базу, хотя результат уже никому не нужен.
С контекстом сервер узнает об обрыве связи и **мгновенно отменит** все дочерние операции (запросы в БД, расчеты).

## Как это работает

Контекст — это объект, который передается первым аргументом (**ctx**) во все функции.

```
func DoWork(ctx context.Context) {
    // ...
}
```

Он умеет три вещи:
1. **Отмена**: Сигнализирует, что пора закругляться.
2. **Таймаут**: Сигнализирует, что время вышло.
3. **Значения**: Переносит данные (User ID, Trace ID) сквозь слои приложения.

## Пример 1: Ручная отмена (WithCancel)

```
func worker(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            fmt.Println("Воркер: Меня остановили!")
            return
        default:
            fmt.Println("Воркер: Работаю...")
            time.Sleep(500 * time.Millisecond)
        }
    }
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())

    go worker(ctx)

    time.Sleep(2 * time.Second)
    fmt.Println("Main: Хватит работать!")
    cancel()
    
    time.Sleep(1 * time.Second)
}
```

## Пример 2: Таймаут (WithTimeout)

Самый популярный кейс. Мы даем задаче 2 секунды. Если не успела — убиваем.

```
func longOperation(ctx context.Context) {
    select {
    case <-time.After(5 * time.Second):
        fmt.Println("Успех!")
    case <-ctx.Done():
        fmt.Println("Ошибка:", ctx.Err()) // context deadline exceeded
    }
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
    defer cancel()

    longOperation(ctx)
}
```

## Контекст в HTTP

В стандартном веб-сервере Go у каждого запроса (**http.Request**) уже есть контекст. Если клиент разорвет соединение, этот контекст автоматически отменится.

```
func handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    rows, err := db.QueryContext(ctx, "SELECT * FROM huge_table")
    if err != nil {
        fmt.Println("Запрос прерван:", err)
        return
    }
}
```

## Итог

1. **Всегда передавайте ctx первым аргументом** в функции, которые занимаются I/O (сеть, диск, база).
2. **Проверяйте ctx.Done()**, если делаете долгие вычисления в цикле.
3. Используйте **WithTimeout**, чтобы ваше приложение не висело вечно, если внешний сервис тупит.
4. Никогда не храните контекст в структурах. Передавайте его явно через аргументы.
