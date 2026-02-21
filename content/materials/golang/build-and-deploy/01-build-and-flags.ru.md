---
title: "Сборка, флаги и версии"
category: "golang"
categoryTitle: "Go"
section: "build-and-deploy"
sectionTitle: "Сборка и деплой"
sectionOrder: 10
order: 1
---

Одно из главных преимуществ Go — простая и предсказуемая сборка. Результат компиляции — один бинарный файл, который можно скопировать на сервер и запустить. Без зависимостей, без рантайма, без Docker (хотя с Docker тоже отлично).

## Базовая сборка

```
go build
```

Создаст бинарник с именем модуля в текущей папке. Чтобы задать имя:

```
go build -o myapp
```

## Встраивание версии в бинарник

Как узнать, какую версию приложения вы запустили на сервере? Хардкодить версию в коде — неудобно (забудете обновить).

Используйте **ldflags** — флаги линковщика, которые подставляют значения переменных при компиляции.

### Шаг 1: Объявляем переменные

```
package main

import "fmt"

var (
    Version   = "dev"
    BuildTime = "unknown"
    GitCommit = "unknown"
)

func main() {
    fmt.Printf("Версия: %s\n", Version)
    fmt.Printf("Время сборки: %s\n", BuildTime)
    fmt.Printf("Коммит: %s\n", GitCommit)
}
```

### Шаг 2: Передаем значения при сборке

```
go build -ldflags "-X main.Version=1.2.3 -X main.BuildTime=$(date -u '+%Y-%m-%d_%H:%M:%S') -X main.GitCommit=$(git rev-parse --short HEAD)" -o myapp
```

Теперь при запуске **./myapp** вы увидите:
```
Версия: 1.2.3
Время сборки: 2025-01-28_14:30:00
Коммит: a1b2c3d
```

## Оптимизация размера

По умолчанию бинарник содержит отладочную информацию. Её можно убрать:

```
go build -ldflags "-s -w" -o myapp
```

- **-s** — убирает таблицу символов.
- **-w** — убирает DWARF отладочную информацию.

Это может сократить размер бинарника на 20-30%.

## Makefile

Чтобы не запоминать длинные команды, используйте **Makefile**:

```
VERSION := $(shell git describe --tags --always)
BUILD_TIME := $(shell date -u '+%Y-%m-%d_%H:%M:%S')
COMMIT := $(shell git rev-parse --short HEAD)
LDFLAGS := -X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME) -X main.GitCommit=$(COMMIT)

build:
	go build -ldflags "$(LDFLAGS)" -o bin/myapp ./cmd/api

test:
	go test -v ./...

run: build
	./bin/myapp
```

Теперь:
```
make build
make test
make run
```

## Итог

1. **go build -o name** — собирает один самодостаточный бинарник.
2. **-ldflags "-X main.Version=..."** — встраивает версию, коммит, дату сборки.
3. **-ldflags "-s -w"** — уменьшает размер бинарника.
4. **Makefile** — автоматизация сборки.
