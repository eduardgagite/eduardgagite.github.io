---
title: "Пакеты sort и slices"
category: "golang"
categoryTitle: "Go"
section: "stdlib"
sectionTitle: "Стандартная библиотека"
sectionOrder: 12
order: 5
---

Сортировка и поиск в коллекциях — одни из самых частых задач. В Go для этого есть два пакета: классический **sort** (с Go 1.0) и современный **slices** (с Go 1.21), который работает удобнее благодаря дженерикам.

## Пакет sort — сортировка стандартных типов

Для срезов базовых типов есть готовые функции:

```
ints := []int{5, 2, 8, 1, 9, 3}
sort.Ints(ints)
fmt.Println(ints) // [1 2 3 5 8 9]

strs := []string{"banana", "apple", "cherry"}
sort.Strings(strs)
fmt.Println(strs) // [apple banana cherry]

floats := []float64{3.14, 1.41, 2.71}
sort.Float64s(floats)
fmt.Println(floats) // [1.41 2.71 3.14]
```

Сортировка по убыванию — через **sort.Reverse**:

```
sort.Sort(sort.Reverse(sort.IntSlice(ints)))
fmt.Println(ints) // [9 8 5 3 2 1]
```

## sort.Slice — сортировка с кастомным компаратором

Для структур и нестандартных критериев используйте **sort.Slice**:

```
type User struct {
    Name string
    Age  int
}

users := []User{
    {"Charlie", 30},
    {"Alice", 25},
    {"Bob", 35},
}

// Сортировка по возрасту
sort.Slice(users, func(i, j int) bool {
    return users[i].Age < users[j].Age
})
fmt.Println(users) // [{Alice 25} {Charlie 30} {Bob 35}]

// Сортировка по имени
sort.Slice(users, func(i, j int) bool {
    return users[i].Name < users[j].Name
})
fmt.Println(users) // [{Alice 25} {Bob 35} {Charlie 30}]
```

**sort.SliceStable** — сохраняет порядок равных элементов (стабильная сортировка).

## Бинарный поиск

После сортировки можно использовать бинарный поиск — O(log n) вместо O(n):

```
ints := []int{1, 2, 3, 5, 8, 9}

idx := sort.SearchInts(ints, 5)
fmt.Println(idx) // 3 — индекс, где стоит 5

// Для произвольного типа:
idx = sort.Search(len(ints), func(i int) bool {
    return ints[i] >= 7
})
fmt.Println(idx)         // 5 — первая позиция >= 7
fmt.Println(ints[idx])   // 8
```

**sort.Search** возвращает первый индекс, где предикат стал **true**. Если элемент не найден — возвращает **len(slice)**.

## Пакет slices (Go 1.21+) — современный API

С Go 1.21 появился пакет **slices** с дженерик-функциями. Он удобнее и безопаснее:

```
import "slices"

nums := []int{5, 2, 8, 1, 9, 3}
slices.Sort(nums)
fmt.Println(nums) // [1 2 3 5 8 9]

// Обратная сортировка
slices.SortFunc(nums, func(a, b int) int {
    return b - a // убывание
})
fmt.Println(nums) // [9 8 5 3 2 1]
```

Сортировка структур:

```
users := []User{
    {"Charlie", 30},
    {"Alice", 25},
    {"Bob", 35},
}

slices.SortFunc(users, func(a, b User) int {
    return strings.Compare(a.Name, b.Name)
})
```

Бинарный поиск:

```
nums := []int{1, 2, 3, 5, 8, 9}
idx, found := slices.BinarySearch(nums, 5)
fmt.Println(idx, found) // 3 true
```

## Дополнительные операции в пакете slices

```
nums := []int{1, 2, 3, 4, 5}

// Проверки
fmt.Println(slices.Contains(nums, 3))   // true
fmt.Println(slices.Index(nums, 3))      // 2

// Максимум и минимум
fmt.Println(slices.Max(nums))           // 5
fmt.Println(slices.Min(nums))           // 1

// Сравнение срезов
a := []int{1, 2, 3}
b := []int{1, 2, 3}
fmt.Println(slices.Equal(a, b))         // true

// Удаление дубликатов (срез должен быть отсортирован)
dupes := []int{1, 1, 2, 3, 3, 4}
compact := slices.Compact(dupes)
fmt.Println(compact) // [1 2 3 4]

// Разворот
slices.Reverse(nums)
fmt.Println(nums) // [5 4 3 2 1]
```

## sort.IsSorted — проверить, отсортирован ли срез

```
sorted := []int{1, 2, 3, 5, 8}
unsorted := []int{5, 2, 8, 1}

fmt.Println(sort.IntsAreSorted(sorted))   // true
fmt.Println(sort.IntsAreSorted(unsorted)) // false

// В slices:
fmt.Println(slices.IsSorted(sorted)) // true
```

## Итого

Для нового кода (Go 1.21+) используйте пакет **slices** — он проще, типобезопаснее и не требует написания `sort.Slice` с замыканием. Для старого кода или кастомной сортировки — **sort.Slice**. **Бинарный поиск работает только на отсортированных данных** — всегда сортируйте перед поиском или поддерживайте порядок при вставке.
