// Text for the admin / back-office screens (kept apart from the learner dictionaries). Same keys in both languages.
import type { Locale } from "../types";

export const adminAr = {
  title: "لوحة الإدارة",
  nav: { dashboard: "نظرة عامة", courses: "الدورات", mentors: "المرشدون", orders: "الطلبات", users: "المستخدمون", reviews: "التقييمات", backToSite: "العودة للموقع" },
  common: {
    save: "حفظ", saving: "جارٍ الحفظ…", saved: "تم الحفظ", cancel: "إلغاء", add: "إضافة", edit: "تعديل", remove: "حذف", back: "رجوع",
    confirmDelete: "هل أنت متأكد من الحذف؟", loading: "جارٍ التحميل…", empty: "لا توجد بيانات", search: "بحث…",
    noAccess: "لا تملك صلاحية الدخول", noAccessText: "هذه المنطقة للمديرين فقط. سجّل الدخول بحساب مدير.",
    mockBanner: "وضع تجريبي: التعديلات تُحفظ في هذا المتصفح فقط ولا تظهر في صفحات المتعلمين. اربط النظام بالخادم لإدارة حقيقية.",
    yes: "نعم", no: "لا", optional: "اختياري", arabic: "العربية", english: "English", total: "الإجمالي", date: "التاريخ", status: "الحالة",
    errors: {
      slug_exists: "هذا الرابط المختصر مستخدم بالفعل", invalid_slug: "الرابط المختصر: أحرف إنجليزية صغيرة وأرقام وشرطات فقط",
      offering_in_use: "لا يمكن حذف خيار تم شراؤه. أخفِ الدورة بدلًا من ذلك", unknown_mentor: "اختر مرشدًا", user_not_found: "لا يوجد مستخدم بهذا البريد",
      cannot_remove_own_admin: "لا يمكنك إزالة صلاحية المدير عن نفسك", forbidden: "لا تملك الصلاحية", default: "تعذّر الحفظ، راجع الحقول وحاول مرة أخرى",
    },
  },
  dashboard: {
    users: "المستخدمون", courses: "الدورات", published: "منشورة", mentors: "المرشدون", enrollments: "التسجيلات", orders: "الطلبات المدفوعة",
    revenue: "إجمالي الإيرادات", revenue30: "إيرادات آخر ٣٠ يومًا", sessions: "جلسات مباشرة قادمة", top: "الأكثر تسجيلًا",
    quick: "اختصارات", newCourse: "دورة جديدة", newMentor: "مرشد جديد",
  },
  courses: {
    title: "الدورات", new: "دورة جديدة", published: "منشورة", hidden: "مخفية", publish: "نشر", unpublish: "إخفاء", offerings: "الخيارات", audience: "الفئة", mentor: "المرشد", edit: "تحرير",
    editTitle: "تحرير الدورة", newTitle: "دورة جديدة",
    basics: "المعلومات الأساسية", slug: "الرابط المختصر (إنجليزي)", slugHint: "مثال: risk-management. لا يتغير بعد الإنشاء.", topic: "الموضوع", level: "المستوى", audienceField: "الفئة",
    mentorField: "المرشد", hours: "عدد الساعات", ageRange: "الفئة العمرية (اختياري)", cpd: "نقاط CPD (اختياري)", languages: "لغة التدريس",
    flags: "علامات", featured: "مميزة في الرئيسية", isNew: "جديدة", bestseller: "الأكثر مبيعًا", certificate: "شهادة إتمام", visible: "ظاهرة للمتعلمين",
    text: "النصوص", titleField: "العنوان", subtitleField: "العنوان الفرعي", descriptionField: "الوصف",
    outcomesField: "ماذا سيتعلم (سطر لكل نقطة)", syllabus: "المحتوى", addModule: "إضافة وحدة", addLesson: "إضافة درس", moduleTitle: "عنوان الوحدة", lessonTitle: "عنوان الدرس",
    minutes: "دقائق", kind: "النوع", kinds: { video: "فيديو", live: "جلسة مباشرة", quiz: "اختبار", resource: "ملف" }, preview: "معاينة مجانية",
    offeringsTitle: "خيارات البيع (الأسعار شاملة الضريبة)", addOffering: "إضافة خيار", mode: "النوع", modes: { recorded: "مسجّلة", live: "مباشرة", blended: "مدمجة" },
    price: "السعر (ر.س)", compareAt: "السعر قبل الخصم", accessDays: "أيام الوصول", cohort: "اسم الدفعة", sessions: "الجلسات المباشرة", addSession: "إضافة جلسة",
    startsAt: "الموعد (توقيت الرياض)", duration: "المدة (دقيقة)", seats: "المقاعد", seatsLeft: "المتبقي", sessionTitle: "عنوان الجلسة",
    levels: { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" }, audiences: { kids: "الأطفال", youth: "الشباب", experts: "الخبراء" },
    topics: { projects: "إدارة المشاريع", leadership: "القيادة", finance: "المال والأعمال", entrepreneurship: "ريادة الأعمال", communication: "التواصل", technology: "التقنية والذكاء الاصطناعي", creativity: "الإبداع والتفكير" },
  },
  mentors: {
    title: "المرشدون", new: "مرشد جديد", editTitle: "تحرير المرشد", name: "الاسم", jobTitle: "المسمى الوظيفي", bio: "نبذة", expertise: "مجالات الخبرة (مفصولة بفواصل)",
    languages: "اللغات", account: "حساب الدخول المرتبط (بريد المستخدم)", accountHint: "يربط الملف بحساب فيحصل صاحبه على واجهة المرشد بنفس تسجيل الدخول.",
    linked: "مرتبط", notLinked: "غير مرتبط", color: "لون الصورة الرمزية", slug: "الرابط المختصر (إنجليزي)", rating: "التقييم",
  },
  users: { title: "المستخدمون", name: "الاسم", email: "البريد", roles: "الصلاحيات", enrollments: "التسجيلات", registeredFor: "التسجيل", forChild: "ولي أمر", self: "فرد", roleNames: { learner: "متعلم", mentor: "مرشد", admin: "مدير" } },
  orders: { title: "الطلبات", number: "رقم الطلب", customer: "العميل", items: "العناصر", method: "الدفع", invoice: "الفاتورة", vat: "الضريبة", statuses: { pending: "قيد الانتظار", paid: "مدفوع", failed: "فشل", refunded: "مسترد" } },
  reviews: { title: "التقييمات", course: "الدورة", author: "الكاتب", rating: "التقييم", comment: "التعليق", reply: "رد المرشد", writeReply: "اكتب ردًا", clearReply: "حذف الرد", removeReview: "حذف التقييم" },
};

export const adminEn: typeof adminAr = {
  title: "Admin portal",
  nav: { dashboard: "Overview", courses: "Courses", mentors: "Mentors", orders: "Orders", users: "Users", reviews: "Reviews", backToSite: "Back to site" },
  common: {
    save: "Save", saving: "Saving…", saved: "Saved", cancel: "Cancel", add: "Add", edit: "Edit", remove: "Delete", back: "Back",
    confirmDelete: "Are you sure you want to delete this?", loading: "Loading…", empty: "Nothing here yet", search: "Search…",
    noAccess: "No access", noAccessText: "This area is for administrators. Sign in with an admin account.",
    mockBanner: "Demo mode: changes are saved in this browser only and do not appear on learner pages. Connect the API for real management.",
    yes: "Yes", no: "No", optional: "optional", arabic: "العربية", english: "English", total: "Total", date: "Date", status: "Status",
    errors: {
      slug_exists: "This slug is already used", invalid_slug: "Slug: lowercase English letters, numbers and dashes only",
      offering_in_use: "An offering that has been bought cannot be deleted. Hide the course instead", unknown_mentor: "Choose a mentor", user_not_found: "No user has this email",
      cannot_remove_own_admin: "You cannot remove your own admin role", forbidden: "You do not have permission", default: "Could not save. Check the fields and try again",
    },
  },
  dashboard: {
    users: "Users", courses: "Courses", published: "published", mentors: "Mentors", enrollments: "Enrollments", orders: "Paid orders",
    revenue: "Total revenue", revenue30: "Revenue, last 30 days", sessions: "Upcoming live sessions", top: "Most enrolled",
    quick: "Shortcuts", newCourse: "New course", newMentor: "New mentor",
  },
  courses: {
    title: "Courses", new: "New course", published: "Published", hidden: "Hidden", publish: "Publish", unpublish: "Hide", offerings: "Offerings", audience: "Audience", mentor: "Mentor", edit: "Edit",
    editTitle: "Edit course", newTitle: "New course",
    basics: "Basics", slug: "Slug (English)", slugHint: "Example: risk-management. Cannot change after creation.", topic: "Topic", level: "Level", audienceField: "Audience",
    mentorField: "Mentor", hours: "Hours", ageRange: "Age range (optional)", cpd: "CPD points (optional)", languages: "Taught in",
    flags: "Flags", featured: "Featured on home", isNew: "New", bestseller: "Bestseller", certificate: "Completion certificate", visible: "Visible to learners",
    text: "Text", titleField: "Title", subtitleField: "Subtitle", descriptionField: "Description",
    outcomesField: "What learners will learn (one per line)", syllabus: "Syllabus", addModule: "Add module", addLesson: "Add lesson", moduleTitle: "Module title", lessonTitle: "Lesson title",
    minutes: "Minutes", kind: "Type", kinds: { video: "Video", live: "Live session", quiz: "Quiz", resource: "Resource" }, preview: "Free preview",
    offeringsTitle: "Offerings (prices include VAT)", addOffering: "Add offering", mode: "Format", modes: { recorded: "Recorded", live: "Live", blended: "Blended" },
    price: "Price (SAR)", compareAt: "Price before discount", accessDays: "Access days", cohort: "Cohort name", sessions: "Live sessions", addSession: "Add session",
    startsAt: "Starts (Riyadh time)", duration: "Duration (min)", seats: "Seats", seatsLeft: "Left", sessionTitle: "Session title",
    levels: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" }, audiences: { kids: "Kids", youth: "Youth", experts: "Experts" },
    topics: { projects: "Project management", leadership: "Leadership", finance: "Money and business", entrepreneurship: "Entrepreneurship", communication: "Communication", technology: "Technology and AI", creativity: "Creativity and thinking" },
  },
  mentors: {
    title: "Mentors", new: "New mentor", editTitle: "Edit mentor", name: "Name", jobTitle: "Job title", bio: "Bio", expertise: "Expertise (comma separated)",
    languages: "Languages", account: "Linked login account (user email)", accountHint: "Links this profile to an account so the owner gets the mentor interface with the same login.",
    linked: "Linked", notLinked: "Not linked", color: "Avatar colour", slug: "Slug (English)", rating: "Rating",
  },
  users: { title: "Users", name: "Name", email: "Email", roles: "Roles", enrollments: "Enrollments", registeredFor: "Registered as", forChild: "Guardian", self: "Individual", roleNames: { learner: "Learner", mentor: "Mentor", admin: "Admin" } },
  orders: { title: "Orders", number: "Order", customer: "Customer", items: "Items", method: "Payment", invoice: "Invoice", vat: "VAT", statuses: { pending: "Pending", paid: "Paid", failed: "Failed", refunded: "Refunded" } },
  reviews: { title: "Reviews", course: "Course", author: "Author", rating: "Rating", comment: "Comment", reply: "Mentor reply", writeReply: "Write a reply", clearReply: "Remove reply", removeReview: "Delete review" },
};

export type AdminDict = typeof adminAr;
export const getAdminDict = (l: Locale): AdminDict => (l === "ar" ? adminAr : adminEn);
