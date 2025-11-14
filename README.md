# NoMissed — бот и мини-приложение для MAX

Репозиторий собирает полный стек «NoMissed»: текстового бота MAX, мини-приложения с интерфейсом и вспомогательного API со scrapping-сервисами. Проект можно использовать как демо-решение для хакатона или как основу собственного чат-бота с мини-приложением.

## Состав репозитория

| Путь              | Назначение                                                                                                           | Стек                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `backend/textbot` | Нативный бот на `@maxhub/max-bot-api`, который отдаёт стартовую кнопку мини-приложения и собирает `startapp` payload | Node.js 22, `@maxhub/max-bot-api`, `dotenv`         |
| `backend/api`     | Express API, которое проксирует расписание, новости, календарь и заявки вузов, а также хранит аккаунты и проекты в Firestore | Node.js 20+, Express 5, `node-fetch`, `firebase-admin` |
| `miniapp`         | React-приложение NoMissed с MAX UI: расписание, сервисы кампуса, новости, проекты, личный кабинет                    | React 18, `motion` (Framer), SCSS, `@maxhub/max-ui` |
| `Dockerfile`      | Сборка контейнера с текстовым ботом                                                                                  | Node 22 base image                                  |

## Возможности

- **Расписание** — поиск групп и преподавателей с подсказками, навигация по неделям, выделение текущей пары, кэширование по дням (`miniapp/src/hooks/useScheduleController.js`).
- **Сервисы кампуса** — карточки деканата, общежития, библиотеки и карьерных сценариев с встраиваемыми формами оплаты (`DeanOfficeService`, `ServicePaymentCard`) и календарём событий (`ActivitiesService` → `getCalendar`).
- **Новости** — подборка с фичерным блоком, кеш на час и отдельный экран с текстом новости (`NewsScreen` использует `getNews`/`getNewsContent`).
- **Проекты и активити** — клиентский каталог студенческих проектов, фильтры, карточки, модальные окна, локальное хранение данных (`components/projects`).
- **Личный кабинет** — регистрация и авторизация, валидации, безопасное хранение паролей через `scrypt`, синхронизация выбранного расписания и экран настроек с очисткой локального кэша (`AccountContext`, `accountsStore.js`).
- **Университеты** — сейчас подключены Финансовый университет и РГЭУ (парсеры в `backend/api/universities`), но архитектура позволяет добавить новый модуль.
- **MAX-интеграция** — бот может отправлять `startapp=<payload>` (см. `buildMiniAppLink`), мини-приложение подключает `https://st.max.ru/js/max-web-app.js` и использует MAX UI.

## Требования

- Node.js >= 20 и npm >= 10 для всех пакетов.
- Сервисный аккаунт Firebase (переменные `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
- Токен и username бота в MAX Business.
- Любой HTTPS-хостинг для мини-приложения (Vercel, GitHub Pages и т.д.).

## Быстрый старт

```bash
docker build -t max-bot .
docker run -d --name max-bot max-bot
```

Пример `.env`:

```dotenv
BOT_TOKEN=123456:ABCDEF
BOT_USERNAME=your_bot
```

- В `main.js` на команде `/start` бот отправляет inline-кнопку. Замените `https://max-hackathon.vercel.app` на URL вашего мини-приложения либо подставьте `buildMiniAppLink(ctx)`, чтобы использовать deep-link вида `https://max.ru/<bot>?startapp=<payload>` (payload уже собирается и укладывается в 512 байт).
- В репозитории есть `Dockerfile` — он собирает образ только с ботом (порт 4000 объявлен для совместимости с MAX, но бот работает через long polling).

## Поток данных

1. Пользователь вводит `/start` в боте. `backend/textbot/main.js` подготавливает payload (ID, фамилию, имя, таймштамп) и отправляет кнопку открытия мини-приложения.
2. Клиент MAX открывает страницу вашего мини-приложения. Оно поднимает контекст в `UniversityProvider` и `AccountProvider` и рендерит flow: приветствие → выбор вуза → основное меню.
3. При выборе расписания, новостей, сервисов и т.д. фронтенд обращается в `backend/api`:
   - `GET /api/:universityId/schedule/search` → подсказки групп и преподователей.
   - `GET /api/:universityId/schedule` → уроки на выбранный диапазон.
   - `GET /api/:universityId/news` и `/news/content` → лента и текст новостей.
   - `GET /api/:universityId/services/dean-office/bids` → ссылки на заявления.
   - `GET /api/:universityId/calendar` → события кампуса.
4. Формы регистрации и авторизации вызывают `POST /api/accounts/register` и `POST /api/accounts/login`. Пароли хэшируются через `scrypt`, в базе хранится `password_hash` и `password_salt`; публичный идентификатор (`public_id`) уходит в мини-приложение и кладётся в `localStorage`.
5. Miniapp кэширует часть данных локально:
   - аккаунт (`max-miniapp:account-id`);
   - профиль расписания (`max-miniapp:schedule-profile:<universityId>`);
   - проекты (`max-miniapp:projects`);
   - новости (ключи `news-<universityId>`).
6. Экран настроек (`SettingsScreen`) позволяет очистить сохранённые данные и сбросить выбранный вуз.

## Экранная логика мини-приложения

- **Start / University Flow** — анимационный экран приветствия `StartScreen` и выбор организации `ChooseUniversity`. Выбор сохраняется в `localStorage`.
- **Расписание (`ScheduleScreen`)**
  - Поиск профиля, быстрый выбор/редактирование, дебаунс 250 мс.
  - Недели и дни формируются в `buildWeekDays`, активная пара подсвечивается (сравнение timestamp'ов), для будущих отображается «через N минут/часов».
  - Результаты запроса кэшируются в памяти на ключ `profileId + week + day`.
- **Сервисы (`ServicesScreen`)**
  - Карточки с Motion-анимациями, в деталях отрисовываются кастомные компоненты (`DeanOfficeService`, `DormService`, `ActivitiesService`, `LibraryService`, `CareerService`).
  - Встроенный просмотр заявлений и форм оплаты через `<iframe>` внутри оверлея.
  - Календарь мероприятий с выбором диапазона дат и запросом `getCalendar`.
- **Новости (`NewsScreen`)**
  - Герой-карточка с бейджами, сохранение всей ленты в кэш на час.
  - При открытии новости загружается и распарсивается текст (`getNewsContent`), есть fallback и ручное обновление.
- **Проекты (`ProjectsScreen`)**
  - Каталог управляется целиком на клиенте: фильтры, поиск, разделение на «доступные» и «мои», карточки ролей, отклики, заглушки API (`projectApi.js`).
  - Все действия симулируются и синхронно обновляют `localStorage`.
- **Аккаунт (`AccountScreen`)**
  - Состояния: скелетон, формы логина/регистрации, карточка профиля.
  - Регистрация поддерживает выбор группы через расписание (используются события `max-miniapp:schedule-profile:update`).
  - Зарегистрированные данные отображаются в `AccountProfileCard`, есть кнопка «Настройки» → `SettingsScreen`.
- **Настройки (`SettingsScreen`)**
  - Очищает `localStorage` для профилей расписания и сбрасывает университет. Вся логика изолирована в одном экране.

## API-эндпоинты

| Метод  | Путь                                           | Описание                                                                                                                          |
| ------ | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/universities`                            | Список доступных вузов (id, название, домен)                                                                                      |
| `GET`  | `/api/:universityId/schedule/search?term=`     | Поиск профиля расписания                                                                                                          |
| `GET`  | `/api/:universityId/schedule`                  | Расписание: по `groupLabel` (РГЭУ) или `profileId/profileType` (ФинУ) + `start/end`                                               |
| `GET`  | `/api/:universityId/news`                      | Лента новостей (title, url, img)                                                                                                  |
| `GET`  | `/api/:universityId/news/content?url=`         | Текст новости (очищенный HTML)                                                                                                    |
| `GET`  | `/api/:universityId/calendar?from=&to=`        | Календарь событий (title/date/time/place)                                                                                         |
| `GET`  | `/api/:universityId/services/dean-office/bids` | Список заявлений/форм деканата                                                                                                    |
| `GET`  | `/api/:universityId/library?lang=`             | HTML-страница библиотеки (проксируется как есть)                                                                                  |
| `POST` | `/api/accounts/register`                       | Создание/обновление аккаунта. Требует `fullName`, `email`, `course`, `groupLabel`, `password`, `universityId`, `scheduleProfile?` |
| `POST` | `/api/accounts/login`                          | Авторизация по почте/паролю                                                                                                       |
| `GET`  | `/api/accounts/:id`                            | Получение аккаунта по публичному идентификатору                                                                                   |

Файлы, отвечающие за загрузку данных конкретного университета: `backend/api/universities/financialUniversity.js` и `rgeuUniversity.js`. Чтобы добавить новый вуз, создайте аналогичный модуль и зарегистрируйте его в `universities/index.js`.

## Хранение данных и конфигурация

- SQLite база лежит в `backend/api/storage/data`. При миграциях колонок (`password_hash`, `password_salt`) обновление выполняется автоматически (`ensureSchema`).
- Мини-приложение хранит пользовательские настройки в `localStorage`. Ключи начинаются с `max-miniapp:*`.
- В `miniapp/src/config/universities.js` лежат карточки вузов (название, домен, бренд-цвет, логотип, кастомные сервисы). Здесь же можно настраивать кнопки оплаты деканата.
- Стили лежат в SCSS-модулях (`src/styles`), основной файл — `main.scss`.
