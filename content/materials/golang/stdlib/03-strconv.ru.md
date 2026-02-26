---
title: "Пакет strconv"
category: "golang"
categoryTitle: "Go"
section: "stdlib"
sectionTitle: "Стандартная библиотека"
sectionOrder: 12
order: 3
---

В Go нельзя просто присвоить число строке или наоборот — нужно явное преобразование. За это отвечает пакет **strconv** (String Converter): он конвертирует числа, булевы значения и другие примитивы в строки и обратно.

## Числа в строки: Itoa и FormatInt

Самый частый случай — преобразовать **int** в **string**:

```
n := 42
s := strconv.Itoa(n)
fmt.Println(s)         // "42"
fmt.Printf("%T\n", s) // string
```

**Itoa** — это сокращение от "Integer to ASCII". Обратная функция — **Atoi** (ASCII to Integer).

Для точного контроля над форматом используйте **FormatInt**:

```
// FormatInt(значение, основание_счисления)
fmt.Println(strconv.FormatInt(255, 10))  // "255"   — десятичное
fmt.Println(strconv.FormatInt(255, 16))  // "ff"    — шестнадцатеричное
fmt.Println(strconv.FormatInt(255, 2))   // "11111111" — двоичное
fmt.Println(strconv.FormatInt(255, 8))   // "377"   — восьмеричное
```

Для **float64**:

```
f := 3.14159
fmt.Println(strconv.FormatFloat(f, 'f', 2, 64))  // "3.14"   — фиксированная точка, 2 знака
fmt.Println(strconv.FormatFloat(f, 'e', 3, 64))  // "3.142e+00" — экспоненциальная
fmt.Println(strconv.FormatFloat(f, 'g', -1, 64)) // "3.14159"  — кратчайшее представление
```

## Строки в числа: Atoi и ParseInt

```
n, err := strconv.Atoi("42")
if err != nil {
    log.Fatal(err)
}
fmt.Println(n) // 42
```

Если строка не является числом — **err** будет **\*strconv.NumError**:

```
n, err := strconv.Atoi("abc")
// err.(*strconv.NumError).Func = "Atoi"
// err.(*strconv.NumError).Num = "abc"
// err.(*strconv.NumError).Err = strconv.ErrSyntax
```

**ParseInt** даёт больше контроля:

```
// ParseInt(строка, основание, размер_в_битах)
n, err := strconv.ParseInt("ff", 16, 64) // из шестнадцатеричной
fmt.Println(n) // 255

n, err = strconv.ParseInt("11111111", 2, 64) // из двоичной
fmt.Println(n) // 255
```

Размер в битах (8, 16, 32, 64) ограничивает диапазон, но тип результата всегда **int64**.

```
f, err := strconv.ParseFloat("3.14159", 64)
fmt.Println(f) // 3.14159
```

## Булевы значения

```
// bool → string
fmt.Println(strconv.FormatBool(true))   // "true"
fmt.Println(strconv.FormatBool(false))  // "false"

// string → bool
b, err := strconv.ParseBool("true")   // true
b, err = strconv.ParseBool("1")       // true
b, err = strconv.ParseBool("false")   // false
b, err = strconv.ParseBool("0")       // false
b, err = strconv.ParseBool("yes")     // error: invalid syntax
```

## AppendInt и AppendFloat — эффективная запись в []byte

Если вам нужно добавить число к существующему срезу байт без выделения новой строки:

```
buf := []byte("count: ")
buf = strconv.AppendInt(buf, 42, 10)
fmt.Println(string(buf)) // count: 42
```

Это полезно при построении ответов сервера или работе с протоколами вручную — избегает лишних аллокаций.

## Quote и Unquote — экранирование строк

```
s := "hello\nworld"
quoted := strconv.Quote(s)
fmt.Println(quoted) // "hello\nworld" — с экранированием

unquoted, _ := strconv.Unquote(`"hello\nworld"`)
fmt.Println(unquoted) // hello
                      // world
```

Используется при генерации кода, сериализации или парсинге конфигурационных файлов.

## Типичный паттерн: парсинг из параметров запроса

URL-параметры всегда строки. Вот стандартный паттерн конвертации:

```
func handleGetUser(w http.ResponseWriter, r *http.Request) {
    idStr := r.URL.Query().Get("id")
    if idStr == "" {
        http.Error(w, "id parameter required", http.StatusBadRequest)
        return
    }

    id, err := strconv.Atoi(idStr)
    if err != nil {
        http.Error(w, "id must be a number", http.StatusBadRequest)
        return
    }

    // Работаем с id как с int
    user, err := db.GetUser(id)
    // ...
}
```

## Итого

**strconv** — мост между строками и числовыми типами. **Atoi/Itoa** покрывают 80% задач — конвертация **int ↔ string**. **ParseInt/FormatInt** нужны при работе с другими системами счисления (hex, binary). **Всегда проверяйте ошибку** — пользовательский ввод ненадёжен, и непроверенная ошибка приведёт к нулевому значению вместо корректного числа.
