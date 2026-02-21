---
title: "Бенчмарки"
category: "golang"
categoryTitle: "Go"
section: "testing"
sectionTitle: "Тестирование"
sectionOrder: 7
order: 3
---

Иногда важно знать не только "работает ли код?", но и "насколько он быстрый?". Для этого в Go есть встроенные **бенчмарки** — инструмент для измерения производительности.

## Как написать бенчмарк

Правила похожи на тесты:
1. Файл заканчивается на **_test.go**.
2. Функция начинается с **Benchmark** (а не **Test**).
3. Принимает **\*testing.B** (а не **\*testing.T**).

```
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(2, 3)
    }
}
```

Go сам определит, сколько раз нужно вызвать функцию, чтобы получить статистически значимый результат.

### Запуск

```
go test -bench=. ./...
```

Вывод:

```
BenchmarkAdd-8    1000000000    0.3187 ns/op
```

Расшифровка:
- **BenchmarkAdd-8**: Имя бенчмарка, 8 — количество CPU ядер.
- **1000000000**: Функция была вызвана миллиард раз.
- **0.3187 ns/op**: Каждый вызов занял 0.3 наносекунды.

## Сравнение реализаций

Бенчмарки идеально подходят, чтобы сравнить два способа решения одной задачи.

```
func ConcatPlus(parts []string) string {
    result := ""
    for _, p := range parts {
        result += p
    }
    return result
}

func ConcatBuilder(parts []string) string {
    var b strings.Builder
    for _, p := range parts {
        b.WriteString(p)
    }
    return b.String()
}
```

```
var parts = []string{"Hello", " ", "World", "!", " ", "Go", " ", "is", " ", "awesome"}

func BenchmarkConcatPlus(b *testing.B) {
    for i := 0; i < b.N; i++ {
        ConcatPlus(parts)
    }
}

func BenchmarkConcatBuilder(b *testing.B) {
    for i := 0; i < b.N; i++ {
        ConcatBuilder(parts)
    }
}
```

Результат покажет, что **strings.Builder** в разы быстрее для большого количества строк, потому что не создает новую строку при каждой итерации.

## Измерение памяти

Добавьте флаг **-benchmem**, чтобы увидеть, сколько памяти выделяет ваш код.

```
go test -bench=. -benchmem ./...
```

```
BenchmarkConcatPlus-8       500000    3200 ns/op    1024 B/op    10 allocs/op
BenchmarkConcatBuilder-8   5000000     280 ns/op     128 B/op     2 allocs/op
```

- **B/op**: Байтов памяти на одну операцию.
- **allocs/op**: Количество выделений памяти (аллокаций). Чем меньше — тем лучше.

## Итог

1. Бенчмарки начинаются с **Benchmark** и принимают **\*testing.B**.
2. Запуск: **go test -bench=. -benchmem ./...**.
3. Используйте бенчмарки, чтобы **доказать**, что оптимизация действительно помогла, а не просто "кажется, что стало быстрее".
