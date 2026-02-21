---
title: "Линтеры и статический анализ"
category: "golang"
categoryTitle: "Go"
section: "best-practices"
sectionTitle: "Практики и качество"
sectionOrder: 11
order: 3
---

Go-компилятор ловит ошибки типов, но пропускает множество логических проблем: неиспользуемые результаты, подозрительные конструкции, стилистические несоответствия. Для этого нужны линтеры — инструменты статического анализа, которые проверяют код без его запуска.

В Go-экосистеме три уровня проверки: встроенный **go vet**, форматирование через **gofmt**, и комбайн **golangci-lint**, объединяющий десятки линтеров.

## go vet — встроенная проверка

**go vet** — часть стандартной поставки Go. Он ищет частые ошибки, которые компилятор не считает ошибками, но которые почти всегда являются багами.

```
go vet ./...
```

### Что находит go vet

**Неправильные форматные строки:**

```
x := 42
fmt.Printf("значение: %s\n", x) // go vet: Printf format %s has arg x of wrong type int
```

**Недостижимый код:**

```
func example() int {
    return 1
    fmt.Println("никогда не выполнится") // go vet: unreachable code
}
```

**Копирование мьютекса:**

```
var mu sync.Mutex
mu2 := mu // go vet: assignment copies lock value
```

Мьютекс нельзя копировать — копия не связана с оригиналом, и блокировка не будет работать.

**go vet** — минимальный уровень проверки. Запускайте его всегда, он практически не даёт ложных срабатываний.

## gofmt и goimports — форматирование

В Go-сообществе нет споров о стиле форматирования. Есть один стандарт, и **gofmt** его применяет автоматически. Флаг **-d** покажет различия, **-w** — применит форматирование ко всем файлам:

```
gofmt -d .

gofmt -w .
```

**goimports** делает то же самое, плюс автоматически добавляет и удаляет импорты.

```
go install golang.org/x/tools/cmd/goimports@latest
goimports -w .
```

Настройте редактор так, чтобы **goimports** запускался при сохранении файла. Тогда код всегда будет отформатирован, а неиспользуемые импорты — удалены.

## golangci-lint — комбайн линтеров

**golangci-lint** — самый популярный инструмент для Go. Он запускает десятки линтеров за один проход и работает быстро за счёт параллелизма и кэширования.

### Установка

Установить можно через Homebrew (macOS) или **go install**:

```
brew install golangci-lint

go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

### Запуск

```
golangci-lint run ./...
```

### Что находят линтеры

**errcheck** — пропущенная проверка ошибок:

```
os.Remove("/tmp/file") // errcheck: Error return value is not checked
```

Правильно:

```
if err := os.Remove("/tmp/file"); err != nil {
    log.Printf("не удалось удалить файл: %v", err)
}
```

**staticcheck** — подозрительные конструкции:

```
if x == true { // staticcheck: should omit comparison to bool constant
```

Правильно:

```
if x {
```

**gosimple** — код, который можно упростить:

```
if err != nil {
    return err
} else {
    return nil
}
// gosimple: should replace if/else with return err
```

Правильно:

```
return err
```

**ineffassign** — присваивание, которое нигде не используется:

```
x := computeValue()
x = 10 // ineffassign: x is overwritten before its first use
```

## Конфигурация (.golangci.yml)

Создайте файл **.golangci.yml** в корне проекта, чтобы настроить набор линтеров и исключения.

```
linters:
  enable:
    - errcheck
    - staticcheck
    - gosimple
    - govet
    - ineffassign
    - unused
    - bodyclose
    - gocritic
    - gosec
    - prealloc

linters-settings:
  errcheck:
    check-type-assertions: true
  gocritic:
    enabled-tags:
      - diagnostic
      - style
      - performance

issues:
  exclude-dirs:
    - vendor
    - generated
```

Начните с небольшого набора линтеров и постепенно добавляйте новые. Включить всё сразу на существующем проекте — получить тысячи предупреждений и бросить линтинг.

## Интеграция в CI/CD

Линтер приносит максимальную пользу, когда запускается автоматически при каждом коммите. Пример конфигурации для GitHub Actions:

```
name: lint
on: [push, pull_request]

jobs:
  golangci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.22"
      - name: golangci-lint
        uses: golangci/golangci-lint-action@v4
        with:
          version: latest
```

Если линтер запускается только локально, кто-нибудь обязательно забудет. В CI он работает как строгий ревьювер, которого не обойти.

## Итог

Три уровня проверки: **go vet** (минимум, встроен), **gofmt/goimports** (форматирование), **golangci-lint** (полная проверка). Настройте **goimports** на сохранении в редакторе, а **golangci-lint** — в CI. **Линтер находит баги до того, как их найдут пользователи.**
