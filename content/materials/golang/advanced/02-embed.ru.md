---
title: "Директива go:embed"
category: "golang"
categoryTitle: "Go"
section: "advanced"
sectionTitle: "Продвинутые возможности"
sectionOrder: 13
order: 2
---

До Go 1.16 для встраивания статических файлов в бинарник требовались сторонние инструменты (go-bindata, pkger). С Go 1.16 это встроено в язык через директиву **//go:embed**.

Встраивание позволяет включить файлы (HTML, SQL, конфигурации, шаблоны) прямо в исполняемый файл. Никаких зависимостей от файловой системы при запуске — всё внутри бинарника.

## Встраивание одного файла

```
package main

import (
    _ "embed"
    "fmt"
)

//go:embed version.txt
var version string

func main() {
    fmt.Println("Версия:", version)
}
```

Содержимое файла **version.txt** будет встроено в переменную **version** на этапе компиляции. Важно: директива **//go:embed** должна стоять прямо перед объявлением переменной, без пустых строк между ними.

Для бинарных данных используйте **[]byte** вместо **string**:

```
//go:embed logo.png
var logo []byte
```

## Встраивание нескольких файлов через embed.FS

Тип **embed.FS** позволяет встраивать целые директории:

```
import "embed"

//go:embed templates/*
var templates embed.FS

//go:embed static
var static embed.FS
```

**embed.FS** — это виртуальная файловая система только для чтения. Она реализует интерфейс **fs.FS**.

```
// Прочитать файл из встроенной FS
data, err := templates.ReadFile("templates/index.html")
if err != nil {
    log.Fatal(err)
}
fmt.Println(string(data))

// Прочитать директорию
entries, err := templates.ReadDir("templates")
for _, e := range entries {
    fmt.Println(e.Name())
}
```

## Паттерны glob в директиве

```
//go:embed migrations/*.sql
var migrations embed.FS

//go:embed web/static web/templates
var webFiles embed.FS

// Встроить несколько директорий/файлов
//go:embed sql/*.sql
//go:embed config/default.yaml
var assets embed.FS
```

По умолчанию файлы с именем, начинающимся с точки или подчёркивания, **не встраиваются**. Для их включения используйте **all:**:

```
//go:embed all:data
var data embed.FS
```

## HTTP-сервер со статическими файлами

Классический use-case — раздача статических файлов:

```
package main

import (
    "embed"
    "net/http"
    "io/fs"
    "log"
)

//go:embed static
var staticFiles embed.FS

func main() {
    // Создаём sub-FS без префикса "static/"
    sub, err := fs.Sub(staticFiles, "static")
    if err != nil {
        log.Fatal(err)
    }

    http.Handle("/", http.FileServer(http.FS(sub)))
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

Теперь файлы из директории **static/** будут доступны по URL **/**. При сборке всё попадает в один бинарник — никаких внешних файлов.

## HTML-шаблоны

```
import (
    "embed"
    "html/template"
    "net/http"
)

//go:embed templates/*.html
var templateFiles embed.FS

var tmpl = template.Must(template.ParseFS(templateFiles, "templates/*.html"))

func handler(w http.ResponseWriter, r *http.Request) {
    data := map[string]string{"Name": "Gopher"}
    tmpl.ExecuteTemplate(w, "index.html", data)
}
```

## SQL-миграции из embed.FS

```
//go:embed migrations/*.sql
var migrationsFS embed.FS

func runMigrations(db *sql.DB) error {
    entries, err := migrationsFS.ReadDir("migrations")
    if err != nil {
        return err
    }

    for _, entry := range entries {
        content, err := migrationsFS.ReadFile("migrations/" + entry.Name())
        if err != nil {
            return err
        }

        if _, err := db.Exec(string(content)); err != nil {
            return fmt.Errorf("migration %s: %w", entry.Name(), err)
        }
    }
    return nil
}
```

## Ограничения

- Встроенные файлы доступны только для чтения — изменить их в runtime нельзя.
- Директива работает только в пакетах, не в функциях.
- Пути в директиве **//go:embed** — относительные, от файла с исходным кодом.
- Нельзя встраивать файлы вне модуля или выше по дереву директорий.

## Итого

**go:embed** — встроенный способ упаковать статические файлы в бинарник без сторонних инструментов. **embed.FS** реализует **fs.FS** и совместима с **http.FileServer**, **template.ParseFS** и другими стандартными функциями. Это делает деплой проще: один бинарник содержит всё приложение — статику, шаблоны, миграции.
