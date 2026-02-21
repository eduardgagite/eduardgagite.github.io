---
title: "Интеграционные тесты"
category: "golang"
categoryTitle: "Go"
section: "testing"
sectionTitle: "Тестирование"
sectionOrder: 7
order: 4
---

Юнит-тесты проверяют отдельные функции в изоляции. Но реальный код общается с HTTP-серверами, базами данных и внешними API. Интеграционные тесты проверяют, что всё это работает вместе.

Go предоставляет мощные инструменты для интеграционного тестирования прямо в стандартной библиотеке — без сторонних фреймворков.

## Тестирование HTTP-обработчиков (httptest)

Пакет **net/http/httptest** позволяет тестировать HTTP-обработчики без запуска реального сервера.

### ResponseRecorder — записываем ответ

```
func handleHealth(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"ok"}`))
}

func TestHandleHealth(t *testing.T) {
    req := httptest.NewRequest("GET", "/health", nil)
    rec := httptest.NewRecorder()

    handleHealth(rec, req)

    if rec.Code != http.StatusOK {
        t.Errorf("статус %d, хотели %d", rec.Code, http.StatusOK)
    }

    expected := `{"status":"ok"}`
    if rec.Body.String() != expected {
        t.Errorf("тело %q, хотели %q", rec.Body.String(), expected)
    }
}
```

**httptest.NewRequest** создаёт запрос, **httptest.NewRecorder** записывает ответ. Никакого сетевого взаимодействия — всё в памяти.

### Тестирование с JSON-телом

```
func handleCreateUser(w http.ResponseWriter, r *http.Request) {
    var user struct {
        Name  string `json:"name"`
        Email string `json:"email"`
    }
    json.NewDecoder(r.Body).Decode(&user)

    if user.Name == "" {
        http.Error(w, "name required", http.StatusBadRequest)
        return
    }

    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(map[string]string{"id": "123", "name": user.Name})
}

func TestCreateUser(t *testing.T) {
    body := strings.NewReader(`{"name":"Alice","email":"alice@example.com"}`)
    req := httptest.NewRequest("POST", "/users", body)
    req.Header.Set("Content-Type", "application/json")
    rec := httptest.NewRecorder()

    handleCreateUser(rec, req)

    if rec.Code != http.StatusCreated {
        t.Fatalf("статус %d, хотели %d", rec.Code, http.StatusCreated)
    }

    var resp map[string]string
    json.NewDecoder(rec.Body).Decode(&resp)

    if resp["name"] != "Alice" {
        t.Errorf("name = %q, хотели Alice", resp["name"])
    }
}
```

### Табличные тесты для обработчиков

Табличный подход отлично сочетается с HTTP-тестами — можно покрыть десятки сценариев одним тестом.

```
func TestCreateUserValidation(t *testing.T) {
    tests := []struct {
        name       string
        body       string
        wantStatus int
    }{
        {"valid user", `{"name":"Alice","email":"a@b.com"}`, http.StatusCreated},
        {"empty name", `{"name":"","email":"a@b.com"}`, http.StatusBadRequest},
        {"empty body", `{}`, http.StatusBadRequest},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            req := httptest.NewRequest("POST", "/users", strings.NewReader(tt.body))
            rec := httptest.NewRecorder()

            handleCreateUser(rec, req)

            if rec.Code != tt.wantStatus {
                t.Errorf("статус %d, хотели %d", rec.Code, tt.wantStatus)
            }
        })
    }
}
```

## Тестовый сервер (httptest.Server)

Иногда нужно протестировать HTTP-клиент, который обращается к внешнему API. **httptest.NewServer** поднимает настоящий HTTP-сервер на случайном порту.

```
func TestFetchUserFromAPI(t *testing.T) {
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"id":1,"name":"Alice"}`))
    }))
    defer server.Close()

    resp, err := http.Get(server.URL + "/users/1")
    if err != nil {
        t.Fatalf("запрос не удался: %v", err)
    }
    defer resp.Body.Close()

    var user struct {
        ID   int    `json:"id"`
        Name string `json:"name"`
    }
    json.NewDecoder(resp.Body).Decode(&user)

    if user.Name != "Alice" {
        t.Errorf("name = %q, хотели Alice", user.Name)
    }
}
```

Тестовый сервер удобен, когда в коде URL внешнего сервиса передаётся как параметр — подменяете его на **server.URL** и тестируете без сети.

## Разделение юнит- и интеграционных тестов

Интеграционные тесты обычно медленнее и могут требовать внешних зависимостей (база данных, Redis). Удобно запускать их отдельно с помощью build tags.

```
//go:build integration

package storage

import "testing"

func TestPostgresInsert(t *testing.T) {
    db := connectToTestDB(t)
    defer db.Close()
}
```

Юнит-тесты запускаются как обычно, а для интеграционных нужен флаг **-tags=integration**:

```
go test ./...

go test -tags=integration ./...
```

## TestMain — настройка окружения

Если для интеграционных тестов нужно один раз подготовить среду (поднять базу, накатить миграции), используйте **TestMain**.

```
func TestMain(m *testing.M) {
    db := setupTestDB()

    code := m.Run()

    db.Close()
    os.Exit(code)
}
```

**TestMain** вызывается один раз для всего пакета, до и после всех тестов. Это аналог setUp/tearDown на уровне пакета.

## t.Cleanup — очистка после теста

Для очистки после каждого отдельного теста используйте **t.Cleanup** вместо defer. Он гарантирует выполнение даже в подтестах.

```
func TestWithTempFile(t *testing.T) {
    f, err := os.CreateTemp("", "test-*")
    if err != nil {
        t.Fatal(err)
    }

    t.Cleanup(func() {
        os.Remove(f.Name())
    })

    // Работаем с файлом...
}
```

## Итог

Пакет **httptest** покрывает большинство задач интеграционного тестирования: **NewRecorder** для тестирования обработчиков, **NewServer** для тестирования клиентов. Build tags разделяют быстрые юнит-тесты и медленные интеграционные. **Хороший проект имеет и те, и другие — юнит-тесты ловят баги в логике, интеграционные — в связках между компонентами.**
