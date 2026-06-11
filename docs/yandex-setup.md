# Настройка Яндекса для ps-invest.ru

## 1. DNS (Reg.ru) — до Вебмастера

| Запись | Значение |
|--------|----------|
| A `@` | IP вашего VPS |
| A `*` | тот же IP (поддомены городов и категорий) |
| A `www` | тот же IP |

Проверка: `nslookup donetsk.ps-invest.ru` должен вернуть IP сервера.

## 2. Яндекс.Вебмастер

1. [webmaster.yandex.ru](https://webmaster.yandex.ru) → **Добавить сайт** → `https://ps-invest.ru`
2. Подтверждение прав — **meta-тег**:
   - скопируйте код из Вебмастера (только значение `content`)
   - в `.env` на VPS: `PUBLIC_YANDEX_VERIFICATION=ваш_код`
   - перезапуск: `docker compose restart` или `systemctl restart profstal`
3. **Индексирование → Файлы Sitemap** → добавить:
   ```
   https://ps-invest.ru/sitemap-index.xml
   ```
4. **Настройки → Регион** → **Донецк** (или ближайший доступный)
5. **Настройки → Главное зеркало** → `https://ps-invest.ru` (без www)
6. Поддомены (`donetsk.ps-invest.ru` и др.) индексируются через sitemap — отдельно добавлять не обязательно

### Карты сайта

| URL | Содержимое |
|-----|------------|
| `/sitemap-index.xml` | **главный** — укажите в Вебмастере |
| `/sitemap-seo.xml` | статика, поддомены, город×категория (~170 URL) |
| `/sitemap-catalog.xml` | 195 товаров |
| `/sitemap-city-products.xml` | 1950 landing «город × товар» |
| `/sitemap-subdomains.xml` | поддомены городов и категорий |
| `/robots.txt` | динамический, ссылка на все sitemap |

## 3. Яндекс.Метрика

1. [metrika.yandex.ru](https://metrika.yandex.ru) → **Добавить счётчик**
2. Сайт: `https://ps-invest.ru`
3. Включить: **Вебвизор**, **Карта кликов**, **Аналитика форм**
4. Номер счётчика → `.env`:
   ```
   PUBLIC_YANDEX_METRIKA_ID=12345678
   ```
5. **Цели** (создать вручную в интерфейсе Метрики):

| ID цели | Тип | Когда срабатывает |
|---------|-----|-------------------|
| `phone_click` | JavaScript-событие | клик по телефону |
| `lead_submit` | JavaScript-событие | отправка заявки |
| `telegram_click` | JavaScript-событие | клик Telegram |
| `whatsapp_click` | JavaScript-событие | клик WhatsApp |
| `yandex_map_click` | JavaScript-событие | клик «Яндекс.Карты» |

Цели уже отправляются из кода (`data-goal` и событие `analytics-goal`).

## 4. Яндекс.Бизнес и Карты

1. [business.yandex.ru](https://business.yandex.ru) → карточка **Профсталь-инвест**
2. NAP = как на сайте (телефон, адрес, график из бота или `.env`)
3. Категория: металлопрокат / стройматериалы
4. Фото склада, отгрузки, прайс-лист
5. Ссылка на сайт: `https://ps-invest.ru`
6. В `.env`:
   ```
   PUBLIC_YANDEX_MAPS_URL=https://yandex.ru/maps/org/...
   ```
7. Карта на странице `/contacts/`:
   - [yandex.ru/map-constructor](https://yandex.ru/map-constructor/) → Поделиться → iframe
   - `PUBLIC_YANDEX_MAP_IFRAME=https://yandex.ru/map-widget/v1/...`

## 5. 2ГИС (дополнительно)

```
PUBLIC_2GIS_URL=https://2gis.ru/...
```

Попадает в schema `sameAs` на всех страницах.

## 6. Проверка после деплоя

```bash
curl -s https://ps-invest.ru/robots.txt
curl -s https://ps-invest.ru/sitemap-index.xml | head
curl -s https://ps-invest.ru/ | grep yandex-verification
curl -s https://ps-invest.ru/ | grep mc.yandex.ru
```

В Вебмастере: **Проверка ответа сервера** для главной и одного товара.
