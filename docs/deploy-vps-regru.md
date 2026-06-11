# Деплой на VPS Reg.ru

Сайт: Astro SSR + Telegram-бот (long polling). Nginx — reverse proxy + SSL.

## Требования к VPS

- Ubuntu 22.04 / 24.04 (рекомендуется)
- 1 GB RAM минимум, 2 GB комфортно
- Открыты порты 80, 443
- Домен `ps-invest.ru` в Reg.ru

## 1. DNS в Reg.ru

Панель домена → DNS-серверы и ресурсные записи:

| Тип | Имя | Значение |
|-----|-----|----------|
| A | @ | IP VPS |
| A | * | IP VPS |
| A | www | IP VPS |

## 2. Подготовка сервера

```bash
ssh root@ВАШ_IP

apt update && apt upgrade -y
apt install -y git nginx certbot python3-certbot-nginx docker.io docker-compose-plugin

systemctl enable docker nginx
```

## 3. Клонирование проекта

```bash
mkdir -p /var/www/profstal
cd /var/www/profstal
git clone https://github.com/rinat3636/metalstroy.git .
```

## 4. Переменные окружения

```bash
cp .env.example .env
nano .env
```

Обязательно заполните (см. [yandex-setup.md](./yandex-setup.md)):

```
PUBLIC_SITE_URL=https://ps-invest.ru
PUBLIC_SITE_DOMAIN=ps-invest.ru
TELEGRAM_BOT_TOKEN=...
ADMIN_PASSWORD=...
PUBLIC_YANDEX_METRIKA_ID=...
PUBLIC_YANDEX_VERIFICATION=...
PUBLIC_SITE_PHONE=...
```

## 5. Запуск через Docker (рекомендуется)

```bash
cd /var/www/profstal
docker compose up -d --build
docker compose logs -f app
```

Volumes сохраняют:
- `/app/data` — админы бота, контакты, catalog.json
- `/app/src/data` — products.json, categories.json
- `/app/public/assets/catalog-images` — фото товаров

## 6. Nginx + SSL

```bash
cp deploy/nginx/ps-invest.ru.conf /etc/nginx/sites-available/ps-invest.ru
ln -sf /etc/nginx/sites-available/ps-invest.ru /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
```

Сертификат для apex + www:

```bash
certbot --nginx -d ps-invest.ru -d www.ps-invest.ru
```

**Wildcard** для поддоменов (`donetsk.ps-invest.ru`):

```bash
certbot certonly --manual --preferred-challenges dns \
  -d ps-invest.ru -d '*.ps-invest.ru'
```

Certbot покажет TXT-запись — добавьте в Reg.ru (`_acme-challenge`), затем обновите пути к сертификату в nginx-конфиге.

```bash
systemctl reload nginx
```

## 7. Проверка

```bash
curl -I https://ps-invest.ru/
curl https://ps-invest.ru/api/telegram/status
curl https://ps-invest.ru/sitemap-index.xml
```

Логи бота:

```bash
docker compose logs app | grep telegram
# Ожидается: [telegram] Long polling — @proffinvest23_bot
```

## 8. Обновление сайта

```bash
cd /var/www/profstal
git pull
docker compose up -d --build
```

## 9. Альтернатива: без Docker

```bash
apt install -y nodejs npm
cd /var/www/profstal
npm ci
npm run migrate && npm run build
cp deploy/systemd/profstal.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now profstal
```

## 10. Бэкап

```bash
tar czf backup-$(date +%F).tar.gz data/ src/data/ public/assets/catalog-images/
```

## 11. Telegram на VPS

На сервере Reg.ru (РФ) `api.telegram.org` обычно доступен — VPN не нужен.

Режим `TELEGRAM_MODE=poll` — бот стартует автоматически с `npm start`.

## 12. Яндекс после деплоя

Чеклист: [yandex-setup.md](./yandex-setup.md)
