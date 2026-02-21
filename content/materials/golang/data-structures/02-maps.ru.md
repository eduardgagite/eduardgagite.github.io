---
title: "Карты (Maps)"
category: "golang"
categoryTitle: "Go"
section: "data-structures"
sectionTitle: "Структуры данных"
sectionOrder: 3
order: 2
---

Карта (map) — это структура данных, которая хранит пары **"Ключ — Значение"**. Другие названия: словарь (dict в Python), хеш-таблица, ассоциативный массив.

В отличие от среза, где доступ идет по индексу (0, 1, 2...), в карте вы достаете данные по ключу (по имени, ID, email — чему угодно).

Пример из жизни: телефонная книга. Ключ — имя человека, значение — номер телефона.

## Создание карты

### Через make (пустая карта)

```
prices := make(map[string]int)

prices["apple"] = 100
prices["banana"] = 200

fmt.Println(prices) // map[apple:100 banana:200]
```

### Через литерал (сразу с данными)

```
roles := map[string]string{
    "admin":  "Super User",
    "editor": "Content Manager",
    "viewer": "Read Only",
}
```

### Важно: nil карта

Если объявить карту без **make**, она будет **nil**. Читать из неё можно (вернутся нулевые значения), но **запись вызовет панику**.

```
var m map[string]int
fmt.Println(m["key"]) // 0

m["key"] = 1 // PANIC: assignment to entry in nil map
```

Вывод: **всегда инициализируйте карту** через **make** или литерал.

## Основные операции

### Запись и чтение

```
users := make(map[int]string)

users[1] = "Alice"
users[2] = "Bob"

name := users[1] // "Alice"
```

### Проверка: есть ключ или нет? (ok-идиома)

Если ключа нет, карта вернет нулевое значение типа (0 для int, "" для string). Но как отличить "значение действительно 0" от "ключа нет"?

Используйте вторую переменную **ok**.

```
prices := map[string]int{
    "apple":  100,
    "banana": 0,
}

val, ok := prices["banana"]
fmt.Println(val, ok) // 0, true

val, ok = prices["cherry"]
fmt.Println(val, ok) // 0, false
```

Частый паттерн:

```
if price, ok := prices["apple"]; ok {
    fmt.Println("Цена яблока:", price)
} else {
    fmt.Println("Яблок нет в наличии")
}
```

### Удаление

Встроенная функция **delete**. Безопасна: если ключа нет, ничего не произойдет.

```
delete(prices, "apple")
delete(prices, "nonexistent")
```

### Количество элементов

```
fmt.Println(len(prices))
```

## Перебор карты

```
for key, value := range prices {
    fmt.Printf("%s: %d руб.\n", key, value)
}
```

**Важно**: Порядок перебора — **случайный**. Каждый раз он может быть разным. Это сделано специально, чтобы вы не зависели от порядка. Если нужна сортировка — сначала соберите ключи в срез и отсортируйте.

```
keys := make([]string, 0, len(prices))
for k := range prices {
    keys = append(keys, k)
}
sort.Strings(keys)

for _, k := range keys {
    fmt.Printf("%s: %d\n", k, prices[k])
}
```

## Карта как множество (Set)

В Go нет встроенного типа "множество" (Set). Но его легко сымитировать картой с **bool** значениями.

```
tags := map[string]bool{
    "go":     true,
    "docker": true,
}

if tags["go"] {
    fmt.Println("Тег 'go' есть")
}

tags["kubernetes"] = true
```

## Ограничения ключей

Ключом может быть любой тип, который поддерживает операцию **==**:
- Строки, числа, булевы значения.
- Структуры (если все их поля сравнимы).

**Не могут** быть ключами:
- Срезы.
- Карты.
- Функции.

## Итог

1. Карта хранит пары **ключ:значение**. Создавайте через **make** или литерал.
2. Проверяйте наличие ключа через **val, ok := m[key]**.
3. Порядок перебора — случайный. Если нужна сортировка — сортируйте ключи отдельно.
4. **map[string]bool** — простой способ сделать множество (Set).
