# MaxHackathon
Проект хакатон: мини-приложение и чат-бот.  

## Описание
Этот проект создан для хакатона и включает:
- Backend: чат-бот (`/backend/textbot`)
- Frontend: мини-приложение (`/miniapp`)
- Контейнеризацию через Docker

Проект позволяет запускать мини-приложение и взаимодействовать с чат-ботом.

## Структура директории
- /backend/textbot/ — код чат-бота
- /miniapp/ — мини-приложение (frontend)
- Dockerfile — контейнеризация проекта
- .gitignore — файлы и папки, игнорируемые Git

## Технологии
- JavaScript / HTML
- Node.js (если требуется)
- Docker

## Быстрый старт
1. Клонируйте репозиторий:
```bash
git clone https://github.com/nezqt3/MaxHackathon.git
cd MaxHackathon
```

2. Соберите Docker-образ
```bash
docker build -t maxhackathon .
```

3. Запустите контейнер
```bash
docker run -p 3000:3000 maxhackathon
```

4. Запустите фронтенд мини-приложения
```bash
cd miniapp
npm install
npm start
```
