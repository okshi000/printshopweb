# 📚 وثائق السيرفر - Print Shop System

## 📋 جدول المحتويات
- [معلومات السيرفر](#معلومات-السيرفر)
- [الوصول للسيرفر](#الوصول-للسيرفر)
- [بنية المشروع](#بنية-المشروع)
- [البيئة التقنية](#البيئة-التقنية)
- [فحص المشاكل](#فحص-المشاكل)
- [حل المشاكل](#حل-المشاكل)
- [رفع التحديثات](#رفع-التحديثات)
- [أوامر مهمة](#أوامر-مهمة)
- [النسخ الاحتياطي](#النسخ-الاحتياطي)

---

## 🖥️ معلومات السيرفر

### VPS Details
| البيان | القيمة |
|--------|--------|
| **المزود** | Libyan Spider |
| **الخطة** | Linux VPS+ Opiliones+ Native |
| **IP Address** | `102.203.200.213` |
| **نظام التشغيل** | Ubuntu 22.04.5 LTS |
| **CPU** | 2 vCPU |
| **RAM** | 2 GB |
| **Storage** | 40 GB SSD NVMe |
| **Bandwidth** | 20 TB/شهر |

### معلومات الوصول
```
SSH Username: root
SSH Password: [محفوظ في بريدك من Libyan Spider]
SSH Port: 22
```

### معلومات قاعدة البيانات
```
Database Name: printshop
Database User: printshop
Database Password: A1213232a
Database Host: 127.0.0.1
Database Port: 3306
```

### URLs
- **الموقع:** http://102.203.200.213
- **API:** http://102.203.200.213/api
- **GitHub Repo:** https://github.com/okshi000/printshopweb

---

## 🔐 الوصول للسيرفر

### من Windows PowerShell:
```powershell
ssh root@102.203.200.213
```

### من Linux/Mac Terminal:
```bash
ssh root@102.203.200.213
```

**ملاحظة:** ستُطلب كلمة المرور في كل مرة.

---

## 📁 بنية المشروع

### على السيرفر:
```
/var/www/printshop/
├── backend/                    # Laravel API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   └── Models/
│   ├── database/
│   │   └── migrations/
│   ├── routes/
│   │   └── api.php
│   ├── storage/
│   │   └── logs/
│   │       └── laravel.log     # سجل الأخطاء
│   ├── .env                    # إعدادات Laravel
│   ├── composer.json
│   └── public/
│       └── index.php
│
├── frontend/                   # React (Vite)
│   ├── src/
│   ├── dist/                   # الملفات المبنية
│   ├── package.json
│   └── .env.production

/etc/nginx/sites-enabled/default    # إعدادات Nginx
/root/backups/                       # النسخ الاحتياطية
/root/backup.sh                      # Script النسخ الاحتياطي
```

### على جهازك المحلي:
```
C:\printshop-web\
├── backend/                    # Laravel
├── frontend/                   # React
├── SERVER_DOCUMENTATION.md     # هذا الملف
└── DEPLOYMENT_GUIDE.md        # دليل النشر
```

---

## 💻 البيئة التقنية

### الخوادم والخدمات:
| الخدمة | الإصدار | الحالة | الأمر للفحص |
|--------|---------|--------|-------------|
| **Nginx** | 1.18.0 | Active | `systemctl status nginx` |
| **PHP** | 8.4.17 | Active | `php -v` |
| **PHP-FPM** | 8.4 | Active | `systemctl status php8.4-fpm` |
| **MySQL** | 8.0.45 | Active | `systemctl status mysql` |
| **Node.js** | 20.20.0 | - | `node -v` |
| **Composer** | 2.9.5 | - | `composer --version` |
| **Laravel** | 12.40.2 | - | `php artisan --version` |

### PHP Extensions المثبتة:
- ✅ pdo_mysql
- ✅ mbstring
- ✅ xml
- ✅ curl
- ✅ zip
- ✅ gd
- ✅ mysqli

---

## 🔍 فحص المشاكل

### 1️⃣ فحص حالة الخدمات:

```bash
# الاتصال بالسيرفر
ssh root@102.203.200.213

# فحص جميع الخدمات
systemctl status nginx php8.4-fpm mysql --no-pager
```

**النتيجة المتوقعة:** جميع الخدمات `Active (running)`

---

### 2️⃣ فحص سجلات Laravel:

```bash
# آخر 50 سطر من سجل الأخطاء
tail -50 /var/www/printshop/backend/storage/logs/laravel.log

# البحث عن أخطاء محددة
grep "ERROR" /var/www/printshop/backend/storage/logs/laravel.log | tail -20
```

**ما تبحث عنه:**
- أخطاء SQL (SQLSTATE)
- أخطاء 500 Internal Server Error
- Missing fields
- Connection errors

---

### 3️⃣ فحص سجلات Nginx:

```bash
# سجل الأخطاء
tail -50 /var/log/nginx/error.log

# سجل الوصول
tail -50 /var/log/nginx/access.log
```

---

### 4️⃣ فحص قاعدة البيانات:

```bash
cd /var/www/printshop/backend

# فحص الاتصال
php artisan db:show

# عرض الجداول
php artisan db:table users --show

# استعلام مباشر
mysql -u printshop -pstrong_password printshop -e "SELECT * FROM users;"
```

---

### 5️⃣ فحص الموارد:

```bash
# الذاكرة والمعالج
htop
# اضغط F10 للخروج

# المساحة
df -h

# الذاكرة بالتفصيل
free -h
```

---

### 6️⃣ فحص API Endpoints:

```bash
# فحص endpoint محدد
curl -I http://localhost/api/user

# فحص الصفحة الرئيسية
curl -I http://localhost
```

---

## 🔧 حل المشاكل

### المشكلة: خطأ 500 Internal Server Error

#### الفحص:
```bash
# 1. فحص سجل Laravel
tail -100 /var/www/printshop/backend/storage/logs/laravel.log

# 2. فحص صلاحيات المجلدات
ls -la /var/www/printshop/backend/storage/
ls -la /var/www/printshop/backend/bootstrap/cache/
```

#### الحل:
```bash
# إصلاح الصلاحيات
cd /var/www/printshop/backend
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# مسح الـ cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# إعادة تشغيل الخدمات
systemctl restart php8.4-fpm nginx
```

---

### المشكلة: خطأ في قاعدة البيانات

#### الفحص:
```bash
# فحص اتصال قاعدة البيانات
cd /var/www/printshop/backend
php artisan db:show

# فحص إعدادات .env
cat .env | grep DB_
```

#### الحل:
```bash
# تحديث الإعدادات إذا لزم الأمر
nano /var/www/printshop/backend/.env

# ثم مسح الـ cache
php artisan config:clear
php artisan config:cache
```

---

### المشكلة: API لا يستجيب (404)

#### الفحص:
```bash
# فحص إعدادات Nginx
cat /etc/nginx/sites-enabled/default

# فحص routes
cd /var/www/printshop/backend
php artisan route:list | grep api
```

#### الحل:
```bash
# إعادة بناء route cache
php artisan route:clear
php artisan route:cache

# إعادة تشغيل Nginx
systemctl restart nginx
```

---

### المشكلة: Frontend لا يعمل

#### الفحص:
```bash
# فحص وجود الملفات
ls -la /var/www/printshop/frontend/dist/

# فحص إعدادات Nginx
cat /etc/nginx/sites-enabled/default | grep frontend
```

#### الحل:
```bash
# إعادة بناء Frontend (على السيرفر)
cd /var/www/printshop/frontend
npm run build

# أو رفع dist من جهازك المحلي
```

---

## 🚀 رفع التحديثات

### الطريقة الكاملة (موصى بها):

#### 1️⃣ على جهازك المحلي:

```powershell
# الانتقال لمجلد المشروع
cd C:\printshop-web

# تعديل الملفات المطلوبة في VS Code
# ثم...

# إضافة التعديلات لـ Git
git add .

# حفظ التعديلات مع رسالة واضحة
git commit -m "Fix: وصف التعديل بالعربي"

# رفع للـ GitHub
git push origin main
```

#### 2️⃣ على السيرفر:

```bash
# الاتصال بالسيرفر
ssh root@102.203.200.213

# الانتقال لمجلد المشروع
cd /var/www/printshop

# سحب آخر تحديثات من GitHub
git pull origin main

# مسح الـ cache
cd backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# إعادة بناء الـ cache
php artisan config:cache
php artisan route:cache

# إعادة تشغيل الخدمات
systemctl restart php8.4-fpm nginx
```

---

### طريقة سريعة (للتحديثات البسيطة):

```bash
# على السيرفر مباشرة
ssh root@102.203.200.213
cd /var/www/printshop
git pull origin main
cd backend
php artisan cache:clear && php artisan config:cache
systemctl restart php8.4-fpm
```

---

## 🔑 أوامر مهمة

### إدارة الخدمات:

```bash
# إعادة تشغيل خدمة
systemctl restart nginx
systemctl restart php8.4-fpm
systemctl restart mysql

# إيقاف خدمة
systemctl stop nginx

# تشغيل خدمة
systemctl start nginx

# فحص حالة خدمة
systemctl status nginx
```

---

### Laravel Artisan:

```bash
cd /var/www/printshop/backend

# مسح جميع أنواع الـ cache
php artisan optimize:clear

# عرض routes
php artisan route:list

# عرض معلومات قاعدة البيانات
php artisan db:show

# تشغيل migrations
php artisan migrate

# إنشاء مستخدم (في tinker)
php artisan tinker
>>> User::create(['name' => 'Test', 'full_name' => 'Test User', 'email' => 'test@test.com', 'password' => Hash::make('password123')]);
>>> exit
```

---

### Git:

```bash
# فحص الحالة
git status

# سحب آخر تحديثات
git pull origin main

# عرض آخر commits
git log --oneline -5

# التراجع عن آخر commit (خطر!)
git reset --hard HEAD~1
```

---

### MySQL:

```bash
# الدخول لقاعدة البيانات
mysql -u printshop -pstrong_password printshop

# استعلام سريع
mysql -u printshop -pstrong_password printshop -e "SELECT * FROM users;"

# نسخة احتياطية
mysqldump -u printshop -pstrong_password printshop > backup.sql

# استعادة نسخة احتياطية
mysql -u printshop -pstrong_password printshop < backup.sql
```

---

### مراقبة النظام:

```bash
# المساحة
df -h

# الذاكرة
free -h

# المعالج والذاكرة (تفاعلي)
htop

# العمليات الجارية
ps aux | grep php
ps aux | grep nginx

# عدد الاتصالات
netstat -an | grep :80 | wc -l
```

---

## 💾 النسخ الاحتياطي

### النسخ التلقائي:

**موقع النسخ:** `/root/backups/`

**الجدولة:** يومياً الساعة 2:00 صباحاً (cron)

**Script:** `/root/backup.sh`

### فحص النسخ الاحتياطية:

```bash
# عرض النسخ الموجودة
ls -lh /root/backups/

# عرض سجل النسخ الاحتياطي
tail -20 /var/log/backup.log
```

### نسخة احتياطية يدوية:

```bash
# تشغيل script النسخ الاحتياطي
bash /root/backup.sh

# أو نسخة احتياطية مباشرة
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u printshop -pstrong_password printshop > /root/backups/manual_$DATE.sql
```

### استعادة نسخة احتياطية:

```bash
# 1. إيقاف التطبيق
systemctl stop nginx

# 2. استعادة قاعدة البيانات
mysql -u printshop -pstrong_password printshop < /root/backups/db_YYYYMMDD_HHMMSS.sql

# 3. استعادة الملفات (اختياري)
tar -xzf /root/backups/files_YYYYMMDD_HHMMSS.tar.gz -C /

# 4. إعادة تشغيل
systemctl start nginx
```

---

## 🔥 Firewall

### المنافذ المفتوحة:

```bash
# عرض حالة Firewall
ufw status

# السماح لمنفذ
ufw allow 80/tcp
ufw allow 443/tcp

# منع منفذ
ufw deny 8080/tcp
```

**المنافذ الحالية:**
- ✅ Port 22 (SSH)
- ✅ Port 80 (HTTP)
- ✅ Port 443 (HTTPS)

---

## 📞 معلومات الاتصال بالدعم

### Libyan Spider Support:
- **Website:** https://libyanspider.com
- **Email:** support@libyanspider.com
- **الدخول للوحة التحكم:** https://my.libyanspider.com

---

## ⚠️ تحذيرات مهمة

1. **لا تقم بتشغيل `rm -rf` إلا إذا كنت متأكداً 100%**
2. **احتفظ بنسخة احتياطية قبل أي تحديث كبير**
3. **لا تعطل MySQL أو Nginx بدون سبب**
4. **تحقق من المساحة المتاحة قبل أي عملية كبيرة**
5. **استخدم `git stash` إذا كانت هناك تعديلات محلية غير محفوظة**

---

## 📊 مراقبة الأداء

### فحص سريع شامل:

```bash
#!/bin/bash
echo "=== System Status ==="
free -h
echo ""
df -h /
echo ""
systemctl status nginx php8.4-fpm mysql --no-pager | grep "Active:"
echo ""
echo "=== Laravel Logs (Last 10 errors) ==="
grep "ERROR" /var/www/printshop/backend/storage/logs/laravel.log | tail -10
```

احفظ هذا في ملف `/root/status.sh` وشغله بـ `bash /root/status.sh`

---

## 🎯 Checklist للتحديثات

- [ ] Pull latest code: `git pull origin main`
- [ ] Clear cache: `php artisan optimize:clear`
- [ ] Rebuild cache: `php artisan config:cache`
- [ ] Restart services: `systemctl restart php8.4-fpm nginx`
- [ ] Test website: `curl -I http://localhost`
- [ ] Check logs: `tail -20 /var/www/printshop/backend/storage/logs/laravel.log`

---

## 📝 ملاحظات إضافية

### إعدادات مهمة في .env:

```env
APP_URL=http://102.203.200.213
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=printshop
DB_USERNAME=printshop
DB_PASSWORD=strong_password
SANCTUM_STATEFUL_DOMAINS=102.203.200.213
SESSION_DOMAIN=102.203.200.213
```

### Nginx Configuration:

**ملف:** `/etc/nginx/sites-enabled/default`

**الجذر للـ Frontend:** `/var/www/printshop/frontend/dist`

**الجذر للـ Backend:** `/var/www/printshop/backend/public`

**PHP-FPM Socket:** `unix:/var/run/php/php8.4-fpm.sock`

---

## 🔄 آخر تحديث

**التاريخ:** 3 فبراير 2026

**الإصدار:** 1.0

**الحالة:** ✅ النظام يعمل بنجاح

---

## 📚 مراجع مفيدة

- [Laravel Documentation](https://laravel.com/docs)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)

---

**تم إنشاء هذا الملف كمرجع شامل لإدارة السيرفر** 🎉
