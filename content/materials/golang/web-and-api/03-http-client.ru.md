---
title: "HTTP-клиент и повторные запросы"
category: "golang"
categoryTitle: "Go"
section: "web-and-api"
sectionTitle: "Веб и API"
sectionOrder: 8
order: 3
---

Серверы не живут в изоляции. Они ходят в другие сервисы: платежные системы, сторонние API, микросервисы внутри компании. Для этого нужен HTTP-клиент.

В Go он встроен в стандартную библиотеку — пакет **net/http**.

## Простой GET-запрос

```
resp, err := http.Get("https://api.example.com/users")
if err != nil {
    fmt.Println("Ошибка запроса:", err)
    return
}
defer resp.Body.Close()

body, err := io.ReadAll(resp.Body)
if err != nil {
    fmt.Println("Ошибка чтения:", err)
    return
}

fmt.Println("Статус:", resp.StatusCode)
fmt.Println("Тело:", string(body))
```

**Важно**: Всегда вызывайте **defer resp.Body.Close()**. Если забудете, соединение не вернется в пул и произойдет утечка ресурсов.

## POST-запрос с JSON

```
type CreateOrderRequest struct {
    ProductID int `json:"product_id"`
    Quantity  int `json:"quantity"`
}

func createOrder() error {
    order := CreateOrderRequest{ProductID: 42, Quantity: 3}

    jsonData, err := json.Marshal(order)
    if err != nil {
        return err
    }

    resp, err := http.Post(
        "https://api.example.com/orders",
        "application/json",
        bytes.NewBuffer(jsonData),
    )
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusCreated {
        return fmt.Errorf("неожиданный статус: %d", resp.StatusCode)
    }

    return nil
}
```

## Настройка клиента

**http.Get** и **http.Post** используют глобальный клиент по умолчанию. Проблема: у него **нет таймаута**. Если сервер зависнет, ваша программа будет ждать вечно.

Создавайте **свой клиент** с настройками.

```
client := &http.Client{
    Timeout: 10 * time.Second,
}

resp, err := client.Get("https://api.example.com/data")
```

### Запрос с заголовками

Для полного контроля используйте **http.NewRequest**.

```
req, err := http.NewRequest("GET", "https://api.example.com/users", nil)
if err != nil {
    return err
}

req.Header.Set("Authorization", "Bearer my-token-123")
req.Header.Set("Accept", "application/json")

client := &http.Client{Timeout: 10 * time.Second}
resp, err := client.Do(req)
```

### Запрос с контекстом (отмена и таймаут)

```
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

req, _ := http.NewRequestWithContext(ctx, "GET", "https://api.example.com/slow", nil)

resp, err := http.DefaultClient.Do(req)
if err != nil {
    fmt.Println("Запрос не успел:", err)
    return
}
defer resp.Body.Close()
```

## Повторные запросы (Retry)

Сеть ненадежна. Запросы могут падать из-за временных проблем (перегрузка, таймаут, сетевой сбой). Простая стратегия повторов:

```
func doWithRetry(client *http.Client, req *http.Request, maxRetries int) (*http.Response, error) {
    var resp *http.Response
    var err error

    for i := 0; i <= maxRetries; i++ {
        resp, err = client.Do(req)
        if err == nil && resp.StatusCode < 500 {
            return resp, nil
        }

        if resp != nil {
            resp.Body.Close()
        }

        wait := time.Duration(i+1) * time.Second
        fmt.Printf("Попытка %d не удалась, жду %v...\n", i+1, wait)
        time.Sleep(wait)
    }

    return resp, fmt.Errorf("все %d попыток провалились: %w", maxRetries, err)
}
```

## Итог

1. Всегда вызывайте **defer resp.Body.Close()**.
2. **Всегда задавайте таймаут** (**http.Client{Timeout: 10 \* time.Second}**).
3. Используйте **http.NewRequest**, когда нужны заголовки или контекст.
4. Для ненадежных внешних API реализуйте повторные попытки с задержкой.
