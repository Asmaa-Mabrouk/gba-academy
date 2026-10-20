import type { Locale } from "../types";

export const kidsAr = {
  title: "عالم الأبطال الصغار",
  hero: { badge: "للأطفال ٦ – ١٢ سنة", h1: "اصنع بطلك وتعلّم وابنِ مشاريعك", sub: "اصنع شخصيتك، أنجز المهام، اجمع النقاط، وابنِ مشاريع رائعة لتصعد في لوحة الأبطال مع أصدقائك.", cta: "اصنع بطلي الآن", courses: "استكشف دورات الأطفال", parent: "الشراء والتسجيل يتم عبر حساب ولي الأمر." },
  steps: [["١", "اصنع بطلك", "اختر الشكل والألوان والإكسسوار"], ["٢", "أنجز المهام", "كل مهمة تمنحك نقاط خبرة"], ["٣", "ابنِ مشروعًا", "شاركه واحصل على تشجيع الأصدقاء"], ["٤", "اصعد للقمة", "انضم إلى لوحة الأبطال"]],
  builder: {
    title: "ورشة صناعة البطل", nickname: "اسم البطل", nicknameHint: "اختر اسمًا مستعارًا مرحًا. لا تكتب اسمك الحقيقي ولا أي معلومات شخصية.", nicknamePh: "مثال: النجم الشجاع",
    skin: "لون البشرة", hair: "الشعر", hairColor: "لون الشعر", outfit: "لون الزي", accessory: "الإكسسوار", background: "الخلفية", cape: "عباءة البطل", random: "عشوائي", save: "احفظ بطلي", saved: "تم حفظ بطلك!",
    hairs: { none: "بدون", short: "قصير", spiky: "مدبّب", curly: "مجعّد", bun: "كعكة" }, accessories: { none: "بدون", glasses: "نظارة", crown: "تاج", star: "نجمة", headphones: "سماعات" },
  },
  stats: { level: "المستوى", xp: "نقطة خبرة", toNext: "نقطة للمستوى التالي", streak: "أيام متتالية", day: "يوم", badges: "الأوسمة", maxLevel: "أعلى مستوى!" },
  levels: ["مستكشف", "بنّاء", "مخترع", "بطل", "أسطورة"],
  missions: {
    title: "مهام اليوم", done: "تمت", go: "أنجزتها", hint: "تتجدد المهام كل يوم. اطلب من وليّ أمرك مشاركتك في إنجاز الدروس.",
    list: [["login", "ادخل عالم الأبطال", 10], ["lesson", "شاهد درسًا من دورتك", 20], ["quiz", "حل اختبارًا قصيرًا", 30], ["share", "شجّع مشروع صديق", 10], ["project", "ابدأ مشروعًا جديدًا", 40]],
  },
  badgesList: { first: ["بطل جديد", "حفظت بطلك"], project: ["مبدع", "أنشأت أول مشروع"], streak3: ["مثابر", "٣ أيام متتالية"], level2: ["بنّاء", "وصلت للمستوى ٢"], cheers5: ["صديق رائع", "شجّعت ٥ مشاريع"] },
  projects: {
    title: "مشاريع الأبطال", sub: "مشاريع أنجزها أبطال مثلك. شجّعهم برموز تعبيرية آمنة فقط، لا توجد محادثات مفتوحة.", mine: "مشاريعي", build: "ابنِ مشروعًا", name: "اسم المشروع", namePh: "مثال: روبوت الحديقة", kind: "نوع المشروع", idea: "فكرتك في جملة", ideaPh: "ماذا سيفعل مشروعك؟", add: "أضف مشروعي", empty: "لم تبنِ مشروعًا بعد. ابدأ الآن!", cheer: "تشجيع", cheered: "شجّعت", review: "مشاريعك تظهر لك فقط حتى يراجعها وليّ الأمر والمرشد.", removed: "تم حذف المشروع", delete: "حذف",
    kinds: { robot: "روبوت", game: "لعبة", story: "قصة", art: "رسم", science: "تجربة علمية", app: "تطبيق" },
    samples: [["الروبوت الصديق", "robot", "روبوت يسقي النباتات"], ["مغامرة النجوم", "game", "لعبة قفز بين الكواكب"], ["قصة التنين الخجول", "story", "تنين يتعلم الشجاعة"], ["مختبر البراكين", "science", "بركان من الخل والصودا"], ["مدينة المستقبل", "art", "رسم مدينة بسيارات طائرة"], ["تطبيق المهام", "app", "تطبيق لترتيب واجباتي"]],
  },
  board: { title: "لوحة الأبطال", sub: "أفضل الأبطال هذا الأسبوع", you: "أنت", rank: "الترتيب", hero: "البطل", xp: "النقاط", note: "الأسماء مستعارة والنقاط للتشجيع فقط." },
  courses: { title: "مغامرات التعلّم", sub: "دورات مصممة للأطفال. يشتريها وليّ الأمر ويتابع التقدم.", all: "كل دورات الأطفال" },
  safety: { title: "بيئة آمنة للأطفال", items: ["لا نطلب أي بيانات شخصية من الطفل", "أسماء مستعارة فقط ولا توجد محادثات مفتوحة", "الشراء والتسجيل عبر حساب وليّ الأمر", "التشجيع برموز جاهزة فقط"], demo: "النقاط والمشاريع في هذه النسخة محفوظة على هذا الجهاز فقط." },
};

export const kidsEn: typeof kidsAr = {
  title: "Little Heroes World",
  hero: { badge: "For ages 6 – 12", h1: "Create your hero, learn and build projects", sub: "Make your character, finish missions, collect XP and build awesome projects to climb the Hero Board with your friends.", cta: "Create my hero", courses: "Explore kids' courses", parent: "Buying and registration happen through the parent or guardian account." },
  steps: [["1", "Create your hero", "Pick the look, colours and gear"], ["2", "Complete missions", "Every mission earns XP"], ["3", "Build a project", "Share it and get cheers from friends"], ["4", "Reach the top", "Join the Hero Board"]],
  builder: {
    title: "Hero workshop", nickname: "Hero name", nicknameHint: "Pick a fun nickname. Never use your real name or any personal details.", nicknamePh: "e.g. Brave Star",
    skin: "Skin tone", hair: "Hair", hairColor: "Hair colour", outfit: "Outfit colour", accessory: "Gear", background: "Background", cape: "Hero cape", random: "Surprise me", save: "Save my hero", saved: "Your hero is saved!",
    hairs: { none: "None", short: "Short", spiky: "Spiky", curly: "Curly", bun: "Bun" }, accessories: { none: "None", glasses: "Glasses", crown: "Crown", star: "Star", headphones: "Headphones" },
  },
  stats: { level: "Level", xp: "XP", toNext: "XP to next level", streak: "Day streak", day: "day", badges: "Badges", maxLevel: "Top level!" },
  levels: ["Explorer", "Builder", "Inventor", "Hero", "Legend"],
  missions: {
    title: "Today's missions", done: "Done", go: "I did it", hint: "Missions refresh every day. Ask your parent to help you finish lessons.",
    list: [["login", "Visit the Heroes World", 10], ["lesson", "Watch a lesson from your course", 20], ["quiz", "Solve a short quiz", 30], ["share", "Cheer a friend's project", 10], ["project", "Start a new project", 40]],
  },
  badgesList: { first: ["New hero", "You saved your hero"], project: ["Maker", "Built your first project"], streak3: ["Steady", "3 days in a row"], level2: ["Builder", "Reached level 2"], cheers5: ["Great friend", "Cheered 5 projects"] },
  projects: {
    title: "Hero projects", sub: "Projects made by heroes like you. Cheer with safe emoji only. There is no open chat.", mine: "My projects", build: "Build a project", name: "Project name", namePh: "e.g. Garden robot", kind: "Project type", idea: "Your idea in one sentence", ideaPh: "What will your project do?", add: "Add my project", empty: "You haven't built a project yet. Start now!", cheer: "Cheer", cheered: "Cheered", review: "Your projects are visible only to you until a parent and a mentor review them.", removed: "Project removed", delete: "Delete",
    kinds: { robot: "Robot", game: "Game", story: "Story", art: "Art", science: "Science experiment", app: "App" },
    samples: [["Friendly Robot", "robot", "A robot that waters plants"], ["Star Adventure", "game", "A jumping game between planets"], ["The Shy Dragon", "story", "A dragon learning to be brave"], ["Volcano Lab", "science", "A volcano from vinegar and soda"], ["City of the Future", "art", "A drawing of a city with flying cars"], ["Chore Tracker", "app", "An app to organise my homework"]],
  },
  board: { title: "Hero Board", sub: "Top heroes this week", you: "You", rank: "Rank", hero: "Hero", xp: "XP", note: "Names are nicknames and points are for fun only." },
  courses: { title: "Learning adventures", sub: "Courses designed for kids. A parent buys them and follows progress.", all: "All kids' courses" },
  safety: { title: "A safe place for kids", items: ["We never ask a child for personal data", "Nicknames only and no open chat", "Buying and sign-up go through the parent account", "Cheering uses ready-made emoji only"], demo: "In this version XP and projects are saved on this device only." },
};

export type KidsDict = typeof kidsAr;
export const getKidsDict = (l: Locale): KidsDict => (l === "ar" ? kidsAr : kidsEn);
