# Профсталь-инвест

Сайт на Astro: каталог металлопроката и стройматериалов, региональное SEO, список заявки и отправка лидов в Telegram.

## Запуск

```powershell
npm install
npm run migrate
npm run dev
```

Открыть: `http://127.0.0.1:4321/`

## Сборка

```powershell
npm run build
npm run preview
```

Для продакшена с API заявок:

```powershell
node ./dist/server/entry.mjs
```

## Telegram-бот (только админы)

Один бот, одна роль — **администратор**. `TELEGRAM_CHAT_ID` не нужен.

1. Токен от [@BotFather](https://t.me/BotFather) → в `.env`:

```
TELEGRAM_BOT_TOKEN=...
```

2. Каждый админ пишет боту `/start` — подключается к уведомлениям.

3. Проверка связи с Telegram (важно для ДНР/РФ):

```powershell
npm run telegram:check
```

Если «нет связи» — включите **VPN на ПК** или добавьте в `.env` прокси VPN-клиента:

```
TELEGRAM_PROXY=socks5://127.0.0.1:1080
```

4. Локально — **держите запущенным** (иначе бот не отвечает):

```powershell
npm run telegram:poll
```

В другом окне: `npm run dev`. Напишите боту `/start`.

5. Проверка отправки:

```powershell
npm run telegram:test
```

Заявки с сайта приходят **всем админам**, кто нажал `/start`. Клиентам бот не нужен — они оставляют заявку на сайте.

## Переменные окружения

- `TELEGRAM_BOT_TOKEN` — бот для заявок админам
- `CRM_WEBHOOK_URL` — опционально, webhook amoCRM/Bitrix24
- `PUBLIC_YANDEX_METRIKA_ID` — счётчик Яндекс.Метрики
- `PUBLIC_SITE_PHONE`, `PUBLIC_SITE_EMAIL` — контакты на сайте

## Админка каталога

URL: `/admin/` (скрыта от поисковиков)

В `.env` задайте `ADMIN_PASSWORD`.

Возможности:
- добавить товар (фото, название, описание, цена, наличие) — артикул `МТЛ-20XXX` присваивается автоматически;
- найти товар по артикулу или названию;
- изменить или удалить товар;
- фото сохраняется в `public/assets/catalog-images/`.

Изменения сразу видны в каталоге на сайте.

## Структура

- `src/pages/` — страницы (главная, каталог, города, контакты)
- `src/data/` — каталог, категории, города (генерируется `npm run migrate`)
- `src/components/` — UI и React-острова (фильтры, заявка, список)
- `src/pages/api/lead.ts` — API отправки заявок
- `public/assets/` — логотип и фото товаров
- `data/catalog.json` — исходный каталог для миграции

## Маршруты

| URL | Описание |
|-----|----------|
| `/` | Главная |
| `/catalog/` | Каталог с фильтрами |
| `/catalog/{category}/` | Категория |
| `/catalog/{category}/{product}/` | Товар |
| `/cities/{slug}/` | Городская посадочная |
| `/delivery/`, `/about/`, `/contacts/` | Сервисные страницы |
