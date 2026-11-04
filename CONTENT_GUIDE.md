# إضافة وتعديل المحتوى

**الأسهل:** من Pages CMS (شوفي `PAGESCMS_GUIDE.md`). وده بيعدّل نفس ملفات `content/` بنماذج بدل JSON.

| عايزة تضيفي | القسم في Pages CMS | الملف | بيظهر فين |
|---|---|---|---|
| دراسة حالة | 📊 Case studies | `content/case-studies/اسم.json` | `/work/اسم/` وكروت الأعمال |
| مقال | ✍️ Articles | `content/insights/اسم.json` | `/insights/اسم/` |
| مورد مجاني (دليل/قالب/قائمة) | 🎁 Free resources | `content/resources/اسم.json` | `/resources/اسم/` (والقسم يظهر في القائمة تلقائيًا) |
| صفحة SEO أو عرض أو كورس | 📄 Pages | `content/pages/اسم.json` | `/اسم/` أو `/offers/اسم/` أو `/courses/اسم/` |
| عميل بلوجو | 🏷️ Clients | `content/clients.json` | الرئيسية و`/work/clients/` |
| موقع نفذتيه | 🌐 Websites | `content/websites.json` | الرئيسية و`/work/websites/` |
| لقطة إعلان/تقرير | 📸 Screenshots | `content/ads/` | `/work/ads/` |
| رأي عميل | 💬 References | `content/references/` | `/work/references/` (بعد أول رأي) |
| نص أي صفحة | 🏠👤🧩… Page text | `content/site/*.json` و`content/funnels/*.json` | الصفحة نفسها |
| رقم واتساب/روابط/تحليلات | ⚙️ Settings | `content/settings.json` | |

قواعد: النص بلغتين (English / العربية). الـ`slug` إنجليزي بدون مسافات. أرقام دراسات الحالة تتكتب مع فترتها ومصدرها (التقرير). آراء العملاء من كلامهم الفعلي فقط.
الملفات اللي اسمها يبدأ بـ `_` أمثلة وبيتجاهلها الموقع.
