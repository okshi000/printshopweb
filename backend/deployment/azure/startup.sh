#!/bin/bash

echo "🚀 Starting deployment setup..."

# 1. الانتقال لمجلد الباك اند
cd /home/site/wwwroot/backend

# 2. تثبيت المكتبات (إذا لم تكن موجودة)
if [ ! -d "vendor" ]; then
    echo "📦 Vendor folder not found. Installing dependencies..."
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

# 3. تعديل إعدادات Apache لتشير إلى backend/public
echo "🔧 Configuring Apache DocumentRoot..."
sed -i "s|/var/www/html|/home/site/wwwroot/backend/public|g" /etc/apache2/sites-available/000-default.conf
sed -i "s|AllowOverride None|AllowOverride All|g" /etc/apache2/apache2.conf

# 4. إصلاح صلاحيات مجلد التخزين
echo "🔒 Fixing permissions..."
chown -R www-data:www-data /home/site/wwwroot/backend/storage
chmod -R 775 /home/site/wwwroot/backend/storage

# 5. تشغيل أوامر لارافل
echo "⚙️ Running Laravel commands..."
php artisan config:clear
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "✅ Setup complete. Starting Server..."

# 6. تشغيل السيرفر
apache2-foreground
