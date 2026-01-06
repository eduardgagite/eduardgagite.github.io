---
title: "Работа с реестрами: login, push, pull"
category: "docker"
categoryTitle: "Docker"
section: "registry"
sectionTitle: "Реестры и доставка"
sectionOrder: 8
order: 1
---

Вы создали образ на своем ноутбуке. Как передать его коллеге или на продакшн-сервер?
Ответ: через **Реестр (Registry)**.

Реестр — это как GitHub, только для Docker-образов.
Самый известный — **Docker Hub** (публичный). Также популярны **GitLab Container Registry**, **AWS ECR**, **Google GCR**.

## 1. Авторизация (Login)

Прежде чем что-то загружать, нужно представиться.

```bash
# Логин в Docker Hub (потребует ввести username и password)
docker login

# Логин в приватный реестр (например, GitLab)
docker login registry.gitlab.com
```

## 2. Тегирование (Tag)

Docker не знает, куда отправлять образ `my-app`, потому что в имени нет адреса.
Чтобы отправить образ в реестр, его имя должно соответствовать формату:
`<адрес-реестра>/<пользователь>/<имя-образа>:<версия>`

Допустим, ваш логин на Docker Hub — `ivan`.
У вас есть локальный образ `my-app:latest`. Создадим для него "сетевой" псевдоним:

```bash
docker tag my-app:latest ivan/my-app:v1
```

## 3. Отправка (Push)

Теперь Docker знает, куда это слать (по умолчанию в Docker Hub, так как адрес реестра не указан явно).

```bash
docker push ivan/my-app:v1
```

## 4. Скачивание (Pull)

На сервере или компьютере коллеги:

```bash
docker pull ivan/my-app:v1
```

И запуск:
```bash
docker run -d ivan/my-app:v1
```

## Приватные реестры

Если вы работаете с GitLab:
1. `docker tag my-app registry.gitlab.com/ivan/project/app:v1`
2. `docker push registry.gitlab.com/ivan/project/app:v1`

Docker смотрит на первую часть имени (до первого слеша) и понимает, на какой сервер стучаться.

## Итого

1. Собрали (`build`).
2. Присвоили правильное имя с адресом реестра (`tag`).
3. Залогинились (`login`).
4. Отправили (`push`).
Это стандартный путь доставки кода в современном мире.

