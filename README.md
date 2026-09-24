# Setly

React 19 + Vite, Express 5, PostgreSQL, Prisma 7.10. Node.js 24.
Сайт: главная и автодемонстрация, личный дневник, профиль с весом и целью.

## Локальный запуск

1. server/.env заполнить по server/.env.example (свои случайные секреты).
2. В server: npm ci, npm run prisma:generate, npm run prisma:deploy, npm run seed,
   затем npm run dev.
3. В client: npm ci, npm run dev.
4. Открыть http://127.0.0.1:5173. API вызывается через /api Vite proxy.
   VITE_API_URL больше не используется.

Seed создаёт общие группы мышц, не создаёт тестовых пользователей.
Перед миграцией существующей базы сделать backup.
Локальный backup-скрипт: node server/scripts/migrate-safe.cjs (из каталога server:
node scripts/migrate-safe.cjs); требует pg_dump, путь задаётся PG_DUMP.
Скрипт ориентирован на локальный PostgreSQL/Windows. Для облачной базы использовать
backup провайдера и проверенное восстановление.

## Проверки

В client: npm run lint, npm test, npm run build.
В server: npm run prisma:generate, npm run build, npm test.
Серверные тесты создают случайную схему fittrack_test_* и удаляют только её.
Нужен PostgreSQL с правом создания схем. Рабочие записи не используются.
Онлайн-аудит: npm audit в каждом каталоге. GitHub CI запускает те же проверки.

## Публикация

Для VPS: workflow **Build VPS bundle** собирает готовые Docker-образы вне сервера.
Порядок установки и обновлений описан в [deploy/README.md](deploy/README.md).
`compose.yaml` запускает PostgreSQL, API и Caddy с HTTPS на одном домене.
Секреты генерируются на VPS и не входят в GitHub или архив сборки.

Альтернативная конфигурация Vercel сохранена отдельно. В `client/vercel.json`
пока адрес-заглушка API: для Vercel его нужно заменить; на запуск VPS это не влияет.

## Данные

Даты тренировок — YYYY-MM-DD / PostgreSQL DATE, без пересчёта в часовой пояс сервера.
Миграция 20260919000100 сохраняет московские дни прежних записей 21:00 UTC
и нормализованные 00:00 UTC; на других значениях останавливается.
Access-токен живёт 15 минут, сессия — 3 дня. Logout отзывает сессию.
Токены доступа не сохраняются в localStorage; после обновления используются refresh-cookie.
Подходы сохраняются по Enter или потере фокуса, запросы одного подхода сериализованы.
Демонстрация на главной хранится только в памяти и не пишет в API.
