---
title: "WebSockets"
category: "golang"
categoryTitle: "Go"
section: "web-and-api"
sectionTitle: "Web и API"
sectionOrder: 8
order: 5
---

HTTP работает по модели запрос-ответ: клиент спрашивает, сервер отвечает, соединение закрывается. Для чата, уведомлений в реальном времени или онлайн-игры это не подходит — нужно постоянное двустороннее соединение.

**WebSocket** — протокол, который начинается как обычный HTTP-запрос, а затем "апгрейдится" до постоянного соединения. После апгрейда сервер и клиент могут отправлять сообщения друг другу в любой момент.

## Библиотека gorilla/websocket

Стандартная библиотека Go не включает WebSocket. Самый популярный пакет — **gorilla/websocket**:

```
go get github.com/gorilla/websocket
```

## Базовый WebSocket-сервер

Сервер принимает HTTP-соединение и апгрейдит его до WebSocket. Затем читает и отправляет сообщения в цикле:

```
package main

import (
    "fmt"
    "log"
    "net/http"

    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    CheckOrigin: func(r *http.Request) bool {
        return true // В production проверяйте Origin!
    },
}

func handleWS(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        log.Println("upgrade error:", err)
        return
    }
    defer conn.Close()

    for {
        messageType, message, err := conn.ReadMessage()
        if err != nil {
            log.Println("read error:", err)
            break
        }

        fmt.Printf("Получено: %s\n", message)

        // Эхо — отправить то же сообщение обратно
        if err := conn.WriteMessage(messageType, message); err != nil {
            log.Println("write error:", err)
            break
        }
    }
}

func main() {
    http.HandleFunc("/ws", handleWS)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
```

**upgrader.Upgrade** переключает соединение с HTTP на WebSocket. После этого вы работаете с объектом **conn**: читаете сообщения через **ReadMessage** и отправляете через **WriteMessage**.

## Отправка JSON через WebSocket

На практике сообщения почти всегда в формате JSON. Используйте **ReadJSON** и **WriteJSON** для удобства:

```
type Message struct {
    Type    string `json:"type"`
    Payload string `json:"payload"`
}

func handleWS(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    defer conn.Close()

    for {
        var msg Message
        if err := conn.ReadJSON(&msg); err != nil {
            break
        }

        response := Message{
            Type:    "response",
            Payload: "Получил: " + msg.Payload,
        }
        conn.WriteJSON(response)
    }
}
```

## Хаб для broadcast: отправка всем подключённым клиентам

Реальные приложения (чаты, уведомления) требуют рассылки сообщений всем подключённым клиентам. Для этого используют **Hub** — центральный менеджер соединений:

```
type Hub struct {
    clients    map[*websocket.Conn]bool
    broadcast  chan []byte
    register   chan *websocket.Conn
    unregister chan *websocket.Conn
    mu         sync.Mutex
}

func NewHub() *Hub {
    return &Hub{
        clients:    make(map[*websocket.Conn]bool),
        broadcast:  make(chan []byte),
        register:   make(chan *websocket.Conn),
        unregister: make(chan *websocket.Conn),
    }
}

func (h *Hub) Run() {
    for {
        select {
        case conn := <-h.register:
            h.mu.Lock()
            h.clients[conn] = true
            h.mu.Unlock()

        case conn := <-h.unregister:
            h.mu.Lock()
            delete(h.clients, conn)
            h.mu.Unlock()
            conn.Close()

        case message := <-h.broadcast:
            h.mu.Lock()
            for conn := range h.clients {
                conn.WriteMessage(websocket.TextMessage, message)
            }
            h.mu.Unlock()
        }
    }
}
```

Каждый клиент при подключении регистрируется в хабе. При получении сообщения — отправляет его в канал **broadcast**, и хаб рассылает всем.

## Настройка таймаутов и Ping/Pong

WebSocket-соединения могут зависнуть, если клиент пропал. Настройте Ping/Pong для проверки "жив ли клиент":

```
const (
    writeWait  = 10 * time.Second
    pongWait   = 60 * time.Second
    pingPeriod = (pongWait * 9) / 10
)

func handleWS(w http.ResponseWriter, r *http.Request) {
    conn, _ := upgrader.Upgrade(w, r, nil)
    defer conn.Close()

    conn.SetReadDeadline(time.Now().Add(pongWait))
    conn.SetPongHandler(func(string) error {
        conn.SetReadDeadline(time.Now().Add(pongWait))
        return nil
    })

    ticker := time.NewTicker(pingPeriod)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            conn.SetWriteDeadline(time.Now().Add(writeWait))
            if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return
            }
        }
    }
}
```

Сервер отправляет **Ping** каждые 54 секунды. Если клиент не отвечает **Pong** в течение 60 секунд — соединение закрывается.

## Итого

WebSocket в Go реализуется через **gorilla/websocket** — апгрейд HTTP-соединения и работа с методами **ReadMessage/WriteMessage**. Для чатов и уведомлений используйте паттерн **Hub с каналами** — это безопасный способ рассылки всем клиентам. **Не забывайте про таймауты и Ping/Pong** — без них "мёртвые" соединения накапливаются и расходуют память.
