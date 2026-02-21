---
title: "Паттерны конкурентности"
category: "golang"
categoryTitle: "Go"
section: "concurrency"
sectionTitle: "Конкурентность"
sectionOrder: 6
order: 5
---

В предыдущих статьях мы разобрали горутины, каналы, select и sync-примитивы. Теперь соберём из этих кирпичиков готовые архитектурные решения, которые встречаются в реальных Go-проектах каждый день.

## Worker Pool — пул воркеров

Задача: обработать 10 000 задач, но запускать не более 5 горутин одновременно (чтобы не перегрузить базу данных или внешний API).

```
func worker(id int, jobs <-chan int, results chan<- int) {
    for job := range jobs {
        fmt.Printf("Воркер %d обрабатывает задачу %d\n", id, job)
        time.Sleep(time.Second)
        results <- job * 2
    }
}

func main() {
    jobs := make(chan int, 100)
    results := make(chan int, 100)

    for w := 1; w <= 5; w++ {
        go worker(w, jobs, results)
    }

    for j := 1; j <= 20; j++ {
        jobs <- j
    }
    close(jobs)

    for i := 1; i <= 20; i++ {
        fmt.Println(<-results)
    }
}
```

Канал **jobs** с типом **<-chan int** (только чтение) и **results** с типом **chan<- int** (только запись) — это направленные каналы. Они не дают воркеру случайно отправить задачу вместо получения.

Пул воркеров решает две задачи: ограничивает нагрузку (не больше N одновременных операций) и эффективно распределяет работу между горутинами.

## Fan-Out / Fan-In

**Fan-Out** — одна горутина раздаёт задачи нескольким воркерам. **Fan-In** — результаты из нескольких каналов собираются в один.

```
func producer(count int) <-chan int {
    out := make(chan int)
    go func() {
        for i := 0; i < count; i++ {
            out <- i
        }
        close(out)
    }()
    return out
}

func square(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * n
        }
        close(out)
    }()
    return out
}

func merge(channels ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup

    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for v := range c {
                out <- v
            }
        }(ch)
    }

    go func() {
        wg.Wait()
        close(out)
    }()

    return out
}

func main() {
    source := producer(10)

    ch1 := square(source)
    ch2 := square(source)
    ch3 := square(source)

    for result := range merge(ch1, ch2, ch3) {
        fmt.Println(result)
    }
}
```

Этот паттерн подходит для конвейерной обработки данных: прочитали из файла → распарсили → обогатили → записали.

## Pipeline — конвейер

Конвейер — цепочка этапов, где выход одного этапа является входом следующего. Каждый этап — отдельная горутина.

```
func generate(nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        for _, n := range nums {
            out <- n
        }
        close(out)
    }()
    return out
}

func double(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n * 2
        }
        close(out)
    }()
    return out
}

func addTen(in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        for n := range in {
            out <- n + 10
        }
        close(out)
    }()
    return out
}

func main() {
    for v := range addTen(double(generate(1, 2, 3, 4))) {
        fmt.Println(v) // 12, 14, 16, 18
    }
}
```

Каждый этап работает в своей горутине. Данные текут по каналам без буферизации — следующий этап начинает работу, как только предыдущий выдаст значение.

## errgroup — параллельные задачи с обработкой ошибок

Пакет **golang.org/x/sync/errgroup** решает частую задачу: запустить N горутин, дождаться всех и вернуть первую ошибку.

```
import "golang.org/x/sync/errgroup"

func fetchAll(urls []string) error {
    g, ctx := errgroup.WithContext(context.Background())

    for _, url := range urls {
        url := url
        g.Go(func() error {
            req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
            if err != nil {
                return fmt.Errorf("создание запроса %s: %w", url, err)
            }

            resp, err := http.DefaultClient.Do(req)
            if err != nil {
                return fmt.Errorf("запрос к %s: %w", url, err)
            }
            defer resp.Body.Close()

            fmt.Printf("%s: %d\n", url, resp.StatusCode)
            return nil
        })
    }

    return g.Wait()
}
```

Если одна из горутин вернёт ошибку, **ctx** будет отменён, и остальные горутины (если они проверяют контекст) тоже остановятся.

### errgroup с лимитом параллелизма

```
g, ctx := errgroup.WithContext(context.Background())
g.SetLimit(5)

for _, task := range tasks {
    task := task
    g.Go(func() error {
        return processTask(ctx, task)
    })
}

err := g.Wait()
```

Метод **SetLimit** превращает errgroup в пул воркеров с обработкой ошибок — часто это всё, что нужно.

## Семафор через буферизированный канал

Если нужен простой лимит параллелизма без errgroup, буферизированный канал работает как семафор.

```
func processWithLimit(items []string, limit int) {
    sem := make(chan struct{}, limit)
    var wg sync.WaitGroup

    for _, item := range items {
        wg.Add(1)
        sem <- struct{}{}

        go func(item string) {
            defer wg.Done()
            defer func() { <-sem }()

            process(item)
        }(item)
    }

    wg.Wait()
}
```

Канал ёмкостью **limit** пропускает не больше **limit** горутин одновременно. Попытка записать в полный канал блокирует, пока кто-то не освободит место.

## Итог

**Worker Pool** — для контролируемой параллельной обработки задач. **Fan-Out/Fan-In** — для распараллеливания одного потока данных. **Pipeline** — для конвейерной обработки в несколько этапов. **errgroup** — для параллельных задач с обработкой ошибок и лимитом. На практике чаще всего хватает **errgroup с SetLimit** — он покрывает 80% случаев.
