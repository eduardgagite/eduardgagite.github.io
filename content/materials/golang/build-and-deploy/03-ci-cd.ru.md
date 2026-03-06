---
title: "CI/CD и GitHub Actions"
category: "golang"
categoryTitle: "Go"
section: "build-and-deploy"
sectionTitle: "Сборка и деплой"
sectionOrder: 10
order: 3
---

CI/CD (Continuous Integration / Continuous Deployment) — автоматический запуск тестов, линтеров и сборки при каждом коммите. Для Go-проектов это особенно просто: один бинарник, быстрая компиляция, встроенные тесты.

**GitHub Actions** — самый распространённый CI для open-source Go-проектов. Конфигурация хранится в YAML-файлах в директории **.github/workflows/**.

## Минимальный workflow: тесты

```yaml
name: Go CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-go@v5
        with:
          go-version: "1.24"

      - name: Run tests
        run: go test -v -race ./...
```

Этот workflow запускается при push в main и при PR. Флаг **-race** включает детектор гонок — обязателен для Go-проектов с конкурентностью.

## Полный workflow: тесты + линтер + сборка

```yaml
name: Go CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.24"
      - name: golangci-lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: latest

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.24"
      - name: Run tests
        run: go test -v -race -coverprofile=coverage.out ./...
      - name: Show coverage
        run: go tool cover -func=coverage.out

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.24"
      - name: Build
        run: go build -o bin/app ./cmd/api
```

Три джобы запускаются параллельно (**lint** и **test**), а **build** ждёт их завершения через **needs**.

## Тесты с базой данных

Если тесты требуют PostgreSQL, добавьте сервис:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with:
          go-version: "1.24"
      - name: Run tests
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/testdb?sslmode=disable
        run: go test -v -race ./...
```

GitHub Actions поднимет контейнер PostgreSQL перед тестами и дождётся его готовности через **health-cmd**.

## Кэширование зависимостей

**actions/setup-go@v5** автоматически кэширует модули Go (директорию **~/go/pkg/mod**). Если вы используете более раннюю версию, добавьте кэш вручную:

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/go/pkg/mod
      ~/.cache/go-build
    key: go-${{ hashFiles('**/go.sum') }}
    restore-keys: go-
```

## Автоматический релиз с GoReleaser

Для автоматической публикации бинарников при создании тега:

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-go@v5
        with:
          go-version: "1.24"
      - uses: goreleaser/goreleaser-action@v6
        with:
          version: latest
          args: release --clean
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Теперь при **git tag v1.0.0 && git push --tags** GoReleaser соберёт бинарники для всех платформ и опубликует GitHub Release.

## Docker-образ в CI

Сборка и пуш Docker-образа в GitHub Container Registry:

```yaml
name: Docker

on:
  push:
    branches: [main]

jobs:
  docker:
    runs-on: ubuntu-latest
    permissions:
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:latest
```

## Полезные практики

1. **Всегда используйте -race** в CI. Детектор гонок находит баги, которые невозможно воспроизвести локально.
2. **Фиксируйте версию Go** в workflow. Не используйте "latest" — это ломает воспроизводимость.
3. **Запускайте линтер как отдельную джобу**. Линтер не должен блокировать тесты, и наоборот.
4. **Собирайте покрытие** (**-coverprofile**). Это мотивирует писать тесты и помогает находить непокрытые участки.
5. **Не храните секреты в коде**. Используйте **secrets** в GitHub Actions.

## Итого

CI/CD для Go-проекта — это три шага: **линтер** (golangci-lint), **тесты** (go test -race), **сборка** (go build). GitHub Actions покрывает все сценарии: от простых тестов до автоматических релизов с GoReleaser и публикации Docker-образов. Настройте один раз — и каждый PR будет автоматически проверен.

## Смотрите также

- **Линтеры и статический анализ** — настройка golangci-lint (раздел «Практики и качество → Линтеры и статический анализ»).
- **Кросс-компиляция и релизы** — GoReleaser и Docker (раздел «Сборка и деплой → Кросс-компиляция и релизы»).
