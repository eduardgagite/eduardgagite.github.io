# eduardgagite.github.io

Личный сайт и практическая база знаний по backend-разработке на React, TypeScript, Vite и Tailwind CSS.

Проект объединяет:

- компактную страницу с информацией об авторе и контактами;
- 167 русскоязычных материалов по Go, Redis и Docker;
- навигацию по курсам, поиск, горячие клавиши и SEO-метаданные для каждой статьи.

## Локальная разработка

Требования:

- Node.js 20.19 или новее;
- npm.

```bash
npm ci
npm run dev
```

Основные команды:

```bash
npm run check         # TypeScript, ESLint, Prettier и все тесты
npm run format        # Применить правила форматирования
npm run build         # Перегенерировать контент, метаданные и production-сборку
npm run preview       # Запустить просмотр production-сборки на порту 5173
```

## Структура проекта

```text
content/materials/       Исходные Markdown-материалы
scripts/                 Генераторы контента, метаданных и sitemap
scripts/tests/           Тесты данных, маршрутизации и локализации
src/components/          Общие компоненты интерфейса
src/features/materials/  Логика и интерфейс раздела материалов
src/materials/           Загрузчик, типы и сгенерированный индекс
src/pages/               Компоненты страниц
public/                  Сгенерированный контент и статические ресурсы
```

Markdown-файлы — единственный источник истины для материалов. Во время разработки и production-сборки:

1. `scripts/generate-static-assets.mjs` создаёт Open Graph PNG размером 1200×630 из SVG-источника.
2. `scripts/generate-materials-json.mjs` проверяет frontmatter и генерирует публичный индекс и содержимое статей.
3. `scripts/generate-sitemap.mjs` создаёт `public/sitemap.xml`.
4. TypeScript и Vite собирают приложение.
5. `scripts/generate-route-shells.mjs` создаёт отдельные HTML-метаданные для страницы материалов и каждой статьи.

## Добавление материала

Создайте файл:

```text
content/materials/<category>/<section>/<slug>.ru.md
```

Каждый материал должен содержать frontmatter:

```yaml
---
title: 'Название материала'
category: 'golang'
categoryTitle: 'Go'
section: 'intro'
sectionTitle: 'Введение'
sectionOrder: 1
order: 1
---
```

Дополнительные поля: `subtitle`, `datePublished`, `dateModified`, `level` и `tags`.

После изменения контента выполните:

```bash
npm run build
npm run check
```

Сгенерированные JSON-файлы и sitemap хранятся в репозитории, чтобы GitHub Pages мог раздавать их как статические ресурсы.

## Локализация

Интерфейс поддерживает русский и английский языки через параметр `?lang=ru|en`. Сами материалы пока доступны только на русском языке. Английская версия интерфейса явно сообщает об этом и не выдаёт русские статьи за переведённые.

## Развёртывание

Workflow `.github/workflows/deploy.yml` проверяет pull request и развёртывает изменения из ветки `main` на GitHub Pages.
