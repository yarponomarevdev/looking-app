/**
 * Supabase Edge Function для отправки Web Push уведомлений
 * 
 * Использование:
 * POST /functions/v1/send-push-notification
 * Body: { userId, title, message, type, url }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.6'

// Константы окружения
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

// VAPID email должен быть в формате mailto:email@example.com
const vapidEmailRaw = Deno.env.get('VAPID_EMAIL') || 'admin@example.com'
const vapidEmail = vapidEmailRaw.startsWith('mailto:') 
  ? vapidEmailRaw 
  : `mailto:${vapidEmailRaw}`

// Инициализация Supabase клиента с service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Настройка VAPID для Web Push
webpush.setVapidDetails(
  vapidEmail,
  vapidPublicKey,
  vapidPrivateKey
)

interface PushNotificationRequest {
  userId: string
  title: string
  message: string
  type?: string
  url?: string
}

interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Обработка preflight запросов
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Парсим тело запроса
    const { userId, title, message, type, url }: PushNotificationRequest = await req.json()

    // Валидация
    if (!userId || !title || !message) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: userId, title, message' 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Sending push notification to user: ${userId}`)

    // Получаем все активные подписки пользователя
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError)
      throw fetchError
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user: ${userId}`)
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'No push subscriptions found for this user',
          sent: 0,
        }), 
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Found ${subscriptions.length} subscription(s) for user`)

    // Формируем payload для уведомления
    const payload = JSON.stringify({
      title,
      message,
      body: message, // Дублируем для совместимости
      type: type || 'notification',
      url: url || '/',
      timestamp: new Date().toISOString(),
    })

    // Отправляем уведомление на все устройства пользователя
    const results = await Promise.all(
      subscriptions.map(async (sub: PushSubscription) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          }

          // Отправляем push-уведомление
          await webpush.sendNotification(pushSubscription, payload)
          
          console.log(`✅ Successfully sent to endpoint: ${sub.endpoint.substring(0, 50)}...`)
          
          return { 
            success: true, 
            subscriptionId: sub.id,
            endpoint: sub.endpoint.substring(0, 50) + '...',
          }
        } catch (error: any) {
          console.error(`❌ Error sending to endpoint ${sub.endpoint.substring(0, 50)}:`, error.message)
          
          // Если подписка недействительна (410 Gone, 404 Not Found, или 403 Forbidden), удаляем её
          // 403 Forbidden обычно означает неверные VAPID ключи или недействительный endpoint
          if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 403) {
            console.log(`Removing invalid subscription: ${sub.id} (status: ${error.statusCode})`)
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id)
          }
          
          return { 
            success: false, 
            subscriptionId: sub.id,
            error: error.message,
            statusCode: error.statusCode,
          }
        }
      })
    )

    // Подсчет успешных отправок
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`Notification delivery: ${successCount} succeeded, ${failureCount} failed`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Push notification sent to ${successCount} device(s)`,
        sent: successCount,
        failed: failureCount,
        results,
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('Error in send-push-notification function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

