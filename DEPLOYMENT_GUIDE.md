# دليل رفع النظام إلى Azure (الخطة الهجينة - Hybrid Plan) 🚀

هذا الدليل يشرح كيفية رفع نظام **Printshop Web** (Laravel + React) باستخدام رصيد **Azure for Students ($100)** بأفضل كفاءة وأقل تكلفة.

---

## 🏗️ نظرة عامة على المعمارية (Hybrid Architecture)

| الجزء | الخدمة في Azure | الفئة (Tier) | التكلفة التقديرية (شهرياً) |
| :--- | :--- | :--- | :--- |
| **قاعدة البيانات** | Azure Database for MySQL | Flexible Server (B1ms) | ~$15 - $18 |
| **الواجهة الخلفية (API)** | Azure App Service (Linux) | Basic B1 | ~$12 |
| **الواجهة الأمامية (React)** | Azure Static Web Apps | Standard/Free | **$0 (مجاناً)** |
| **الإجمالي** | | | **~$27 - $30** |

**💡 الرصيد (100$) سيكفي لتشغيل النظام لمدة 3.5 إلى 4 أشهر تقريباً.**

---

## 🛠️ الخطوات التفصيلية

### الخطوة 1: إعداد قاعدة البيانات (MySQL)
1.  ابحث عن **Azure Database for MySQL flexible servers**.
2.  اضغط **Create** ثم **Advanced Create**.
3.  **Basic:**
    *   Resource Group: `printshop-rg`
    *   Server name: `printshop-db-server`
    *   Workload type: `Development`
    *   Compute + Storage: اختر **Burstable (B1ms)**. **أغلق خيار High Availability**.
4.  **Networking:**
    *   اختر **Public access**.
    *   فعّل خيار **Allow public access from any Azure service within Azure...**.
    *   أضف الـ IP الخاص بجهازك الحالي.
5.  **Review + Create**: انتظر 5-10 دقائق حتى تنتهي.

---

### الخطوة 2: تجهيز كود Laravel للرفع
يجب إضافة ملف تشغيل لـ Azure ليعرف كيف يبدأ النظام:
1.  أنشئ مجلد باسم `deployment/azure/` داخل مجلد `backend/`.
2.  أنشئ ملف فيه باسم `startup.sh` يحتوي على:
    ```bash
    cp /home/site/wwwroot/default/dist/index.html /home/site/wwwroot/public/index.html || true
    php artisan migrate --force
    apache2ctl -D FOREGROUND
    ```

---

### الخطوة 3: رفع الموقع (Front & Back) عبر GitHub
**هذه أهم خطوة لضمان التحديث التلقائي:**
1.  قم برفع مشروعك بالكامل على مستودع في **GitHub** (تأكد من وجود مجلدي `backend` و `frontend`).
2.  **لرفع الـ React:**
    *   ابحث عن **Static Web Apps** في Azure.
    *   اختر `printshop-rg`.
    *   اربطه بحساب GitHub واختر المستودع.
    *   Build Presets: اختر `Vite`.
    *   App location: `/frontend`.
    *   Output location: `dist`.
3.  **لرفع الـ Laravel:**
    *   ابحث عن **Web App** (App Service).
    *   Runtime stack: `PHP 8.2`.
    *   اربطه بنفس المستودع من تبويب **Deployment Center**.

---

### الخطوة 4: ربط الأجزاء (Environment Variables)
في Azure App Service (الخاص بـ Laravel)، اذهب إلى **Configuration** وأضف:
*   `DB_HOST`: اسم السيرفر الذي أنشأته.
*   `DB_DATABASE`: اسم القاعدة.
*   `DB_USERNAME` & `DB_PASSWORD`.
*   `APP_KEY`: انسخه من ملف `.env` المحلي.

---

### 💰 نصائح للحفاظ على الـ 100 دولار:
*   **Stop the Server:** إذا كنت لا تستخدم النظام، قم بعمل **Stop** للـ MySQL و الـ Web App من لوحة التحكم لتوفير الرصيد.
*   **Monitoring:** راجع صفحة **Cost Management** في Azure مرة كل أسبوع لتعرف معدل الاستهلاك.
*   **CORS:** تأكد من إضافة رابط الـ Static Web App (الواجهة) في ملف `backend/config/cors.php` لتسمح بالاتصال.

---
📅 *تاريخ التحديث: 29 يناير 2026*
