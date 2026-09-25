-- Batch two: seventy more sentences, taking the dictionary from 38.5% to 52.8%
-- of every checklist item in the plant.
--
-- This batch is where the plant's own vocabulary starts to matter. A fitter here
-- does not say "المحمل" or "قارنة" or "الناقل الحلزوني"; he says "البيرنج",
-- "الكوبلينج", "البريمة". Those are the words used, because a correct
-- translation nobody says is worse than no translation at all.
--
-- DE and NDE are left as they are written on the machine and in the spare parts
-- catalogue, with the Arabic beside them rather than instead of them.

insert into public.checklist_translations (label_norm, label_en, label_ar)
select public.checklist_label_norm(v.en), v.en, v.ar
from (values
  ('Fan Bearing: Check the bearing temperature..', 'بيرنج المروحة: افحص حرارة البيرنج'),
  ('Fan Bearing: Check the condition of intke filter (blockage, cut, tear).', 'بيرنج المروحة: افحص حالة فلتر السحب (انسداد، قطع، تهتك)'),
  ('Fan Bearing: Check the conditions of foundation.', 'بيرنج المروحة: افحص حالة القاعدة'),
  ('Fan casing: Check condition of impeller worn-out.', 'جسم المروحة: افحص تآكل الريشة'),
  ('Fan casing: Check the impeller material coating.', 'جسم المروحة: افحص تغليف الريشة'),
  ('intake pipes: Check adjustment of air regulator valve.', 'مواسير السحب: افحص ضبط محبس تنظيم الهواء'),
  ('intake pipes: Check flow control valve and pressure sensor ( air leakage , fixation….. ).', 'مواسير السحب: افحص محبس التحكم في السريان وحساس الضغط (تسريب هواء، تثبيت)'),
  ('intake pipes: Check pipes and supports (air leakage , fixation…..).', 'مواسير السحب: افحص المواسير وحواملها (تسريب هواء، تثبيت)'),
  ('intake pipes: Check pipes and supports.', 'مواسير السحب: افحص المواسير وحواملها'),
  ('intake pipes: Check the pipes corrosion and worn-out.', 'مواسير السحب: افحص صدأ وتآكل المواسير'),
  ('Safety: Check protections on moving parts', 'السلامة: افحص واقيات الأجزاء المتحركة'),
  ('Safety: Clean very well the grease.', 'السلامة: نظّف الشحم كويس جدًا'),
  ('Safety: Close the bearing housing.', 'السلامة: اقفل بيت البيرنج'),
  ('Safety: Measure the clearance of the bearing and record it.', 'السلامة: قِس خلوص البيرنج وسجّل القراءة'),
  ('Safety: Open the bearing housing.', 'السلامة: افتح بيت البيرنج'),
  ('Gear Box.(Geard Motor): Check the abnormal sounds.', 'الجير بوكس (الموتور المدمج): افحص وجود أصوات غير طبيعية'),
  ('Casing: Check inspection doors (seal, tightness, tightening).', 'الجسم: افحص أبواب التفتيش (الحشو، الإحكام، الربط)'),
  ('Gear Box.: Check the internal gears through Inspection door.', 'الجير بوكس: افحص التروس الداخلية من باب التفتيش'),
  ('Measuring procedure: Erect the cover again.', 'خطوات القياس: ركّب الغطاء تاني'),
  ('Measuring procedure: Disconnect the power supply of main drive.', 'خطوات القياس: افصل الكهرباء عن الموتور الرئيسي'),
  ('Safety: Record the measurement in the table below', 'السلامة: سجّل القراءة في الجدول اللي تحت'),
  ('Gear Box: Check oil level, colour and visual aspect of oil', 'الجير بوكس: افحص منسوب الزيت ولونه ومظهره'),
  ('Safety: Erect the coupling cover again and fix it.', 'السلامة: ركّب غطاء الكوبلينج تاني وثبّته'),
  ('Safety: Measure the gap between the two half of coupling in 4 postion angular and radial', 'السلامة: قِس الخلوص بين نصفي الكوبلينج في 4 مواضع، زاويًا وقطريًا'),
  ('Rollers: Check the cleaning rollers (noise, missing, blockage).', 'الرولات: افحص رولات التنظيف (صوت، مفقود، انسداد)'),
  ('Scrapers: Check the Blad wear, and scraper fixation.', 'الكشاطات: افحص تآكل السكينة وتثبيت الكشاطة'),
  ('Safety: Clean very well all the material or greas.', 'السلامة: نظّف كل المادة أو الشحم كويس جدًا'),
  ('Belt: Check the belt tension.', 'السير: افحص شد السير'),
  ('Hydraulic Coupling: Ckeck the oil leakage.', 'الكوبلينج الهيدروليك: افحص تسريب الزيت'),
  ('Scrapers: Check the proper contact.', 'الكشاطات: افحص ملامستها الصحيحة للسير'),
  ('Driven sprocket: Check the abnormal noise.', 'الترس المنقاد: افحص وجود صوت غير طبيعي'),
  ('Measuring Procedure: Recorded all the measurments.', 'خطوات القياس: سجّل كل القراءات'),
  ('Safety: Re-grease the bearing and put the seals.', 'السلامة: أعد تشحيم البيرنج وركّب السيلات'),
  ('Check the casing corrosion or worn-out.', 'افحص صدأ أو تآكل الجسم'),
  ('Check the cover protection.', 'افحص غطاء الحماية'),
  ('Check the Fixation of the fan.', 'افحص تثبيت المروحة'),
  ('Check the nozzel guide to the shell.', 'افحص موجّه النوزل تجاه البدن'),
  ('Coupling: Check the rubber element of the coupling.', 'الكوبلينج: افحص الجزء الكاوتش في الكوبلينج'),
  ('Coupling: Ckeck the alignment between motor and Gear Box.', 'الكوبلينج: افحص الاستقامة بين الموتور والجير بوكس'),
  ('Drive drum: Check the wear of the coating', 'درام القيادة: افحص تآكل التغليف'),
  ('Driven drum: Check the wear of the coating', 'الدرام المنقاد: افحص تآكل التغليف'),
  ('Hydraulic Coupling: Check the protection cover.', 'الكوبلينج الهيدروليك: افحص غطاء الحماية'),
  ('Snub drum at drive side: Check the wear of the coating', 'درام التوجيه جهة القيادة: افحص تآكل التغليف'),
  ('Snub drum at driven side: Check the wear of the coating', 'درام التوجيه الجهة المنقادة: افحص تآكل التغليف'),
  ('Casing: Check for any clinker leakage.', 'الجسم: افحص وجود تسريب كلنكر'),
  ('Gear Box: Check the abnormal sounds', 'الجير بوكس: افحص وجود أصوات غير طبيعية'),
  ('Belt: Check whether running centrally & straight.', 'السير: افحص إنه ماشي في النص ومستقيم'),
  ('Casing.: Check for any points to cause material leakage.', 'الجسم: افحص أي مواضع ممكن تسبب تسريب مادة'),
  ('Casing.: Check overall condition of corrosion.', 'الجسم: افحص الحالة العامة للصدأ'),
  ('Casing.: Check the conditions of isolation.', 'الجسم: افحص حالة العزل'),
  ('Check the abnormal noise', 'افحص وجود صوت غير طبيعي'),
  ('Coupling: Check the condition of coupling cover.', 'الكوبلينج: افحص حالة غطاء الكوبلينج'),
  ('Coupling: Check the oil leakage of the Hyd-coupling.', 'الكوبلينج: افحص تسريب زيت الكوبلينج الهيدروليك'),
  ('Coupling: Check the oil level of the Hyd-coupling.', 'الكوبلينج: افحص منسوب زيت الكوبلينج الهيدروليك'),
  ('Coupling: Review the coupling cover fixation between Motor and gear Box.', 'الكوبلينج: راجع تثبيت غطاء الكوبلينج بين الموتور والجير بوكس'),
  ('Drive sprocket: Check the bearing housing seals and grease leakage.', 'الترس القائد: افحص سيلات بيت البيرنج وتسريب الشحم'),
  ('Driven sprocket: Check the bearing temprature.', 'الترس المنقاد: افحص حرارة البيرنج'),
  ('Penumatic Double flap Valve: Check casing condition (holes, deformation , wear , cracks…).', 'محبس الدبل فلاب الهوائي: افحص حالة الجسم (خروم، اعوجاج، تآكل، شروخ)'),
  ('Penumatic Double flap Valve: Check for any air leakage from the air system pipes.', 'محبس الدبل فلاب الهوائي: افحص تسريب الهواء من مواسير نظام الهواء'),
  ('Penumatic Double flap Valve: Check inspection doors (seal, tightness, tightening).', 'محبس الدبل فلاب الهوائي: افحص أبواب التفتيش (الحشو، الإحكام، الربط)'),
  ('Penumatic Double flap Valve: Check the fixation of penumatic cylinder.', 'محبس الدبل فلاب الهوائي: افحص تثبيت السلندر الهوائي'),
  ('Penumatic Double flap Valve: Check the pneumatic cylinder and the control valves for tightness', 'محبس الدبل فلاب الهوائي: افحص إحكام السلندر الهوائي ومحابس التحكم'),
  ('Penumatic Double flap Valve: Check Visual the flange bolts tightening.', 'محبس الدبل فلاب الهوائي: افحص بالنظر ربط مسامير الفلنشة'),
  ('Safety: Identify and mark the various weak points of belt sections installed on the conveyor as 1,2, 3,4,..', 'السلامة: حدّد وعلّم نقاط الضعف في أجزاء السير على الناقل بالأرقام 1، 2، 3، 4'),
  ('Screw: Check the beams of journal bearing Fixation (bolts broken , missing, crack).', 'البريمة: افحص تثبيت كمرات البيرنج الوسيط (مسامير مكسورة، مفقودة، شروخ)'),
  ('Screw: Check the condition of flange connections (bolts broken , missing, crack).', 'البريمة: افحص حالة وصلات الفلنشات (مسامير مكسورة، مفقودة، شروخ)'),
  ('Screw: Check the condition of hollow shaft.', 'البريمة: افحص حالة العمود المجوف'),
  ('Screw: Check the condition of intermediate bearing ( journal bearing).', 'البريمة: افحص حالة البيرنج الوسيط'),
  ('Screw: Check the condition of plates(Spiral) worn-out.', 'البريمة: افحص تآكل ريش البريمة'),
  ('Gear Box.(Geard Motor): Check oil level, and gearbox temperature.', 'الجير بوكس (الموتور المدمج): افحص منسوب الزيت وحرارة الجير بوكس')
) as v(en, ar)
on conflict (label_norm) do update
set label_en = excluded.label_en, label_ar = excluded.label_ar, updated_at = now();
