#!/bin/bash

# ===================================================
# Скрипт быстрой настройки Push-уведомлений
# ===================================================
#
# Использование:
# 1. Установите Supabase CLI: npm install -g supabase
# 2. Замените YOUR_PROJECT_REF на ваш Project Reference ID
# 3. Запустите: bash supabase-push-setup.sh
#

set -e

echo "🚀 Настройка Push-уведомлений для Looking App"
echo ""

# Проверка Supabase CLI
if ! command -v supabase &> /dev/null
then
    echo "❌ Supabase CLI не установлен!"
    echo "Установите: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI найден"
echo ""

# Вход (если еще не залогинены)
echo "📝 Вход в Supabase..."
supabase login

# Связывание проекта
echo ""
echo "🔗 Связывание с проектом..."
echo "⚠️  ВАЖНО: Замените YOUR_PROJECT_REF на ваш Project Reference ID"
echo "    Найдите его в Supabase Dashboard → Settings → General"
echo ""
read -p "Введите Project Reference ID: " PROJECT_REF

supabase link --project-ref "$PROJECT_REF"

# Установка секретов
echo ""
echo "🔑 Установка VAPID ключей..."

supabase secrets set VAPID_PUBLIC_KEY=BPczBqcwpi3u7Wfpn7dYiHkfOXHaI6uletj_N7HwCJ0hy0OFYl4_MuU48NuKNboJHN3f1o98X88bUOz-V3LCWqg

supabase secrets set VAPID_PRIVATE_KEY=wcjHrruKLGIDv7fgyvPwDgEW-P1UxTPBv238sNaikCk

supabase secrets set VAPID_EMAIL=mailto:admin@looking-app.com

echo "✅ VAPID ключи установлены"

# Деплой функции
echo ""
echo "🚀 Деплой Edge Function..."
supabase functions deploy send-push-notification

echo ""
echo "✅ Edge Function задеплоена!"

# Финальные инструкции
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Установка завершена!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Осталось выполнить вручную:"
echo ""
echo "1️⃣  Откройте Supabase Dashboard → SQL Editor"
echo ""
echo "2️⃣  Выполните миграцию таблицы:"
echo "    📄 docs/PUSH_SUBSCRIPTIONS_MIGRATION.sql"
echo ""
echo "3️⃣  Выполните миграцию триггера:"
echo "    📄 docs/PUSH_TRIGGER_MIGRATION.sql"
echo ""
echo "    ⚠️  ВАЖНО: В триггере замените на ваши значения:"
echo "    - Supabase URL"
echo "    - Service Role Key (найдите в Settings → API)"
echo ""
echo "4️⃣  Протестируйте отправку в Dashboard → Edge Functions"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Документация:"
echo "   - Быстрый старт: docs/PUSH_QUICK_SETUP.md"
echo "   - Подробно: docs/PUSH_DEPLOYMENT_GUIDE.md"
echo "   - Резюме: PUSH_SETUP_SUMMARY.md"
echo ""
echo "🆘 Нужна помощь? Смотрите раздел Troubleshooting"
echo ""

