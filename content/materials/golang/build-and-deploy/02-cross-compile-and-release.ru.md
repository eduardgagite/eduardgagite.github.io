---
title: "Кросс-компиляция и релизы"
category: "golang"
categoryTitle: "Go"
section: "build-and-deploy"
sectionTitle: "Сборка и деплой"
sectionOrder: 10
order: 2
---

Go умеет компилировать программу для **любой** операционной системы и архитектуры, даже если вы работаете на другой. Сидите на macOS? Легко соберете бинарник для Linux. Это называется **кросс-компиляция**.

## Кросс-компиляция

Всё управляется двумя переменными окружения:
- **GOOS** — целевая операционная система (linux, darwin, windows).
- **GOARCH** — целевая архитектура процессора (amd64, arm64).

### Примеры

```bash
GOOS=linux GOARCH=amd64 go build -o myapp-linux

GOOS=darwin GOARCH=arm64 go build -o myapp-mac

GOOS=windows GOARCH=amd64 go build -o myapp.exe
```

Вот и всё. Один файл, никаких зависимостей. Скопировал на сервер — работает.

### Посмотреть все доступные платформы

```bash
go tool dist list
```

Выведет десятки комбинаций: от **linux/amd64** до **js/wasm** (WebAssembly для браузера).

## Docker

В мире Kubernetes приложение деплоят как Docker-образ. Go идеально подходит для Docker, потому что бинарник самодостаточен.

### Минимальный Dockerfile

```dockerfile
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags "-s -w" -o /app/server ./cmd/api

FROM scratch
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

### Почему FROM scratch?

**scratch** — это пустой образ (0 байт). Поскольку Go-бинарник самодостаточен, нам не нужны ни Ubuntu, ни Alpine, ни bash. Итоговый Docker-образ будет весить **10-20 МБ** вместо сотен мегабайт.

**CGO_ENABLED=0** отключает использование C-библиотек, что позволяет бинарнику работать в пустом контейнере.

### Если нужен Alpine

Иногда нужны сертификаты (для HTTPS) или временные зоны:

```dockerfile
FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
COPY --from=builder /app/server /server
ENTRYPOINT ["/server"]
```

## Автоматизация релизов с GoReleaser

**GoReleaser** — инструмент, который собирает бинарники для всех платформ, создает архивы и публикует GitHub Release за одну команду.

### Установка

```bash
go install github.com/goreleaser/goreleaser@latest
```

### Конфигурация (.goreleaser.yml)

```yaml
builds:
  - main: ./cmd/api
    goos:
      - linux
      - darwin
      - windows
    goarch:
      - amd64
      - arm64

archives:
  - format: tar.gz
    name_template: "{{ .ProjectName }}_{{ .Os }}_{{ .Arch }}"
```

### Выпуск релиза

```bash
git tag v1.0.0
git push origin v1.0.0
goreleaser release
```

GoReleaser соберет бинарники для 6 платформ (3 ОС * 2 архитектуры), упакует в архивы и опубликует на GitHub Releases.

## Итог

1. Кросс-компиляция: **GOOS=linux GOARCH=amd64 go build**.
2. Docker: используйте multi-stage build с **FROM scratch** для минимального образа.
3. **CGO_ENABLED=0** — для полностью статического бинарника.
4. GoReleaser — автоматизация сборки и публикации для всех платформ.

## Практика

1. Соберите свою программу для трёх платформ: Linux amd64, macOS arm64, Windows amd64. Сравните размеры бинарников.
2. Напишите multi-stage Dockerfile для своего Go-приложения. Соберите образ и проверьте его размер командой `docker images`. Добейтесь размера менее 20 МБ.
3. Настройте `.goreleaser.yml` для своего проекта. Создайте git-тег и запустите `goreleaser release --snapshot` (без публикации) для проверки.
