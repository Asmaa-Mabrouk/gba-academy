// Legal documents. TEMPLATE TEXT pending legal review (see docs/legal.md). Keep ar and en in the same order.
export interface LegalSection { h: string; p: string[] }
export interface LegalDoc { title: string; intro: string; sections: LegalSection[] }
export type LegalKey = "terms" | "privacy" | "refund";
export const LEGAL_KEYS: LegalKey[] = ["terms", "privacy", "refund"];

export const LEGAL: Record<"ar" | "en", Record<LegalKey, LegalDoc>> = {
  en: {
    terms: {
      title: "Terms and conditions",
      intro: "These terms govern your use of the Global Business Academy website and courses. Please read them before you register or pay.",
      sections: [
        { h: "1. Who we are", p: ["The Academy is operated by the entity shown in the company details on this page and is part of the Global Project Management Forum ecosystem."] },
        { h: "2. Your account", p: ["You must give accurate information and keep your password private. You are responsible for activity on your account.", "Courses for children are bought and managed by a parent or guardian. We do not knowingly collect personal data directly from children."] },
        { h: "3. Courses and formats", p: ["Recorded courses give access for the period shown on the course page. Live courses give a seat in the scheduled sessions. Blended courses include both.", "Dates, mentors and session platforms may change when necessary. We will tell you by email and offer a fair alternative or a refund of the unused part."] },
        { h: "4. Prices and payment", p: ["Prices are in Saudi riyals and include 15% VAT. Payment is by mada, Apple Pay or card through a licensed payment provider. We never store your full card number.", "A tax invoice is issued for every paid order."] },
        { h: "5. Certificates", p: ["A completion certificate is issued when you complete 100% of the lessons of a recorded course, or attend the required sessions of a live course. Each certificate has a verification code."] },
        { h: "6. Acceptable use", p: ["Course content is for your personal learning. Do not copy, resell, record live sessions or share your access with others. We may suspend accounts that break these rules."] },
        { h: "7. Intellectual property", p: ["Content, brand and materials belong to the Academy and its mentors and are protected by law. You receive a personal, non-transferable licence to use them for learning."] },
        { h: "8. Liability", p: ["We provide courses with due care but cannot guarantee specific career or income results. Nothing in these terms limits rights you have under Saudi consumer protection law."] },
        { h: "9. Changes and governing law", p: ["We may update these terms. The version you accepted is recorded with your account. These terms are governed by the laws of the Kingdom of Saudi Arabia."] },
      ],
    },
    privacy: {
      title: "Privacy policy",
      intro: "We respect your privacy and handle personal data in line with the Saudi Personal Data Protection Law (PDPL).",
      sections: [
        { h: "1. Data we collect", p: ["Account data (name, email, mobile), learning data (enrolments, progress, certificates, reviews), order data (invoices and payment status) and technical data (device and logs)."] },
        { h: "2. Why we use it", p: ["To run your account and courses, process payments and issue invoices, send service messages, keep the platform secure and improve it. With your consent only, to send news and offers."] },
        { h: "3. Payment data", p: ["Card details are handled by the payment provider. The Academy keeps only the payment status and a masked reference."] },
        { h: "4. Children", p: ["Child learners are registered under a parent or guardian account. We collect the minimum data needed and never use it for marketing to children."] },
        { h: "5. Sharing", p: ["We share data only with service providers who work for us (payment, video, messaging, e-invoicing) and with authorities when the law requires. Mentors see learners' names and progress in their courses, never contact details."] },
        { h: "6. Your rights", p: ["You can ask to access, correct or delete your data, and withdraw marketing consent at any time. Contact us using the details on this page."] },
        { h: "7. Retention and security", p: ["We keep data as long as your account is active and as the law requires for invoices. We use encryption in transit and access controls."] },
      ],
    },
    refund: {
      title: "Refund policy",
      intro: "We want you to be confident when you buy. This is how refunds work.",
      sections: [
        { h: "1. Recorded courses", p: ["You can ask for a full refund within 7 days of purchase if you completed less than 20% of the lessons."] },
        { h: "2. Live and blended courses", p: ["Full refund up to 3 days before the first session. After that, the refund is proportional to the sessions not yet delivered."] },
        { h: "3. If we cancel", p: ["If we cancel or reschedule a live session and you cannot attend, you can transfer to the next cohort or receive a full refund."] },
        { h: "4. How to request", p: ["Email us with your order number. We review within 3 working days and return the money to the original payment method within 14 days of approval."] },
        { h: "5. Not refundable", p: ["Issued certificates, and courses completed more than 20%, unless the course was materially different from its description."] },
      ],
    },
  },
  ar: {
    terms: {
      title: "الشروط والأحكام",
      intro: "تنظّم هذه الشروط استخدامك لموقع أكاديمية الأعمال العالمية ودوراتها. يرجى قراءتها قبل التسجيل أو الدفع.",
      sections: [
        { h: "١. من نحن", p: ["تُدار الأكاديمية من قبل المنشأة المبيّنة في بيانات المنشأة في هذه الصفحة، وهي ضمن منظومة المنتدى العالمي لإدارة المشاريع."] },
        { h: "٢. حسابك", p: ["يجب أن تقدّم معلومات صحيحة وأن تحافظ على سرية كلمة المرور، وأنت مسؤول عن النشاط على حسابك.", "دورات الأطفال يشتريها ويديرها ولي الأمر. ولا نجمع بيانات شخصية من الأطفال مباشرة."] },
        { h: "٣. الدورات وأنماطها", p: ["الدورات المسجّلة تمنحك وصولًا للمدة المذكورة في صفحة الدورة. الدورات المباشرة تمنحك مقعدًا في الجلسات المجدولة. والمدمجة تجمع الاثنين.", "قد تتغير المواعيد أو المرشدون أو منصة الجلسة عند الضرورة. سنبلغك بالبريد ونوفر بديلًا مناسبًا أو نردّ قيمة الجزء غير المستفاد."] },
        { h: "٤. الأسعار والدفع", p: ["الأسعار بالريال السعودي وتشمل ضريبة القيمة المضافة 15٪. يتم الدفع بمدى أو Apple Pay أو البطاقة عبر مزوّد دفع مرخّص. ولا نحتفظ برقم بطاقتك الكامل.", "تُصدر فاتورة ضريبية لكل طلب مدفوع."] },
        { h: "٥. الشهادات", p: ["تصدر شهادة الإتمام عند إكمال 100٪ من دروس الدورة المسجّلة، أو حضور الجلسات المطلوبة في الدورة المباشرة. ولكل شهادة رمز تحقق."] },
        { h: "٦. الاستخدام المقبول", p: ["محتوى الدورات لتعلّمك الشخصي. يُمنع النسخ أو إعادة البيع أو تسجيل الجلسات المباشرة أو مشاركة حسابك مع الآخرين. وقد نوقف الحسابات المخالفة."] },
        { h: "٧. الملكية الفكرية", p: ["المحتوى والعلامة والمواد مملوكة للأكاديمية ومرشديها ومحمية نظامًا. تحصل على ترخيص شخصي غير قابل للتحويل لاستخدامها في التعلّم."] },
        { h: "٨. المسؤولية", p: ["نقدّم الدورات بعناية لكن لا نضمن نتائج وظيفية أو مالية محددة. ولا تقيّد هذه الشروط حقوقك بموجب نظام حماية المستهلك السعودي."] },
        { h: "٩. التعديلات والنظام الواجب التطبيق", p: ["قد نحدّث هذه الشروط، وتُسجَّل النسخة التي وافقت عليها مع حسابك. وتخضع الشروط لأنظمة المملكة العربية السعودية."] },
      ],
    },
    privacy: {
      title: "سياسة الخصوصية",
      intro: "نحترم خصوصيتك ونتعامل مع بياناتك الشخصية وفق نظام حماية البيانات الشخصية في المملكة.",
      sections: [
        { h: "١. البيانات التي نجمعها", p: ["بيانات الحساب (الاسم والبريد والجوال)، وبيانات التعلّم (الاشتراكات والتقدّم والشهادات والتقييمات)، وبيانات الطلبات (الفواتير وحالة الدفع)، وبيانات تقنية (الجهاز والسجلات)."] },
        { h: "٢. لماذا نستخدمها", p: ["لتشغيل حسابك ودوراتك، ومعالجة المدفوعات وإصدار الفواتير، وإرسال رسائل الخدمة، وحماية المنصة وتحسينها. ولإرسال الأخبار والعروض بموافقتك فقط."] },
        { h: "٣. بيانات الدفع", p: ["تتولى جهة الدفع معالجة بيانات البطاقة. وتحتفظ الأكاديمية بحالة الدفع ومرجع مخفي فقط."] },
        { h: "٤. الأطفال", p: ["يُسجَّل المتعلمون الأطفال تحت حساب ولي الأمر. نجمع الحد الأدنى من البيانات ولا نستخدمها لتسويق موجّه للأطفال."] },
        { h: "٥. المشاركة", p: ["نشارك البيانات فقط مع مزوّدي الخدمة الذين يعملون لصالحنا (الدفع والفيديو والرسائل والفوترة الإلكترونية) ومع الجهات الرسمية عند إلزام النظام. يرى المرشد أسماء المتعلمين وتقدّمهم في دوراته دون بيانات التواصل."] },
        { h: "٦. حقوقك", p: ["يمكنك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها، وسحب موافقة التسويق في أي وقت، عبر بيانات التواصل في هذه الصفحة."] },
        { h: "٧. الاحتفاظ والأمان", p: ["نحتفظ بالبيانات ما دام حسابك نشطًا وبحسب ما يوجبه النظام للفواتير، ونستخدم التشفير أثناء النقل وضوابط الوصول."] },
      ],
    },
    refund: {
      title: "سياسة الاسترجاع",
      intro: "نريدك مطمئنًا عند الشراء. هذه هي آلية الاسترجاع.",
      sections: [
        { h: "١. الدورات المسجّلة", p: ["يمكنك طلب استرجاع كامل خلال 7 أيام من الشراء إذا أنجزت أقل من 20٪ من الدروس."] },
        { h: "٢. الدورات المباشرة والمدمجة", p: ["استرجاع كامل حتى 3 أيام قبل أول جلسة. بعد ذلك يكون الاسترجاع بنسبة الجلسات التي لم تُقدَّم."] },
        { h: "٣. إذا ألغينا نحن", p: ["إذا ألغينا جلسة مباشرة أو أجّلناها ولم تتمكن من الحضور، يمكنك الانتقال إلى الدفعة القادمة أو استرجاع المبلغ كاملًا."] },
        { h: "٤. كيف تطلب", p: ["راسلنا برقم الطلب. نراجع الطلب خلال 3 أيام عمل ونعيد المبلغ لوسيلة الدفع الأصلية خلال 14 يومًا من الموافقة."] },
        { h: "٥. غير قابل للاسترجاع", p: ["الشهادات المصدرة، والدورات التي أُنجز منها أكثر من 20٪، إلا إذا اختلفت الدورة جوهريًا عن وصفها."] },
      ],
    },
  },
};
