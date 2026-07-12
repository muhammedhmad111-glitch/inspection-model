# CIMPOR AMREYAH – Maintenance Inspection ERP

## 🏭 نظرة عامة
نظام ERP احترافي لإدارة فحوصات الصيانة اليومية لمصنع CIMPOR GROUP – AMREYAH PLANT. يغطي جميع المعدات الرئيسية مع شيك ليست تفصيلية، تتبع لحظي، وإدارة كاملة للتنبيهات.

---

## ✅ الميزات المنجزة

### لوحة التحكم (Dashboard)
- KPIs لحظية: عدد المعدات، فحوصات اليوم، الفحوصات المتأخرة، التنبيهات، معدل الامتثال
- شبكة حالة المعدات Live مع نبضة اللون
- مخططات بيانية: توزيع الحالات، فحوصات آخر 7 أيام، معدل الامتثال الشهري
- جدول فحوصات اليوم مع حالة الإنجاز
- آخر التنبيهات النشطة

### إدارة المعدات (Equipment Management)
- بطاقات شاملة لكل معدة مع المعاملات الفنية
- صفحة تفاصيل كاملة مع خطط الفحص وسجل الفحوصات
- رفع صور لكل معدة
- تحديث حالة المعدة (operational / warning / critical / offline)
- فلترة وبحث

### تنفيذ الفحص (Inspection Execution)
- إنشاء فحص جديد مرتبط بمعدة وخطة فحص
- شيك ليست تفاعلية مقسمة بالمراحل
- أزرار النتيجة: OK / Warning / NOK / N/A مع تلوين بصري
- قياسات عددية مع حدود Min/Max
- ملاحظات لكل بند
- رفع صور للفحص مع معاينة
- شريط تقدم الإنجاز

### السجل التاريخي (History)
- عرض الفحوصات حسب نطاق تاريخي
- فلتر بالمعدة
- مخططات: فحوصات حسب المعدة، توزيع النتائج

### التقارير والتحليل (Reports)
- اتجاه الفحوصات الشهري (Stacked Bar)
- متوسط الإنجاز لكل معدة (Horizontal Bar)
- امتثال خطط الفحص (Radar)
- جدول أداء المعدات

### التنبيهات (Alerts)
- عرض التنبيهات النشطة والمعالجة
- تفصيل حسب الخطورة: critical / high / medium / low
- معالجة فردية أو جماعية
- فحص تلقائي للفحوصات المتأخرة

### الإدارة (Admin)
- عرض وإدارة جدول المعدات
- عرض خطط الفحص مع تفاصيلها

---

## 🏗️ البنية التقنية

### ملفات المشروع
```
index.html              - الصفحة الرئيسية (SPA)
css/style.css           - التصميم الشامل
js/app.js               - التحكم الرئيسي + API helpers
js/dashboard.js         - لوحة التحكم والمخططات
js/equipment.js         - إدارة المعدات
js/inspection.js        - إنشاء وعرض الفحوصات
js/checklist.js         - تنفيذ الشيك ليست
js/history.js           - السجل التاريخي والتقارير
js/alerts.js            - التنبيهات والإشعارات
js/admin.js             - لوحة الإدارة
```

### مكتبات مستخدمة
- **Chart.js** – المخططات البيانية
- **Font Awesome 6** – الأيقونات
- **Google Fonts Cairo** – الخط العربي
- **RESTful Table API** – قاعدة البيانات

---

## 📊 نماذج البيانات

### equipment
| الحقل | النوع | الوصف |
|-------|-------|--------|
| id | text | معرف فريد |
| code | text | كود المعدة (E11-04) |
| name | text | اسم المعدة |
| type | text | نوع المعدة |
| status | text | operational/warning/critical/offline |
| parameters | rich_text | JSON للمعاملات الفنية |
| photo_urls | array | صور المعدة |

### inspection_plans
- plan_code, plan_name, frequency, condition, items_count

### inspections
- equipment_id, plan_id, inspection_date, inspector_name, shift, overall_status, completion_percent, photo_urls

### inspection_results
- inspection_id, checklist_item_id, result (OK/NOK/Warning/N/A), measured_value, notes

### alerts
- equipment_id, alert_type, severity, message, is_resolved

---

## 🏭 المعدات المُدرجة
| الكود | الاسم | خطط الفحص |
|-------|-------|-----------|
| E11-04 | Apron Feeder (Mixture) | 5 IJPs |
| D11-01 | Belt Conveyor D11-01 | 6 IJPs |
| E11-23 | Roller Mill Dynamic Separator | 6 IJPs |
| E11-21 | Roller Mill (Polysius RM 54/27) | 6 IJPs |
| E11-18 | Rotary Valve | 4 IJPs |
| C11-03 | Bridge Reclaimer | 7 IJPs |

---

## 🔗 مسارات الصفحات (SPA)
جميع الصفحات عبر data-page:
- `dashboard` – لوحة التحكم
- `equipment` – قائمة المعدات
- `equipment-detail` – تفاصيل معدة
- `inspections` – قائمة الفحوصات
- `new-inspection` – فحص جديد
- `checklist` – تنفيذ الشيك ليست
- `history` – السجل التاريخي
- `reports` – التقارير
- `alerts` – التنبيهات
- `admin` – الإدارة

---

## 🚀 الخطوات القادمة المقترحة
1. إضافة نظام مصادقة وتسجيل دخول
2. تصدير تقارير PDF للفحوصات
3. جدولة تلقائية للفحوصات بناءً على التواريخ
4. نظام إشعارات عبر البريد الإلكتروني
5. قاعدة بيانات تاريخية للمعاملات الفنية (trend analysis)
6. تكامل مع SAP PM
7. تطبيق موبايل للتفتيش الميداني
