# Публикация FIT Track

Схема: Vercel (React) → /api rewrite → отдельный Node API → PostgreSQL.
Браузер обращается только к /api своего домена. Refresh-cookie: HttpOnly,
Secure в production, SameSite=Strict. VITE_API_URL больше не используется.
Основа: https://vercel.com/docs/routing/rewrites

## Порядок

1. Создать приватный GitHub-репозиторий. Проверить список перед push:
   .env, дампы, generated, node_modules, dist и ключи не должны попасть в Git.
   Оба package-lock.json коммитить. В текущей папке Git ещё не инициализирован.
2. Создать отдельную production-базу PostgreSQL. Не переносить тестовые аккаунты
   и личные данные без необходимости. Настроить TLS, backup/restore и минимальные
   права пользователя приложения; миграции запускать отдельными учётными данными.
3. API: Node 24; Root Directory = server; Build:
   npm ci && npm run prisma:generate && npm run build.
   Start: npm start. PORT задаёт хостинг.
   Альтернатива — Dockerfile с build context server (локально Docker не проверялся).
4. API env: NODE_ENV=production, DATABASE_URL,
   FRONTEND_ORIGINS=https://ваш-сайт.vercel.app, ACCESS_TOKEN_SECRET,
   REFRESH_TOKEN_SECRET. Секреты разные, случайные, минимум 32 символа.
   Генерация каждого: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))".
   Сохранять только в секретах хостинга. Не использовать .env.example дословно.
5. TRUST_PROXY_HOPS по умолчанию 0. До настройки проверить реальную цепочку прокси,
   включая прямой доступ к API: X-Forwarded-For не должен позволять подделывать IP.
   Не ставить trust proxy=true. Проверить, что разные посетители не делят один лимит.
   До масштабирования на несколько экземпляров нужен общий store лимитера, например Redis.
6. В release-окружении (с dev-зависимостями) выполнить npm run prisma:deploy,
   затем npm run seed. Seed создаёт только группы мышц, не удаляет данные.
   Prisma CLI отсутствует в runtime-контейнере: не запускать миграции при каждом старте.
   Для существующей базы сначала сделать и проверить резервную копию.
7. В client/vercel.json заменить REPLACE-WITH-YOUR-API-HOST.invalid на HTTPS API-хост,
   сохранив /api/:path*. До замены prebuild блокирует публикацию Vercel.
8. Vercel: Root Directory = client, Node = 24, Framework = Vite,
   Build = npm run build, Output = dist. Секретов в клиенте быть не должно.
9. FRONTEND_ORIGINS: точные HTTPS origins без завершающего слэша, через запятую.
   Не разрешать *.vercel.app. Preview должен использовать отдельные API/БД/секреты.

## Проверка на опубликованном сайте

- /healthz: процесс работает; /readyz: есть соединение с БД.
- /diary и /profile открываются напрямую; /api/* возвращает JSON, не index.html.
- Регистрация → письмо → подтверждение → вход, повторная отправка, сброс пароля и отзыв сеансов.
- Обновление страницы, выход, свойства Secure/HttpOnly/Strict cookie.
- Упражнение, подходы, категории, вес/цель сохраняются; чужой аккаунт их не видит.
- API имеет Cache-Control: no-store; запрос с чужим Origin получает 403.
- Проверить лимитер через реальную цепочку Vercel → API-хостинг.
- Проверить телефон, клавиатуру, модальные окна, ошибки и повторную загрузку.
- Включить мониторинг, ограничить доступ к логам, настроить backup/restore.

## Обновления

CI в .github/workflows/ci.yml: сборки, тесты, lint, npm audit.
На GitHub workflow ещё не выполнялся, репозиторий не опубликован.
Откат — предыдущий deployment и совместимый сервер. Базу не сбрасывать через reset.
Обновления схемы применять только с планом восстановления.

## Перед открытой регистрацией

Подтверждение email и восстановление пароля сохранены, но временно отключены.
По умолчанию EMAIL_AUTH_ENABLED=false и VITE_EMAIL_AUTH_ENABLED=false: SMTP не требуется,
регистрация сразу открывает дневник. Для включения почты следовать EMAIL-SETUP.md.
Удаления аккаунта через интерфейс пока нет. Подготовить правила работы с персональными данными.
Для закрытого тестового запуска можно ограничить аудиторию.
Сессия фиксирована на 3 дня; logout отзывает оба токена, но refresh не ротируется.
Старого пользователя из прежнего seed не переносить в production.
