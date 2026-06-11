# Внешнее SEO — чеклист после деплоя ps-invest.ru

**Полные инструкции:**
- [yandex-setup.md](./yandex-setup.md) — Яндекс (Вебмастер, Метрика, Карты, Бизнес)
- [deploy-vps-regru.md](./deploy-vps-regru.md) — VPS Reg.ru, Docker, nginx, SSL

## Быстрый чеклист

1. DNS: A `@`, A `*`, A `www` → IP VPS
2. `.env` на сервере: `PUBLIC_YANDEX_METRIKA_ID`, `PUBLIC_YANDEX_VERIFICATION`, контакты
3. Вебмастер: sitemap `https://ps-invest.ru/sitemap-index.xml`, регион Донецк
4. Метрика: цели `phone_click`, `lead_submit`, `telegram_click`, `whatsapp_click`
5. Яндекс.Бизнес + Карты + 2GIS
6. Проверка: `/robots.txt`, поддомен `donetsk.ps-invest.ru`, бот `/start`
