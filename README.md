# Профсталь-инвест

Сайт на Astro: каталог металлопроката и стройматериалов, региональное SEO, список заявки и отправка лидов в Telegram.

## Репозиторий

Код: [rinat3636/metalstroy](https://github.com/rinat3636/metalstroy)

Загрузка в GitHub:

```powershell
$env:GITHUB_TOKEN = "ваш_токен"
.\scripts\push-metalstroy.ps1
```

## Деплой на Railway

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → `metalstroy`
2. **Variables** (Settings → Variables):

```
TELEGRAM_BOT_TOKEN=...
ADMIN_PASSWORD=...
PUBLIC_SITE_URL=https://ps-invest.ru
PUBLIC_SITE_DOMAIN=ps-invest.ru
PUBLIC_SITE_PHONE=+7...
PUBLIC_SITE_EMAIL=sales@...
```

3. **Settings** → **Networking** — привязать домен `ps-invest.ru` или временный `*.railway.app`
4. После деплоя бот **запускается сам** (long polling на сервере). Webhook вручную не нужен.
5. Любой пишет боту `/start` — становится админом, заявки с сайта приходят в Telegram.

Опционально `TELEGRAM_MODE=webhook` + `npm run telegram:webhook:set -- https://ваш-домен.railway.app`

> **Volumes на Railway** (чтобы правки админки не пропадали при redeploy):
> - `/app/data` — `telegram-admins.json`, `catalog.json`
> - `/app/src/data` — `products.json`, `categories.json`
> - `/app/public/assets/catalog-images` — загруженные фото товаров

## Домен ps-invest.ru и поддомены

Основной сайт: **https://ps-invest.ru**

Поддомены (города ДНР и категории каталога) открывают те же страницы, что и пути `/cities/…` и `/catalog/…`:

| Поддомен | Страница |
|----------|----------|
| `donetsk.ps-invest.ru` | Металлопрокат в Донецке |
| `makeevka.ps-invest.ru` | Макеевка |
| `sortovoy-prokat.ps-invest.ru` | Категория «Сортовой прокат» |
| `truba-profilnaya.ps-invest.ru` | «Труба профильная» |
| … | все города из `/cities/` и категории из каталога |

### DNS в Reg.ru

1. **A-запись** `@` → IP сервера (Railway или Reg.ru VPS)
2. **A-запись** `*` (wildcard) → тот же IP — все поддомены на один сайт
3. **A-запись** `www` → тот же IP (опционально)

Карта сайта для поисковиков: `/sitemap-seo.xml`

Чеклист внешнего SEO (Яндекс, Google, 2GIS): [docs/seo-external-checklist.md](docs/seo-external-checklist.md)

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

## Telegram-бот (открытый доступ)

`TELEGRAM_CHAT_ID` не нужен. **Любой**, кто запускает бота (`/start` или любое сообщение), получает уведомления о заявках.

1. Токен от [@BotFather](https://t.me/BotFather) → в `.env` / Railway Variables:

```
TELEGRAM_BOT_TOKEN=...
```

2. На Railway бот отвечает сам после деплоя. Локально — `npm run telegram:poll`.

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
