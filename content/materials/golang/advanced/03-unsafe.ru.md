---
title: "Пакет unsafe"
category: "golang"
categoryTitle: "Go"
section: "advanced"
sectionTitle: "Продвинутые возможности"
sectionOrder: 13
order: 3
---

Пакет **unsafe** — это официальный способ обойти систему типов Go. Он позволяет работать с памятью напрямую: получать адреса, конвертировать указатели между несовместимыми типами, вычислять смещения полей.

Несмотря на пугающее название, **unsafe** используется в стандартной библиотеке и известных пакетах — там, где нужна максимальная производительность. Важно понять: когда это уместно, а когда опасно.

## Основные инструменты

### unsafe.Sizeof — размер типа в байтах

```
fmt.Println(unsafe.Sizeof(int(0)))      // 8 (на 64-битной системе)
fmt.Println(unsafe.Sizeof(int32(0)))    // 4
fmt.Println(unsafe.Sizeof(bool(false))) // 1
fmt.Println(unsafe.Sizeof(float64(0))) // 8

type Point struct {
    X, Y float64
}
fmt.Println(unsafe.Sizeof(Point{})) // 16
```

### unsafe.Alignof — выравнивание типа

```
fmt.Println(unsafe.Alignof(int64(0)))   // 8
fmt.Println(unsafe.Alignof(bool(false))) // 1
```

### unsafe.Offsetof — смещение поля структуры

```
type Header struct {
    Magic   uint32
    Version uint16
    Flags   uint16
    Size    uint64
}

fmt.Println(unsafe.Offsetof(Header{}.Magic))   // 0
fmt.Println(unsafe.Offsetof(Header{}.Version)) // 4
fmt.Println(unsafe.Offsetof(Header{}.Flags))   // 6
fmt.Println(unsafe.Offsetof(Header{}.Size))    // 8
fmt.Println(unsafe.Sizeof(Header{}))           // 16
```

Это полезно при работе с бинарными протоколами, где нужно точно знать раскладку структуры в памяти.

## unsafe.Pointer — указатель без типа

**unsafe.Pointer** — аналог **void\*** в C. Можно конвертировать в него любой указатель и обратно:

```
x := int64(42)
p := unsafe.Pointer(&x)        // *int64 → unsafe.Pointer
q := (*float64)(p)              // unsafe.Pointer → *float64

fmt.Println(*q) // 42.0 — те же биты, другой тип
```

## Быстрое преобразование []byte ↔ string без копирования

Самый распространённый use-case **unsafe** в production-коде:

```
// string → []byte без копирования
func unsafeStringToBytes(s string) []byte {
    return unsafe.Slice(unsafe.StringData(s), len(s))
}

// []byte → string без копирования
func unsafeBytesToString(b []byte) string {
    return unsafe.String(unsafe.SliceData(b), len(b))
}
```

**unsafe.String** и **unsafe.SliceData** появились в Go 1.20 и это официальный способ для такой конвертации. Их безопаснее использовать, чем предыдущий подход через **reflect.StringHeader**.

**Критически важно**: нельзя изменять байты, полученные из строки через **unsafe** — строки в Go неизменяемы, и нарушение этого приведёт к неопределённому поведению.

## uintptr и арифметика указателей

Для арифметики с указателями нужен **uintptr** — числовое представление адреса:

```
type Point struct {
    X int
    Y int
}

p := &Point{X: 1, Y: 2}

// Получить указатель на поле Y через арифметику
yPtr := (*int)(unsafe.Pointer(
    uintptr(unsafe.Pointer(p)) + unsafe.Offsetof(p.Y),
))
fmt.Println(*yPtr) // 2
```

**Важное правило**: никогда не храните **uintptr** в переменной между операциями — GC может переместить объект, и адрес станет недействительным. Всё арифметические выражения должны быть в одной строке (одном выражении).

## Когда unsafe уместен

Используйте **unsafe** только если:
1. Нужна максимальная производительность в горячем пути (hot path), и профилировщик подтвердил проблему.
2. Вы работаете с бинарными протоколами или низкоуровневыми API.
3. Вы пишете системную библиотеку, а не бизнес-логику.

В остальных случаях — не используйте. Преимущества Go (типобезопасность, GC, простота) существуют именно потому, что вы не работаете с памятью вручную.

## Итого

**unsafe** — это инструмент для крайних случаев, не повседневного кода. Основные применения: **измерение размеров и смещений** структур, **конвертация string ↔ []byte без копирования** (Go 1.20+), работа с бинарными протоколами. **uintptr** нельзя хранить между операциями — GC не знает о нём и может переместить данные в памяти.
