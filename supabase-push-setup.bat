@echo off
REM ===================================================
REM Скрипт быстрой настройки Push-уведомлений (Windows)
REM ===================================================
REM
REM Использование:
REM 1. Установите Supabase CLI: npm install -g supabase
REM 2. Замените YOUR_PROJECT_REF на ваш Project Reference ID
REM 3. Запустите: supabase-push-setup.bat
REM

echo.
echo 🚀 Настройка Push-уведомлений для Looking App
echo.

REM Проверка Supabase CLI
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI не установлен!
    echo Установите: npm install -g supabase
    pause
    exit /b 1
)

echo ✅ Supabase CLI найден
echo.

REM Вход
echo 📝 Вход в Supabase...
call supabase login

REM Связывание проекта
echo.
echo 🔗 Связывание с проектом...
echo ⚠️  ВАЖНО: Замените YOUR_PROJECT_REF на ваш Project Reference ID
echo     Найдите его в Supabase Dashboard → Settings → General
echo.
set /p PROJECT_REF="Введите Project Reference ID: "

call supabase link --project-ref %PROJECT_REF%

REM Установка секретов
echo.
echo 🔑 Установка VAPID ключей...

call supabase secrets set VAPID_PUBLIC_KEY=BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg

call supabase secrets set VAPID_PRIVATE_KEY=wcjHrruKLGIDv7fgyvPwDgEW-P1UxTPBv238sNaikCk

call supabase secrets set VAPID_EMAIL=mailto:admin@looking-app.com

echo ✅ VAPID ключи установлены

REM Деплой функции
echo.
echo 🚀 Деплой Edge Function...
call supabase functions deploy send-push-notification

echo.
echo ✅ Edge Function задеплоена!

REM Финальные инструкции
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🎉 Установка завершена!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📋 Осталось выполнить вручную:
echo.
echo 1️⃣  Откройте Supabase Dashboard → SQL Editor
echo.
echo 2️⃣  Выполните миграцию таблицы:
echo     📄 docs/PUSH_SUBSCRIPTIONS_MIGRATION.sql
echo.
echo 3️⃣  Выполните миграцию триггера:
echo     📄 docs/PUSH_TRIGGER_MIGRATION.sql
echo.
echo     ⚠️  ВАЖНО: В триггере замените на ваши значения:
echo     - Supabase URL
echo     - Service Role Key (найдите в Settings → API)
echo.
echo 4️⃣  Протестируйте отправку в Dashboard → Edge Functions
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 📚 Документация:
echo    - Быстрый старт: docs/PUSH_QUICK_SETUP.md
echo    - Подробно: docs/PUSH_DEPLOYMENT_GUIDE.md
echo    - Резюме: PUSH_SETUP_SUMMARY.md
echo.
echo 🆘 Нужна помощь? Смотрите раздел Troubleshooting
echo.

pause

