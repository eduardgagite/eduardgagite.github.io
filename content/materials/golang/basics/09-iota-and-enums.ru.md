---
title: "Iota и перечисления"
category: "golang"
categoryTitle: "Go"
section: "basics"
sectionTitle: "Базовые конструкции"
sectionOrder: 2
order: 9
---

В Go нет встроенного типа **enum** как в Java или TypeScript. Вместо него используют **iota** — специальный инструмент для создания последовательных констант, который полностью закрывает эту потребность.

## Что такое iota

**iota** — это счётчик, который автоматически увеличивается на 1 в блоке **const**. Начинается с 0 и сбрасывается в начале каждого нового блока.

```
const (
    StatusPending   = iota // 0
    StatusActive           // 1
    StatusCompleted        // 2
    StatusCancelled        // 3
)
```

Каждая строка блока — это выражение с **iota**, и оно автоматически вычисляется. Не нужно писать цифры вручную.

## Пользовательские типы для перечислений

Просто числа — это неудобно: ошибиться легко, и компилятор не поможет. Поэтому всегда создают именованный тип:

```
type OrderStatus int

const (
    StatusPending   OrderStatus = iota // 0
    StatusActive                       // 1
    StatusCompleted                    // 2
    StatusCancelled                    // 3
)
```

Теперь функция, принимающая **OrderStatus**, не примет просто число — это отдельный тип:

```
func processOrder(status OrderStatus) {
    // ...
}

processOrder(StatusActive)    // OK
processOrder(1)               // Ошибка компиляции — нельзя передать int вместо OrderStatus
```

## Пропуск значений с помощью _

Если первое значение должно быть 1, а не 0, или нужно пропустить какое-то значение — используйте **_**:

```
type Priority int

const (
    _ Priority = iota // 0 — пропускаем (не используем нулевое значение)
    Low               // 1
    Medium            // 2
    High              // 3
    Critical          // 4
)
```

Нулевое значение часто означает "не задано", поэтому его пропускают — чтобы неинициализированная переменная не притворялась допустимым значением.

## Выражения с iota

**iota** можно использовать в выражениях — множить, сдвигать биты, складывать:

```
// Степени двойки — удобно для флагов
type Permission int

const (
    Read    Permission = 1 << iota // 1   (0001)
    Write                          // 2   (0010)
    Execute                        // 4   (0100)
    Admin                          // 8   (1000)
)
```

Это классический паттерн для **битовых флагов**: каждое значение занимает свой бит, и их можно комбинировать через побитовое ИЛИ:

```
userPermissions := Read | Write // 3 (0011)

if userPermissions&Read != 0 {
    fmt.Println("Можно читать")
}
```

## Метод String() для читаемого вывода

По умолчанию при выводе **OrderStatus** в консоль вы увидите просто цифру **2**, а не **"StatusCompleted"**. Чтобы это исправить, реализуйте интерфейс **Stringer**:

```
func (s OrderStatus) String() string {
    switch s {
    case StatusPending:
        return "Pending"
    case StatusActive:
        return "Active"
    case StatusCompleted:
        return "Completed"
    case StatusCancelled:
        return "Cancelled"
    default:
        return "Unknown"
    }
}

func main() {
    status := StatusActive
    fmt.Println(status) // Active — а не 1
}
```

Теперь **fmt.Println** и **fmt.Sprintf("%v", ...)** автоматически используют ваш метод.

## Валидация значений

Хороший паттерн — добавить метод для проверки допустимости значения. Это защищает от случайного использования чисел за пределами диапазона:

```
func (s OrderStatus) IsValid() bool {
    return s >= StatusPending && s <= StatusCancelled
}
```

И метод для преобразования строки в статус (полезно при чтении из базы данных или JSON):

```
func ParseOrderStatus(s string) (OrderStatus, error) {
    switch s {
    case "Pending":
        return StatusPending, nil
    case "Active":
        return StatusActive, nil
    case "Completed":
        return StatusCompleted, nil
    case "Cancelled":
        return StatusCancelled, nil
    default:
        return 0, fmt.Errorf("unknown status: %s", s)
    }
}
```

## Итого

**iota** — элегантный способ создавать перечисления в Go без встроенного enum. Всегда создавайте именованный тип для констант — это даёт типобезопасность. **Нулевое значение лучше пропускать или использовать как "не задано"**, чтобы неинициализированная переменная не вела себя как допустимое состояние. Метод **String()** делает отладку и логирование значительно удобнее.
