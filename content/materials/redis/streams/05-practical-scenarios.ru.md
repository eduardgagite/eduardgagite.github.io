---
title: "Практические сценарии"
category: "redis"
categoryTitle: "Redis"
section: "streams"
sectionTitle: "Redis Streams"
sectionOrder: 4
order: 5
---

**Redis Streams** хорошо раскрываются на живых задачах: когда нужно передать событие между сервисами, организовать фоновые работы или собрать последовательный лог действий пользователей. Ниже — несколько типичных сценариев, которые легко повторить и адаптировать под свои проекты.

Каждый пример опирается на уже знакомые команды **XADD**, **XREAD**, **XGROUP** и **XREADGROUP**.

## Фоновые задачи: отправка писем и уведомлений

Классика для Streams — вынести отправку писем, пушей и других уведомлений в отдельную очередь, чтобы не блокировать основной HTTP-запрос.

Постановка задач в очередь:

```
XGROUP CREATE notify:tasks:stream notify-workers $ MKSTREAM

XADD notify:tasks:stream * user_id 123 type "email" template "welcome"
XADD notify:tasks:stream * user_id 456 type "push" template "promo" channel "mobile"
```

Воркеры читают задачи и обрабатывают их:

```
XREADGROUP GROUP notify-workers worker-1 COUNT 10 STREAMS notify:tasks:stream >
```

После успешной отправки:

```
XACK notify:tasks:stream notify-workers 1698249601-0 1698249602-0
```

Такое разделение позволяет:

- не держать пользователя в ожидании долгой отправки;
- масштабировать только воркеры уведомлений при росте нагрузки;
- гибко управлять повторами при временных ошибках внешних сервисов.

## Лог действий пользователей для аналитики

Вместо того чтобы сразу писать каждое действие в тяжёлую базу, можно сначала собрать события в поток, а затем асинхронно выгружать их в хранилище аналитики.

Запись событий:

```
XADD analytics:user:activity:stream * user_id 123 action "view_page" page "/products/42"
XADD analytics:user:activity:stream * user_id 123 action "add_to_cart" product_id 42
XADD analytics:user:activity:stream * user_id 789 action "search" query "laptop"
```

Сервис аналитики периодически читает новые записи:

```
XREAD COUNT 100 STREAMS analytics:user:activity:stream $
```

Либо работает через свою группу:

```
XGROUP CREATE analytics:user:activity:stream analytics-workers $ MKSTREAM
XREADGROUP GROUP analytics-workers etl-1 COUNT 100 STREAMS analytics:user:activity:stream >
```

Преимущества:

- события не теряются, даже если аналитическое хранилище временно недоступно;
- можно повторно прогнать историю для отладки или перерасчёта метрик;
- нагрузка на основную базу снижается, так как запись идёт батчами.

## Шина событий между микросервисами

Streams удобно использовать как простую шину событий: один сервис публикует бизнес-события, остальные подписываются на них через свои группы.

Продюсер заказов пишет в поток:

```
XADD events:orders:stream * event "order_created" order_id 501 user_id 123 amount 1500
XADD events:orders:stream * event "order_cancelled" order_id 502 user_id 456 reason "payment_failed"
```

Сервис биллинга создаёт свою группу и реагирует только на нужные события:

```
XGROUP CREATE events:orders:stream billing-subscribers $ MKSTREAM
XREADGROUP GROUP billing-subscribers billing-1 COUNT 10 STREAMS events:orders:stream >
```

Сервис уведомлений делает то же самое, но обрабатывает события по-своему:

```
XGROUP CREATE events:orders:stream notify-subscribers $ MKSTREAM
XREADGROUP GROUP notify-subscribers notify-1 COUNT 10 STREAMS events:orders:stream >
```

Каждая группа видит все события независимо от других и ведёт свой прогресс чтения. Это позволяет легко добавлять новые потребители, не меняя продюсера.

## Ограничение скоростей и «умные» очереди

Streams можно использовать как основу для rate limiting и более сложных схем обработки, когда важно не только выполнить задачи, но и соблюдать ограничения по скорости.

Например, у нас есть поток задач на внешнее API, где нельзя делать больше 100 запросов в минуту:

```
XGROUP CREATE external:api:tasks:stream api-workers $ MKSTREAM

XADD external:api:tasks:stream * user_id 123 endpoint "/profile" priority "normal"
XADD external:api:tasks:stream * user_id 456 endpoint "/balance" priority "high"
```

Воркеры:

- читают задачи через **XREADGROUP**;
- перед выполнением смотрят счётчик запросов в **rate:external:api**;
- либо сразу выполняют и инкрементят счётчик, либо откладывают задачу на потом.

Комбинация **Streams** и счётчиков в Redis позволяет строить гибкие схемы ограничения скорости без сложной инфраструктуры.

## Итог

**Redis Streams** хорошо подходят для задач, где есть последовательность событий или задач, которые нужно безопасно передавать между частями системы и обрабатывать асинхронно.

На их основе можно строить очереди фоновых работ, логи и шины событий для микросервисов, при этом оставаясь в рамках знакомого Redis и не вводя отдельную систему для каждого сценария.