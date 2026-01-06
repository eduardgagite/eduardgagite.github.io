---
title: "Базовый сценарий CI/CD"
category: "docker"
categoryTitle: "Docker"
section: "registry"
sectionTitle: "Реестры и доставка"
sectionOrder: 8
order: 3
---

Как автоматизировать доставку кода?
Docker идеально вписывается в пайплайны CI/CD (GitHub Actions, GitLab CI).

Рассмотрим типичный процесс **Build -> Push -> Deploy**.

## 1. Build (Сборка)

На сервере сборки (CI Runner):
1. Клонируем код из Git.
2. Логинимся в реестр:
   ```bash
   echo $REGISTRY_PASSWORD | docker login -u $REGISTRY_USER --password-stdin
   ```
3. Собираем образ с тегом (хеш коммита):
   ```bash
   COMMIT_SHA=$(git rev-parse --short HEAD)
   docker build -t myorg/myapp:$COMMIT_SHA .
   ```

## 2. Push (Отправка)

Загружаем собранный образ в реестр:
```bash
docker push myorg/myapp:$COMMIT_SHA
```

## 3. Deploy (Развертывание)

Здесь есть два пути.

### Путь А: SSH (простой)
CI подключается к боевому серверу по SSH и выполняет команды:
```bash
ssh user@production-server "
  docker pull myorg/myapp:$COMMIT_SHA && \
  docker stop myapp || true && \
  docker rm myapp || true && \
  docker run -d --name myapp -p 80:3000 myorg/myapp:$COMMIT_SHA
"
```
*Примечание: Если используете docker-compose, просто обновляете версию в файле .env и делаете `docker compose up -d`.*

### Путь Б: Watchtower (автоматический)
На сервере запущен специальный контейнер **Watchtower**. Он раз в минуту проверяет, не обновился ли образ в реестре. Если обновился — он сам скачивает новый, гасит старый и запускает новый с теми же параметрами.

## Итого

Docker превращает деплой в простую замену одного кирпичика на другой. Вам не нужно настраивать сервер, ставить зависимости и копировать файлы. Вы просто говорите серверу: "Запусти вот этот новый образ".

