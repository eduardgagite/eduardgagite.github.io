---
title: "Практические сценарии"
category: "redis"
categoryTitle: "Redis"
section: "streams"
sectionTitle: "Redis Streams"
sectionOrder: 4
order: 5
---

**Streams** в Redis решают реальные задачи в приложениях, где нужны события в реальном времени или асинхронная обработка. Вот несколько сценариев, где они особенно полезны, с примерами команд.

## Логирование событий

Для сбора логов из разных сервисов добавляйте события в поток:

```
XADD logs:system * service &quot;api&quot; level &quot;error&quot; message &quot;Failed request&quot;
```

Аналитик читает с **XREAD** или через группу для распределения.

Это лучше файлов, потому что логи доступны сразу и из любого места.

## Обработка уведомлений

В чате или соцсети уведомления идут в поток:

```
XADD notifications:user:123 * type &quot;mention&quot; from &quot;user456&quot; text &quot;Hey!&quot;
```

Клиент читает с блокировкой для push-уведомлений.

Группы позволяют масштабировать обработку.

## Асинхронные задачи

Для фоновых jobs, как отправка email:

```
XADD jobs:queue * task &quot;send_email&quot; to &quot;user@example.com&quot; subject &quot;Welcome&quot;
```

Workers в группе обрабатывают и ACK'ют.

Если worker упал, другой заберёт pending.

## Мониторинг метрик

Собирайте метрики в поток:

```
XADD metrics:stream * metric &quot;cpu_usage&quot; value 75 timestamp &quot;now&quot;
```

Аналитические сервисы читают и агрегируют.

## Итог

**Streams** подходят для любых задач с последовательными событиями: от логов до очередей. **Они упрощают архитектуру, заменяя сложные брокеры на простой Redis.** Выбирайте, когда нужна скорость и надёжность без overhead.


