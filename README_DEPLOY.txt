1. Разместите папку miniapp на HTTPS-хостинге: Netlify, Vercel, GitHub Pages или свой домен.
2. Возьмите публичный URL вида https://your-domain.example/miniapp/
3. Вставьте его в .env:
   MINI_APP_URL=https://your-domain.example/miniapp/
4. Перезапустите бота.
5. При желании настройте у BotFather menu button / main mini app.


ВАЖНО ПО MINI APP
1. Если на странице показывается текст про browser mode / объект Telegram WebApp не найден, значит страница открыта не как Mini App-вебвью, а как обычный браузер.
2. Для запуска используйте private chat с ботом и inline-кнопку web_app или кнопку меню бота.
3. Проверьте в BotFather Main Mini App / Menu Button URL — он должен совпадать с MINI_APP_URL.
4. На некоторых клиентах нижняя reply-кнопка может отрабатывать менее надежно, чем inline-кнопка или menu button.
