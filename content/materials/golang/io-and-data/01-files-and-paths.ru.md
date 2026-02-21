---
title: "Работа с файлами и путями"
category: "golang"
categoryTitle: "Go"
section: "io-and-data"
sectionTitle: "I/O и данные"
sectionOrder: 5
order: 1
---

Любая программа рано или поздно должна что-то сохранить на диск или прочитать оттуда: конфиги, логи, данные пользователей, результаты работы. В Go работа с файлами реализована в пакете **os** и его помощниках.

## Чтение файла целиком

Самый простой способ. Подходит для небольших файлов (конфиги, ключи, шаблоны).

```
import (
    "fmt"
    "os"
)

func main() {
    data, err := os.ReadFile("config.json")
    if err != nil {
        fmt.Println("Ошибка:", err)
        return
    }

    content := string(data)
    fmt.Println(content)
}
```

**Когда НЕ использовать**: Если файл большой (логи, дампы, видео). **os.ReadFile** загружает **ВЕСЬ** файл в оперативную память. Файл на 5 ГБ = 5 ГБ памяти. Для больших файлов используйте потоковое чтение (следующий урок).

## Запись в файл

### Перезапись (WriteFile)

Создает файл (или перезаписывает, если существует).

```
content := []byte("Hello, Go!\nВторая строка")

err := os.WriteFile("output.txt", content, 0644)
if err != nil {
    fmt.Println("Ошибка записи:", err)
}
```

### Дописать в конец файла (Append)

Если нужно добавить строку, а не перезаписать весь файл (например, в лог):

```
f, err := os.OpenFile("app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
if err != nil {
    panic(err)
}
defer f.Close()

f.WriteString("2025-01-28 Событие произошло\n")
```

## Проверка существования файла

```
_, err := os.Stat("config.json")

if os.IsNotExist(err) {
    fmt.Println("Файл не существует")
} else if err != nil {
    fmt.Println("Ошибка:", err)
} else {
    fmt.Println("Файл найден")
}
```

## Создание и удаление

```
os.MkdirAll("data/uploads/images", 0755)

os.Remove("temp.txt")

os.RemoveAll("data/uploads")
```

## Работа с путями (filepath)

В Windows пути пишутся через обратный слэш: **C:\Users\file.txt**.
В Linux/macOS — через прямой: **/home/user/file.txt**.

Чтобы программа работала на любой ОС, **никогда не склеивайте пути через + или конкатенацию строк**. Используйте пакет **path/filepath**.

```
import "path/filepath"

path := filepath.Join("data", "uploads", "image.png")

ext := filepath.Ext("photo.jpg") // ".jpg"

name := filepath.Base("/home/user/photo.jpg") // "photo.jpg"

dir := filepath.Dir("/home/user/photo.jpg") // "/home/user"
```

### Обход директории (Walk)

Чтобы найти все файлы в папке (рекурсивно):

```
filepath.Walk(".", func(path string, info os.FileInfo, err error) error {
    if err != nil {
        return err
    }
    if !info.IsDir() {
        fmt.Println("Файл:", path)
    }
    return nil
})
```

## Итог

1. **os.ReadFile** — быстро прочитать маленький файл.
2. **os.WriteFile** — записать/перезаписать файл.
3. **os.OpenFile** с **O_APPEND** — дописать в конец (для логов).
4. **filepath.Join** — безопасно склеивать пути на любой ОС.
5. Не забывайте **defer f.Close()** при работе с открытыми файлами.
