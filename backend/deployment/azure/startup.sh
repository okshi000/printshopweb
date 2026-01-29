#!/bin/bash

# التعامل مع الأخطاء - إيقاف السكربت عند حدوث أي خطأ
set -e

echo "🚀 Starting deployment script..."

# نسخ ملف index.html الخاص بالرياكت إلى مجلد الـ public في لارافل (في حالة الدمج)
# cp /home/site/wwwroot/public/dist/index.html /home/site/wwwroot/public/index.html || true

# تشغيل الأوامر الأساسية لتهيئة لارافل
echo "Caching configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Running migrations..."
php artisan migrate --force

echo "Deployment finished successfully."

# تشغيل السيرفر (Apache) في النهاية
# apache2-foreground
