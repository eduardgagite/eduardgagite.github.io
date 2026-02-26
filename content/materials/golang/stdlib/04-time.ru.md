---
title: "Пакет time"
category: "golang"
categoryTitle: "Go"
section: "stdlib"
sectionTitle: "Стандартная библиотека"
sectionOrder: 12
order: 4
---

Пакет **time** предоставляет всё необходимое для работы со временем: текущее время, измерение интервалов, форматирование дат, таймеры и тикеры. Он используется в каждом серьёзном Go-проекте.

## Текущее время и основные типы

```
now := time.Now()
fmt.Println(now) // 2025-03-15 14:30:00.123456789 +0300 MSK
```

**time.Time** — основной тип. Содержит момент времени с точностью до наносекунды.

**time.Duration** — промежуток времени. Это просто **int64**, представляющий наносекунды:

```
fmt.Println(time.Second)      // 1s
fmt.Println(time.Minute)      // 1m0s
fmt.Println(time.Hour)        // 1h0m0s
fmt.Println(5 * time.Second)  // 5s
fmt.Println(time.Second / 2)  // 500ms
```

## Разбор компонентов времени

```
t := time.Now()

fmt.Println(t.Year())        // 2025
fmt.Println(t.Month())       // March
fmt.Println(int(t.Month()))  // 3
fmt.Println(t.Day())         // 15
fmt.Println(t.Hour())        // 14
fmt.Println(t.Minute())      // 30
fmt.Println(t.Second())      // 0
fmt.Println(t.Weekday())     // Saturday
fmt.Println(t.Unix())        // 1742039400 — Unix timestamp (секунды с 1970)
fmt.Println(t.UnixMilli())   // 1742039400123 — миллисекунды
```

## Форматирование дат

Главная особенность Go: вместо шаблонов вроде **%Y-%m-%d** используется конкретная дата — **Mon Jan 2 15:04:05 MST 2006**. Это опорное время (reference time). Запоминайте так: **01/02 03:04:05PM '06 -0700**.

```
t := time.Now()

fmt.Println(t.Format("2006-01-02"))                    // 2025-03-15
fmt.Println(t.Format("02.01.2006"))                    // 15.03.2025
fmt.Println(t.Format("2006-01-02 15:04:05"))           // 2025-03-15 14:30:00
fmt.Println(t.Format("02 Jan 2006 15:04 MST"))         // 15 Mar 2025 14:30 MSK
fmt.Println(t.Format(time.RFC3339))                    // 2025-03-15T14:30:00+03:00
fmt.Println(t.Format(time.RFC3339Nano))                // 2025-03-15T14:30:00.123456789+03:00
```

**time.RFC3339** — стандарт для API и баз данных. Используйте его, когда нужна совместимость с другими системами.

## Парсинг строки в time.Time

```
s := "2025-03-15 14:30:00"
t, err := time.Parse("2006-01-02 15:04:05", s)
if err != nil {
    log.Fatal(err)
}
fmt.Println(t.Year()) // 2025
```

Для строк с часовым поясом используйте **time.ParseInLocation**:

```
loc, _ := time.LoadLocation("Europe/Moscow")
t, err := time.ParseInLocation("2006-01-02 15:04:05", "2025-03-15 14:30:00", loc)
```

## Арифметика со временем

```
t := time.Now()

// Добавить время
tomorrow := t.Add(24 * time.Hour)
nextWeek := t.Add(7 * 24 * time.Hour)
in30min := t.Add(30 * time.Minute)

// AddDate для дней/месяцев/лет
nextMonth := t.AddDate(0, 1, 0)
nextYear := t.AddDate(1, 0, 0)

// Разница между двумя моментами
diff := tomorrow.Sub(t)
fmt.Println(diff) // 24h0m0s

// Удобный способ: time.Since и time.Until
elapsed := time.Since(t)  // сколько прошло с t
remaining := time.Until(t) // сколько осталось до t
```

## Сравнение времён

```
a := time.Now()
b := a.Add(time.Hour)

fmt.Println(a.Before(b)) // true
fmt.Println(a.After(b))  // false
fmt.Println(a.Equal(b))  // false
```

Никогда не сравнивайте **time.Time** через **==** напрямую — это не учитывает часовой пояс. Используйте **Equal**.

## Измерение времени выполнения

```
start := time.Now()

// ... какой-то код ...
time.Sleep(100 * time.Millisecond)

elapsed := time.Since(start)
fmt.Printf("Выполнено за %v\n", elapsed) // Выполнено за 100.123ms
```

## Таймеры и тикеры

**time.After** — одноразовый таймер, возвращает канал:

```
// Подождать 5 секунд
<-time.After(5 * time.Second)

// С select — таймаут для операции
select {
case result := <-workChan:
    fmt.Println("Результат:", result)
case <-time.After(3 * time.Second):
    fmt.Println("Таймаут!")
}
```

**time.Ticker** — периодический таймер:

```
ticker := time.NewTicker(time.Second)
defer ticker.Stop() // ВАЖНО: всегда останавливать тикер

for i := 0; i < 5; i++ {
    <-ticker.C
    fmt.Printf("Тик %d в %s\n", i+1, time.Now().Format("15:04:05"))
}
```

**time.Timer** — одноразовый таймер с возможностью остановки:

```
timer := time.NewTimer(5 * time.Second)

go func() {
    // Отменить таймер, если работа закончилась раньше
    timer.Stop()
}()

<-timer.C
fmt.Println("Таймер сработал")
```

## Часовые пояса

```
utc := time.Now().UTC()
moscow, _ := time.LoadLocation("Europe/Moscow")
t := time.Now().In(moscow)

fmt.Println(utc.Format("15:04 MST"))    // 11:30 UTC
fmt.Println(t.Format("15:04 MST"))      // 14:30 MSK
```

Для хранения времени в базе данных всегда сохраняйте UTC и конвертируйте при отображении.

## Итого

Пакет **time** строится вокруг двух типов: **time.Time** (момент) и **time.Duration** (промежуток). **Формат даты в Go — это опорное время 2006-01-02 15:04:05**, а не шаблоны с процентами. Для API используйте **time.RFC3339**. Тикеры всегда **Stop()** после использования — иначе горутина за ними зависнет в памяти.
