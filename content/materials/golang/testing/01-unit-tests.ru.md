---
title: "Юнит-тесты и табличные кейсы"
category: "golang"
categoryTitle: "Go"
section: "testing"
sectionTitle: "Тестирование"
sectionOrder: 7
order: 1
---

В Go тестирование встроено в язык. Не нужно ставить сторонние фреймворки (JUnit, pytest, Jest). Всё есть "из коробки" — пакет `testing` и команда `go test`.

## Как написать первый тест

Правила просты:
1. Файл с тестами заканчивается на `_test.go` (например, `math_test.go`).
2. Функция теста начинается с `Test` и принимает `*testing.T`.
3. Тест лежит в том же пакете, что и тестируемый код.

### Код, который тестируем

```go
// math.go
package math

func Add(a, b int) int {
    return a + b
}
```

### Тест

```go
// math_test.go
package math

import "testing"

func TestAdd(t *testing.T) {
    result := Add(2, 3)
    if result != 5 {
        t.Errorf("Add(2, 3) = %d; хотели 5", result)
    }
}
```

### Запуск

```bash
go test ./...
```

Флаг `./...` означает "запустить тесты во всех пакетах рекурсивно". Для одного пакета — просто `go test`.

```bash
# Подробный вывод (verbose)
go test -v ./...

# Запустить конкретный тест по имени
go test -run TestAdd ./...
```

## Табличные тесты (Table-Driven Tests)

Это **главный паттерн** тестирования в Go. Вместо написания отдельной функции для каждого кейса, мы создаем таблицу (срез структур) с входными данными и ожидаемыми результатами.

```go
func TestAdd(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive numbers", 2, 3, 5},
        {"zeros", 0, 0, 0},
        {"negative", -1, -2, -3},
        {"mixed", -1, 5, 4},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result := Add(tt.a, tt.b)
            if result != tt.expected {
                t.Errorf("Add(%d, %d) = %d; хотели %d", tt.a, tt.b, result, tt.expected)
            }
        })
    }
}
```

### Почему это круто?

1. Добавить новый кейс — одна строка в таблице.
2. `t.Run(name, ...)` создает подтест. В выводе видно, какой именно кейс упал.
3. Код теста не дублируется.

Вывод:
```
=== RUN   TestAdd
=== RUN   TestAdd/positive_numbers
=== RUN   TestAdd/zeros
=== RUN   TestAdd/negative
=== RUN   TestAdd/mixed
--- PASS: TestAdd (0.00s)
```

## Полезные методы testing.T

- `t.Error(args...)` / `t.Errorf(format, args...)` — пометить тест как проваленный, но продолжить выполнение.
- `t.Fatal(args...)` / `t.Fatalf(format, args...)` — пометить как проваленный и **остановить** тест немедленно.
- `t.Skip(reason)` — пропустить тест (например, если нет доступа к внешнему сервису).
- `t.Parallel()` — разрешить тесту выполняться параллельно с другими.

## Покрытие кода (Coverage)

Go умеет показывать, какие строки кода покрыты тестами.

```bash
# Показать процент покрытия
go test -cover ./...

# Сгенерировать HTML-отчет
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

В HTML-отчете зеленые строки — покрыты тестами, красные — нет.

## Итог

1. Тесты живут в файлах `*_test.go`, функции начинаются с `Test`.
2. **Табличные тесты** — стандарт Go. Используйте `t.Run` для подтестов.
3. `go test -v ./...` — запустить все тесты с подробным выводом.
4. `go test -cover` — проверить покрытие кода.
