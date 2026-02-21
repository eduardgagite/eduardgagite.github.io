---
title: "Взаимодействие контейнеров (app + db)"
category: "docker"
categoryTitle: "Docker"
section: "networking"
sectionTitle: "Сети"
sectionOrder: 6
order: 3
---

Давайте закрепим знания на реальном примере.
Мы запустим классическую связку: **Веб-приложение (WordPress)** + **База данных (MySQL)**.

## Шаг 1. Создаем сеть

Чтобы они видели друг друга, им нужна общая комната.

```
docker network create wp-net
```

## Шаг 2. Запускаем Базу Данных

Обратите внимание на **--name mysql**. Это имя станет DNS-адресом для вордпресса.

```
docker run -d \
  --name mysql \
  --network wp-net \
  -e MYSQL_ROOT_PASSWORD=somewordpress \
  -e MYSQL_DATABASE=wordpress \
  -e MYSQL_USER=wordpress \
  -e MYSQL_PASSWORD=wordpress \
  mysql:5.7
```

Мы не публикуем порты (**-p**), потому что базе не нужно быть доступной из интернета. Ей нужно быть доступной только внутри сети **wp-net**.

## Шаг 3. Запускаем WordPress

```
docker run -d \
  --name wordpress \
  --network wp-net \
  -e WORDPRESS_DB_HOST=mysql \
  -e WORDPRESS_DB_USER=wordpress \
  -e WORDPRESS_DB_PASSWORD=wordpress \
  -e WORDPRESS_DB_NAME=wordpress \
  -p 8080:80 \
  wordpress:latest
```

Обратите внимание на **-e WORDPRESS_DB_HOST=mysql**. Мы говорим WordPress-у: "Ищи базу данных по адресу **mysql**". Docker направит этот запрос в контейнер с именем **mysql**.

## Результат

Откройте **http://localhost:8080**. Вы увидите установщик WordPress.
Два контейнера общаются друг с другом по внутренней защищенной сети, а наружу торчит только веб-сайт.

## Итого

Это и есть суть микросервисной архитектуры в Docker:
1. Создали сеть.
2. Запустили базу (скрыта от мира).
3. Запустили бэкенд (подключился к базе по имени).
4. Опубликовали порт бэкенда наружу.
