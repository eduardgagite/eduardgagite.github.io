---
title: "Введение в Docker Compose"
category: "docker"
categoryTitle: "Docker"
section: "compose"
sectionTitle: "Docker Compose"
sectionOrder: 7
order: 1
---

Запускать контейнеры командами `docker run` с кучей флагов (`-v`, `-p`, `--network`, `-e`) — это неудобно, ненадежно и сложно воспроизводить. Если у вас 5 сервисов, запуск превращается в ад.

**Docker Compose** решает эту проблему. Это инструмент для описания и запуска мульти-контейнерных приложений.
Вы описываете всю конфигурацию в одном YAML-файле (`docker-compose.yml`) и запускаете всё одной командой.

## Структура docker-compose.yml

Давайте перепишем пример с WordPress и MySQL из прошлого урока на язык Compose.

```yaml
version: '3.8'  # Версия схемы (необязательно в новых версиях, но полезно)

services:       # Список наших контейнеров
  db:           # Имя сервиса (оно же будет DNS-именем)
    image: mysql:5.7
    volumes:
      - db_data:/var/lib/mysql  # Подключаем именованный том
    restart: always
    environment: # Переменные окружения
      MYSQL_ROOT_PASSWORD: somewordpress
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress

  wordpress:
    depends_on:  # Указываем зависимость: не запускать WP, пока не стартанет db
      - db
    image: wordpress:latest
    ports:
      - "8080:80" # Проброс портов "Внешний:Внутренний"
    restart: always
    environment:
      WORDPRESS_DB_HOST: db:3306 # Обращаемся к базе по имени сервиса "db"
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: wordpress
      WORDPRESS_DB_NAME: wordpress

volumes: # Объявляем тома, которые используем выше
  db_data:
```

## Что изменилось?

1. **Декларативность:** Мы не пишем команды, мы описываем *желаемое состояние*.
2. **Сеть:** Docker Compose **автоматически** создает общую сеть для всех сервисов в файле. Нам не нужно делать `docker network create`.
3. **DNS:** Имена сервисов (`db`, `wordpress`) автоматически становятся хостнеймами.

Теперь, чтобы запустить весь этот зоопарк, нужна всего одна команда:
```bash
docker compose up -d
```
(`-d` — detached mode, запустить в фоне).

## Итого

Docker Compose — это стандарт для локальной разработки.
Вместо того чтобы хранить `.txt` файл с длинными командами `docker run`, вы храните аккуратный `docker-compose.yml` в репозитории проекта.

