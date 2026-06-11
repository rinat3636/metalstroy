# Внешнее SEO — чеклист после деплоя ps-invest.ru

Выполните вручную после того, как сайт доступен по домену и DNS wildcard настроен.

## 1. Яндекс.Вебмастер

1. [webmaster.yandex.ru](https://webmaster.yandex.ru) → добавить сайт `https://ps-invest.ru`
2. Подтвердить права (meta-тег или DNS)
3. Загрузить sitemap: `https://ps-invest.ru/sitemap-seo.xml`
4. Настроить регион: **Донецк / ДНР**
5. Проверить индексацию поддоменов (donetsk.ps-invest.ru и др.) — они в sitemap-seo.xml
6. Дополнительно: `sitemap-city-products.xml` — 1950 landing «город × товар»

## 2. Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console) → добавить ресурс `https://ps-invest.ru`
2. Подтвердить владение
3. Sitemap → `https://ps-invest.ru/sitemap-seo.xml`

## 3. Яндекс.Метрика

1. Создать счётчик на [metrika.yandex.ru](https://metrika.yandex.ru)
2. В Railway Variables: `PUBLIC_YANDEX_METRIKA_ID=XXXXXXXX`
3. Настроить цели:
   - `phone_click` — клик по телефону
   - `lead_submit` — отправка заявки (если добавите data-goal на форму)

## 4. Яндекс.Бизнес и карты

1. [business.yandex.ru](https://business.yandex.ru) — карточка организации
2. NAP должен совпадать с сайтом: название, телефон, адрес, график
3. Добавить фото склада и отгрузки
4. Яндекс.Карты — метка склада; URL в `PUBLIC_YANDEX_MAPS_URL`

## 5. 2GIS

1. [2gis.ru](https://2gis.ru) → добавить компанию в справочник
2. Категория: металлопрокат / стройматериалы
3. URL карточки → `PUBLIC_2GIS_URL` (для schema sameAs)

## 6. Переменные окружения (Railway)

```
PUBLIC_SITE_URL=https://ps-invest.ru
PUBLIC_SITE_DOMAIN=ps-invest.ru
PUBLIC_SITE_PHONE=+7...
PUBLIC_SITE_EMAIL=sales@ps-invest.ru
PUBLIC_SITE_ADDRESS=г. Донецк, ...
PUBLIC_SITE_GEO_LAT=48.0159
PUBLIC_SITE_GEO_LNG=37.8028
PUBLIC_YANDEX_METRIKA_ID=...
PUBLIC_YANDEX_MAPS_URL=https://yandex.ru/maps/...
PUBLIC_2GIS_URL=https://2gis.ru/...
```

## 7. DNS (Reg.ru)

| Запись | Значение |
|--------|----------|
| A `@` | IP сервера (Railway / VPS) |
| A `*` | тот же IP (wildcard для поддоменов) |
| A `www` | тот же IP (редирект www → apex в middleware) |

## 8. Мониторинг (еженедельно)

- Вебмастер: ошибки индексации, дубли title/description
- Метрика: органический трафик по landing pages
- [validator.schema.org](https://validator.schema.org) — проверка разметки главной и карточки товара

## 9. Отраслевые каталоги (опционально)

- Пром.ру, Allbiz, региональные справочники ДНР
- Ссылка только на `https://ps-invest.ru` (основной домен)
