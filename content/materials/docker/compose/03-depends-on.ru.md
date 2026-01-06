---
title: "Зависимости сервисов (depends_on)"
category: "docker"
categoryTitle: "Docker"
section: "compose"
sectionTitle: "Docker Compose"
sectionOrder: 7
order: 3
---

Частая проблема: ваше приложение (`web`) стартует быстрее, чем база данных (`db`).
Приложение пытается подключиться, базы еще нет, приложение падает с ошибкой `Connection refused`.

## depends_on

Базовое решение — инструкция `depends_on`.

```yaml
services:
  web:
    build: .
    depends_on:
      - db
  db:
    image: postgres
```

Что это дает?
1. `docker compose up` гарантированно запустит `db` **перед** тем, как запускать `web`.
2. `docker compose up web` автоматически запустит и `db` тоже.

## Проблема «Готовности»

`depends_on` ждет только того момента, когда контейнер с базой запустится (статус `Running`).
Но база данных может запускаться еще 10-30 секунд **внутри** контейнера (инициализация файлов, создание таблиц).
Docker не знает, что происходит внутри процесса. Поэтому `web` запустится, а база всё еще не готова принимать соединения.

## Решение: Healthcheck (Проверка здоровья)

Мы можем научить Docker проверять, жива ли база по-настоящему.

```yaml
services:
  db:
    image: postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"] # Команда проверки
      interval: 10s
      timeout: 5s
      retries: 5
  
  web:
    build: .
    depends_on:
      db:
        condition: service_healthy # Ждать не просто запуска, а "здоровья"
```

Теперь `web` не запустится до тех пор, пока утилита `pg_isready` внутри контейнера `db` не вернет успех. Это самый надежный способ синхронизации запуска.

## Итого

Просто `depends_on` контролирует только порядок старта контейнеров.
`depends_on` + `condition: service_healthy` контролирует **готовность** сервиса к работе.

