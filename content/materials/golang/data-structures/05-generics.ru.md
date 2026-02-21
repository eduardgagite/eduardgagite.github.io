---
title: "Дженерики"
category: "golang"
categoryTitle: "Go"
section: "data-structures"
sectionTitle: "Структуры данных"
sectionOrder: 3
order: 5
---

До версии 1.18 в Go не было дженериков (обобщённых типов). Если нужна была функция "найди минимум", приходилось писать отдельную версию для **int**, отдельную для **float64**, отдельную для **string**. Или использовать **interface{}** и терять проверку типов на этапе компиляции.

Начиная с Go 1.18, дженерики — часть языка. Они позволяют писать функции и структуры, которые работают с **любым подходящим типом**, сохраняя при этом строгую типизацию.

## Проблема без дженериков

Допустим, нужна функция, возвращающая минимум из двух значений.

```
func MinInt(a, b int) int {
    if a < b {
        return a
    }
    return b
}

func MinFloat(a, b float64) float64 {
    if a < b {
        return a
    }
    return b
}
```

Логика одинаковая, но код дублируется. С дженериками — одна функция вместо двух.

## Обобщённые функции

Тип-параметр указывается в квадратных скобках после имени функции.

```
func Min[T int | float64 | string](a, b T) T {
    if a < b {
        return a
    }
    return b
}

func main() {
    fmt.Println(Min(3, 7))               // 3
    fmt.Println(Min(3.14, 2.71))         // 2.71
    fmt.Println(Min("apple", "banana"))  // "apple"
}
```

**T** — это тип-параметр. Запись **T int | float64 | string** означает: "T может быть int, float64 или string". При вызове Go сам определяет конкретный тип по переданным аргументам.

## Ограничения типов (Type Constraints)

Перечислять типы через **|** в каждой функции неудобно. Для этого создают интерфейсы-ограничения.

```
type Number interface {
    int | int8 | int16 | int32 | int64 |
    float32 | float64
}

func Sum[T Number](values []T) T {
    var total T
    for _, v := range values {
        total += v
    }
    return total
}

func main() {
    ints := []int{1, 2, 3, 4, 5}
    fmt.Println(Sum(ints)) // 15

    floats := []float64{1.1, 2.2, 3.3}
    fmt.Println(Sum(floats)) // 6.6
}
```

### Встроенные ограничения

Пакет **constraints** (из стандартной библиотеки **golang.org/x/exp** или встроенный **cmp**) предоставляет готовые ограничения, чтобы не перечислять типы вручную.

Самые полезные:

- **comparable** — типы, которые можно сравнивать через **==** и **!=** (встроен в язык).
- **cmp.Ordered** — типы, которые поддерживают операторы **<**, **>**, **<=**, **>=**.

```
import "cmp"

func Min[T cmp.Ordered](a, b T) T {
    if a < b {
        return a
    }
    return b
}
```

Теперь **Min** работает с любым упорядоченным типом: **int**, **float64**, **string** и их вариациями.

## Обобщённые структуры

Дженерики работают и со структурами. Классический пример — стек, который хранит элементы любого типа.

```
type Stack[T any] struct {
    items []T
}

func (s *Stack[T]) Push(item T) {
    s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() (T, bool) {
    if len(s.items) == 0 {
        var zero T
        return zero, false
    }
    item := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return item, true
}

func main() {
    intStack := Stack[int]{}
    intStack.Push(10)
    intStack.Push(20)
    val, _ := intStack.Pop()
    fmt.Println(val) // 20

    strStack := Stack[string]{}
    strStack.Push("hello")
}
```

Ограничение **any** означает "любой тип". Для стека этого достаточно — мы не сравниваем и не складываем элементы, просто храним.

## Практический пример: фильтрация среза

```
func Filter[T any](items []T, fn func(T) bool) []T {
    var result []T
    for _, item := range items {
        if fn(item) {
            result = append(result, item)
        }
    }
    return result
}

func main() {
    numbers := []int{1, 2, 3, 4, 5, 6, 7, 8}

    even := Filter(numbers, func(n int) bool {
        return n%2 == 0
    })
    fmt.Println(even) // [2, 4, 6, 8]

    words := []string{"Go", "is", "awesome", "language"}
    long := Filter(words, func(s string) bool {
        return len(s) > 2
    })
    fmt.Println(long) // ["awesome", "language"]
}
```

Одна функция **Filter** работает и с числами, и со строками, и с любыми другими типами.

## Стандартная библиотека: пакеты slices и maps

Начиная с Go 1.21, в стандартной библиотеке появились обобщённые функции для работы со срезами и картами.

```
import "slices"

numbers := []int{3, 1, 4, 1, 5, 9}
slices.Sort(numbers)             // [1, 1, 3, 4, 5, 9]
slices.Contains(numbers, 5)      // true
idx := slices.Index(numbers, 4)  // 2
```

```
import "maps"

m := map[string]int{"a": 1, "b": 2, "c": 3}
keys := maps.Keys(m)
maps.DeleteFunc(m, func(k string, v int) bool {
    return v < 2
})
```

## Когда использовать дженерики

**Используйте**, когда:
- Логика функции одинакова для разных типов (контейнеры, утилиты для срезов, карт).
- Нужно избежать дублирования кода без потери типобезопасности.

**Не используйте**, когда:
- Работаете с одним конкретным типом — дженерики только усложнят код.
- Можно обойтись интерфейсом с методами. Если поведение определяется методами (Reader, Writer), интерфейс — лучший выбор.

## Итог

Дженерики позволяют писать функции и структуры, параметризованные типами. Ограничения задают, какие типы допустимы: **any** — любой, **comparable** — сравниваемые, **cmp.Ordered** — упорядоченные. **Используйте дженерики для утилитарного кода (коллекции, фильтры, трансформации), но не превращайте весь проект в абстрактную фабрику абстракций.**
