---
title: "Установка Docker и проверка работоспособности"
category: "docker"
categoryTitle: "Docker"
section: "setup"
sectionTitle: "Установка и первый запуск"
sectionOrder: 2
order: 1
---

Перед тем как начать, нам нужно установить Docker. Процесс установки зависит от вашей операционной системы, но суть везде одна: мы ставим Docker Engine (сам движок) и Docker CLI (клиент).

## Установка

Мы не будем дублировать официальную документацию, так как она обновляется чаще, чем этот курс. Перейдите по ссылке для вашей ОС и выполните инструкции:

- **Windows / macOS**: Установите **Docker Desktop**. Это самый простой способ, который включает в себя всё необходимое + удобный графический интерфейс.
  - [Скачать для Windows](https://docs.docker.com/desktop/install/windows-install/)
  - [Скачать для Mac](https://docs.docker.com/desktop/install/mac-install/)
- **Linux**: Рекомендуется устанавливать **Docker Engine** через репозиторий.
  - [Инструкция для Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
  - [Инструкция для CentOS](https://docs.docker.com/engine/install/centos/)

> **Важно для Linux**: После установки не забудьте добавить своего пользователя в группу docker, чтобы не писать `sudo` перед каждой командой:
> ```bash
> sudo usermod -aG docker $USER
> ```

## Проверка установки

Откройте терминал (PowerShell, Terminal, iTerm) и введите команду:

```bash
docker version
```

Если вы видите вывод с информацией о **Client** и **Server** — поздравляем, Docker работает!
Если вы видите ошибку `Cannot connect to the Docker daemon`, значит сам движок Docker не запущен. На Windows/Mac запустите приложение Docker Desktop.

## Hello World

По традиции запустим самый простой контейнер, чтобы убедиться, что всё действительно работает (сеть, скачивание образов, запуск).

Выполните команду:

```bash
docker run hello-world
```

Что должно произойти:
1. Docker скажет: `Unable to find image 'hello-world:latest' locally` (Не нашел образ локально).
2. `Pulling from library/hello-world` (Скачивает из интернета).
3. Выведет приветственное сообщение: `Hello from Docker!`.

Если вы видите этот текст — ваша среда полностью готова к работе.

## Итого

Мы установили Docker и проверили его работоспособность тестовым образом. Теперь мы готовы запускать настоящие приложения.

