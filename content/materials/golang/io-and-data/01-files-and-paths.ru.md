---
title: "Работа с файлами и путями"
category: "golang"
categoryTitle: "Go"
section: "io-and-data"
sectionTitle: "I/O и данные"
sectionOrder: 5
order: 1
---

Любая программа рано или поздно должна что-то сохранить или прочитать с диска. В Go работа с файлами реализована в пакете `os`.

## Чтение файла целиком

Если файл небольшой (конфиг, ключи), проще всего прочитать его сразу в память одной командой.

```go
import (
    "fmt"
    "os"
)

func main() {
    // ReadFile возвращает срез байтов []byte и ошибку
    data, err := os.ReadFile("config.txt")
    if err != nil {
        // Если файла нет или нет прав доступа
        fmt.Println("Ошибка чтения:", err)
        return
    }

    // Превращаем байты в строку, чтобы прочитать текст
    content := string(data)
    fmt.Println(content)
}
```

**Важно**: `os.ReadFile` загружает ВЕСЬ файл в оперативную память. Если файл весит 5 ГБ, ваша программа тоже займет 5 ГБ памяти. Для больших файлов это не подходит.

## Запись в файл

Чтобы записать данные, используем `os.WriteFile`.

```go
message := []byte("Hello, Go!")

// Имя файла, данные, права доступа (0644 - стандарт: я читаю/пишу, другие только читают)
err := os.WriteFile("output.txt", message, 0644)
if err != nil {
    fmt.Println("Ошибка записи:", err)
}
```

Если файл уже был, он **перезапишется** полностью.

## Работа с путями (filepath)

В Windows пути выглядят так: `C:\Project\file.txt` (обратный слэш).
В Linux и macOS так: `/home/user/file.txt` (прямой слэш).

Чтобы ваша программа работала везде и не ломалась из-за разницы в слэшах, **никогда не собирайте пути руками через `+`**. Используйте пакет `path/filepath`.

```go
import (
    "fmt"
    "path/filepath"
)

func main() {
    // Join сама поставит правильный разделитель (/ или \)
    path := filepath.Join("data", "uploads", "image.png")
    fmt.Println(path)
    // Linux: data/uploads/image.png
    // Windows: data\uploads\image.png

    // Получить расширение файла
    ext := filepath.Ext(path) // .png
    fmt.Println(ext)
}
```

## Итог

1. `os.ReadFile` — быстро прочитать мелкий файл.
2. `os.WriteFile` — быстро записать/перезаписать файл.
3. `filepath.Join` — безопасный способ склеивать пути, работающий на любой OS.
