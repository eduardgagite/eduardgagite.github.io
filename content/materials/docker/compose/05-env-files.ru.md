---
title: "Использование переменных окружения (.env)"
category: "docker"
categoryTitle: "Docker"
section: "compose"
sectionTitle: "Docker Compose"
sectionOrder: 7
order: 5
---

Хардкодить пароли в **docker-compose.yml** — плохая идея. Файл попадет в git, и пароли утекут.
Docker Compose нативно поддерживает файлы **.env**.

## Как это работает

1. Создайте файл **.env** рядом с **docker-compose.yml**:

```
DB_USER=admin
DB_PASS=super_secret_password_123
DB_PORT=5432
```

2. Используйте переменные в **docker-compose.yml**:

```
services:
  db:
    image: postgres
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
    ports:
      - "${DB_PORT}:5432"
```

Теперь вы можете коммитить **docker-compose.yml** в репозиторий, а **.env** добавить в **.gitignore**.
У каждого разработчика будет свой **.env** со своими настройками.

## Значения по умолчанию

Можно задавать дефолтные значения прямо в YAML, если переменная не найдена:

```
ports:
  - "${PORT:-8080}:80"
```

## Итого

Никогда не храните секреты в чистом виде в **docker-compose.yml**. Используйте **.env** файл — это стандарт индустрии для конфигурации 12-factor приложений.
