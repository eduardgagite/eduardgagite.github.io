---
title: "Пакет regexp"
category: "golang"
categoryTitle: "Go"
section: "stdlib"
sectionTitle: "Стандартная библиотека"
sectionOrder: 12
order: 6
---

Регулярные выражения (regexp) — язык для поиска паттернов в строках. В Go они реализованы через пакет **regexp** с синтаксисом RE2 — гарантированно выполняются за линейное время, без катастрофического возврата (ReDoS-атак).

## Компиляция паттерна

Перед использованием паттерн нужно скомпилировать:

```
// MustCompile — паникует при ошибке в паттерне (для статических паттернов)
re := regexp.MustCompile(`\d+`)

// Compile — возвращает ошибку (для динамических паттернов)
re, err := regexp.Compile(`\d+`)
if err != nil {
    log.Fatal(err)
}
```

Компиляция — затратная операция. **Компилируйте паттерны один раз** — в переменную пакета или в функции инициализации, а не внутри цикла.

```
// Хорошо: один раз на весь пакет
var emailRegexp = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// Плохо: компиляция при каждом вызове
func validateEmail(email string) bool {
    re := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@...`) // не делайте так
    return re.MatchString(email)
}
```

## Базовые операции

```
re := regexp.MustCompile(`\d+`)
s := "У меня 3 кота и 12 собак"

fmt.Println(re.MatchString(s))           // true — есть ли совпадение
fmt.Println(re.FindString(s))            // "3" — первое совпадение
fmt.Println(re.FindAllString(s, -1))     // ["3" "12"] — все совпадения (-1 = без ограничений)
fmt.Println(re.FindAllString(s, 1))      // ["3"] — только первое совпадение
fmt.Println(re.ReplaceAllString(s, "N")) // "У меня N кота и N собак"
```

## Захватывающие группы

Группы в скобках позволяют захватить части паттерна:

```
re := regexp.MustCompile(`(\d{4})-(\d{2})-(\d{2})`)
s := "Дата: 2025-03-15"

match := re.FindStringSubmatch(s)
// match[0] = "2025-03-15" — всё совпадение
// match[1] = "2025"       — первая группа
// match[2] = "03"         — вторая группа
// match[3] = "15"         — третья группа

if len(match) > 0 {
    fmt.Printf("Год: %s, месяц: %s, день: %s\n", match[1], match[2], match[3])
}
```

Для именованных групп:

```
re := regexp.MustCompile(`(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})`)
s := "2025-03-15"

match := re.FindStringSubmatch(s)
names := re.SubexpNames()

result := map[string]string{}
for i, name := range names {
    if name != "" && i < len(match) {
        result[name] = match[i]
    }
}
fmt.Println(result["year"])  // 2025
fmt.Println(result["month"]) // 03
```

## Все совпадения с группами

```
re := regexp.MustCompile(`(\w+)=(\w+)`)
s := "name=Alice age=30 city=Moscow"

matches := re.FindAllStringSubmatch(s, -1)
for _, m := range matches {
    fmt.Printf("ключ=%s, значение=%s\n", m[1], m[2])
}
// ключ=name, значение=Alice
// ключ=age, значение=30
// ключ=city, значение=Moscow
```

## Разбивка строки по паттерну

```
re := regexp.MustCompile(`\s+`)
parts := re.Split("один  два   три\tчетыре", -1)
fmt.Println(parts) // [один два три четыре]
```

## Замена с функцией

**ReplaceAllStringFunc** позволяет обработать каждое совпадение:

```
re := regexp.MustCompile(`\d+`)
s := "у меня 3 кота и 12 собак"

result := re.ReplaceAllStringFunc(s, func(match string) string {
    n, _ := strconv.Atoi(match)
    return strconv.Itoa(n * 2) // удвоить каждое число
})
fmt.Println(result) // у меня 6 кота и 24 собак
```

## Основные метасимволы RE2

```
.       — любой символ (кроме \n)
\d      — цифра [0-9]
\D      — не цифра
\w      — буква, цифра или _
\W      — не \w
\s      — пробельный символ
\S      — не пробельный

^       — начало строки
$       — конец строки
*       — 0 или больше повторений
+       — 1 или больше повторений
?       — 0 или 1 повторение
{n}     — ровно n повторений
{n,m}   — от n до m повторений
[abc]   — один из символов
[^abc]  — любой кроме указанных
(a|b)   — a или b
```

## Практический пример: валидация данных

```
var (
    emailRe = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
    phoneRe = regexp.MustCompile(`^\+7\d{10}$`)
    uuidRe  = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
)

func validateEmail(email string) bool {
    return emailRe.MatchString(email)
}

func validatePhone(phone string) bool {
    return phoneRe.MatchString(phone)
}
```

## Итого

Пакет **regexp** использует синтаксис RE2 — он безопасен по времени выполнения. **Компилируйте паттерны один раз** в переменные пакета — это критично для производительности. Для захвата частей используйте группы и **FindStringSubmatch**. Если задачу можно решить через **strings.Contains** или **strings.Split** — предпочтите их: они быстрее и читаемее.
