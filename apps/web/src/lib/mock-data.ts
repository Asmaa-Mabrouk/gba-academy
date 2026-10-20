// Sample data used in mock mode (NEXT_PUBLIC_API_MODE=mock) and as the seed for the Java API.
// All people, reviews and prices here are invented sample data.
import type {
  Audience,
  Bilingual,
  Course,
  CourseModule,
  Lesson,
  LessonKind,
  LiveSession,
  Mentor,
  Mode,
  Offering,
  Review,
} from "./types";

const B = (ar: string, en: string): Bilingual => ({ ar, en });
const sar = (v: number) => Math.round(v * 100); // SAR to halalas, VAT included

const lesson = (id: string, ar: string, en: string, minutes: number, kind: LessonKind = "video", preview = false): Lesson => ({
  id,
  title: B(ar, en),
  minutes,
  kind,
  preview,
});

const mod = (id: string, ar: string, en: string, lessons: Lesson[]): CourseModule => ({ id, title: B(ar, en), lessons });

const sessions = (slug: string, ar: string, en: string, dates: string[], durationMin: number, seats: number, left: number[]): LiveSession[] =>
  dates.map((d, i) => ({
    id: `${slug}-s${i + 1}`,
    startsAt: d,
    durationMin,
    seats,
    seatsLeft: left[i] ?? seats,
    title: B(`${ar} ${i + 1}`, `${en} ${i + 1}`),
  }));

export const MENTORS: Mentor[] = [
  {
    id: "m1",
    slug: "layla-al-harbi",
    name: B("د. ليلى الحربي", "Dr. Layla Al-Harbi"),
    title: B("مديرة برامج استراتيجية", "Strategic Programme Director"),
    bio: B(
      "قادت برامج تحوّل مؤسسي كبرى لأكثر من ١٥ عامًا، وتدرّب القادة على تحويل الاستراتيجية إلى نتائج قابلة للقياس.",
      "Led large organisational transformation programmes for over 15 years and coaches leaders to turn strategy into measurable results.",
    ),
    expertise: ["programme", "strategy", "leadership"],
    languages: ["ar", "en"],
    rating: 4.9,
    reviewCount: 412,
    courseCount: 3,
    learners: 5230,
    hue: 42,
  },
  {
    id: "m2",
    slug: "faisal-al-otaibi",
    name: B("فيصل العتيبي", "Faisal Al-Otaibi"),
    title: B("خبير إدارة المخاطر", "Risk Management Expert"),
    bio: B(
      "يعمل مع مشاريع البنية التحتية والطاقة، ويبسّط أدوات المخاطر لتصبح أدوات يومية لفرق العمل.",
      "Works on infrastructure and energy projects and turns risk tools into everyday habits for delivery teams.",
    ),
    expertise: ["risk", "projects", "governance"],
    languages: ["ar", "en"],
    rating: 4.8,
    reviewCount: 287,
    courseCount: 2,
    learners: 3180,
    hue: 210,
  },
  {
    id: "m3",
    slug: "noura-al-qahtani",
    name: B("نورة القحطاني", "Noura Al-Qahtani"),
    title: B("مدرّبة تعليم الأطفال والتفكير الإبداعي", "Kids Learning and Creative Thinking Coach"),
    bio: B(
      "معلمة سابقة وصانعة محتوى تعليمي، تحوّل المفاهيم الكبيرة إلى ألعاب ومشاريع يحبها الأطفال.",
      "A former teacher and learning designer who turns big ideas into games and projects children love.",
    ),
    expertise: ["kids", "creativity", "games"],
    languages: ["ar"],
    rating: 4.9,
    reviewCount: 356,
    courseCount: 3,
    learners: 4410,
    hue: 168,
  },
  {
    id: "m4",
    slug: "omar-haddad",
    name: B("عمر حداد", "Omar Haddad"),
    title: B("رائد أعمال ومرشد شباب", "Founder and Youth Mentor"),
    bio: B(
      "أسّس ثلاث شركات ناشئة ويرشد الشباب لبناء أول مشروع حقيقي خلال أسابيع.",
      "Founded three start-ups and mentors young people through building their first real venture in weeks.",
    ),
    expertise: ["startup", "entrepreneurship", "pitching"],
    languages: ["ar", "en"],
    rating: 4.7,
    reviewCount: 198,
    courseCount: 2,
    learners: 2670,
    hue: 275,
  },
  {
    id: "m5",
    slug: "reem-al-shehri",
    name: B("ريم الشهري", "Reem Al-Shehri"),
    title: B("مدرّبة تواصل وقيادة", "Communication and Leadership Trainer"),
    bio: B(
      "تدرّب على الإلقاء والتأثير والتفاوض، وتعمل مع الطلاب والمديرين على حد سواء.",
      "Trains presentation, influence and negotiation for students and executives alike.",
    ),
    expertise: ["communication", "negotiation", "presenting"],
    languages: ["ar", "en"],
    rating: 4.8,
    reviewCount: 241,
    courseCount: 2,
    learners: 3050,
    hue: 330,
  },
  {
    id: "m6",
    slug: "khalid-al-mansour",
    name: B("خالد المنصور", "Khalid Al-Mansour"),
    title: B("مستشار الذكاء الاصطناعي وتحوّل الأعمال", "AI and Business Transformation Advisor"),
    bio: B(
      "يساعد المحترفين على استخدام أدوات الذكاء الاصطناعي في التخطيط والتقارير واتخاذ القرار.",
      "Helps professionals use AI tools for planning, reporting and decision-making.",
    ),
    expertise: ["ai", "pmo", "analytics"],
    languages: ["ar", "en"],
    rating: 4.6,
    reviewCount: 164,
    courseCount: 2,
    learners: 1980,
    hue: 195,
  },
];

interface Seed {
  slug: string;
  audience: Audience;
  level: Course["level"];
  topic: string;
  title: Bilingual;
  subtitle: Bilingual;
  description: Bilingual;
  outcomes: Bilingual[];
  modules: CourseModule[];
  mentorId: string;
  rating: number;
  reviewCount: number;
  learners: number;
  hours: number;
  languages: Course["languages"];
  featured?: boolean;
  isNew?: boolean;
  bestseller?: boolean;
  ageRange?: string;
  cpdPoints?: number;
  prices: Partial<Record<Mode, number>>; // SAR incl. VAT
  compareAt?: Partial<Record<Mode, number>>;
  liveDates?: string[];
  liveTitle?: Bilingual;
  liveDuration?: number;
  seats?: number;
  left?: number[];
  accessDays?: number;
}

function build(s: Seed): Course {
  const offerings: Offering[] = [];
  (["recorded", "live", "blended"] as Mode[]).forEach((mode) => {
    const price = s.prices[mode];
    if (price === undefined) return;
    const hasLive = mode !== "recorded";
    offerings.push({
      id: `${s.slug}-${mode}`,
      mode,
      priceHalalas: sar(price),
      compareAtHalalas: s.compareAt?.[mode] ? sar(s.compareAt[mode] as number) : undefined,
      accessDays: mode === "live" ? undefined : s.accessDays ?? 180,
      cohortLabel: hasLive ? B("دفعة نوفمبر ٢٠٢٦", "November 2026 cohort") : undefined,
      sessions: hasLive
        ? sessions(
            `${s.slug}-${mode}`,
            s.liveTitle?.ar ?? "جلسة مباشرة",
            s.liveTitle?.en ?? "Live session",
            s.liveDates ?? [],
            s.liveDuration ?? 90,
            s.seats ?? 25,
            s.left ?? [],
          )
        : [],
    });
  });
  return {
    id: `c-${s.slug}`,
    slug: s.slug,
    audience: s.audience,
    level: s.level,
    topic: s.topic,
    title: s.title,
    subtitle: s.subtitle,
    description: s.description,
    outcomes: s.outcomes,
    modules: s.modules,
    mentorId: s.mentorId,
    rating: s.rating,
    reviewCount: s.reviewCount,
    learners: s.learners,
    hours: s.hours,
    languages: s.languages,
    offerings,
    featured: !!s.featured,
    isNew: !!s.isNew,
    bestseller: !!s.bestseller,
    ageRange: s.ageRange,
    certificate: true,
    cpdPoints: s.cpdPoints,
  };
}

const D = {
  a: ["2026-11-08T16:00:00Z", "2026-11-15T16:00:00Z", "2026-11-22T16:00:00Z", "2026-11-29T16:00:00Z"],
  b: ["2026-11-10T17:00:00Z", "2026-11-17T17:00:00Z", "2026-11-24T17:00:00Z"],
  c: ["2026-11-12T15:30:00Z", "2026-11-19T15:30:00Z", "2026-11-26T15:30:00Z", "2026-12-03T15:30:00Z"],
  d: ["2026-11-14T13:00:00Z", "2026-11-21T13:00:00Z", "2026-11-28T13:00:00Z"],
  e: ["2026-12-06T17:00:00Z", "2026-12-13T17:00:00Z", "2026-12-20T17:00:00Z"],
};

export const COURSES: Course[] = [
  // ---------------- Kids ----------------
  build({
    slug: "little-project-heroes",
    audience: "kids",
    level: "beginner",
    topic: "projects",
    title: B("أبطال المشاريع الصغار", "Little Project Heroes"),
    subtitle: B("خطّط مهمتك وأنجزها مع فريقك كأنك قائد حقيقي", "Plan your mission and finish it with your team like a real leader"),
    description: B(
      "في هذه المغامرة يتعلم الأطفال كيف يحوّلون فكرة إلى خطة: يحددون الهدف، ويوزّعون الأدوار، ويتابعون التقدّم عبر ألعاب وتحديات ممتعة، وينهون الدورة بمشروع صغير يفخرون به.",
      "In this adventure children learn to turn an idea into a plan: set a goal, share roles and track progress through games and challenges, finishing with a small project they are proud of.",
    ),
    outcomes: [
      B("يحدد هدفًا واضحًا لمهمته", "Sets a clear goal for a mission"),
      B("يقسّم العمل إلى خطوات صغيرة", "Breaks work into small steps"),
      B("يتعاون مع فريقه ويوزّع الأدوار", "Works with a team and shares roles"),
      B("يعرض مشروعه بثقة", "Presents their project with confidence"),
    ],
    modules: [
      mod("m1", "مرحبًا بالأبطال", "Welcome, heroes", [
        lesson("l1", "ما هو المشروع؟", "What is a project?", 8, "video", true),
        lesson("l2", "اختر مهمتك", "Choose your mission", 10),
      ]),
      mod("m2", "الخطة والفريق", "Plan and team", [
        lesson("l3", "خريطة الخطوات", "The step map", 12),
        lesson("l4", "لعبة الأدوار", "The roles game", 15, "live"),
        lesson("l5", "اختبار سريع", "Quick quiz", 6, "quiz"),
      ]),
      mod("m3", "العرض الكبير", "The big show", [
        lesson("l6", "جهّز عرضك", "Prepare your show", 14),
        lesson("l7", "حفل الأبطال", "Heroes' showcase", 30, "live"),
      ]),
    ],
    mentorId: "m3",
    rating: 4.9,
    reviewCount: 142,
    learners: 1820,
    hours: 6,
    languages: ["ar"],
    featured: true,
    bestseller: true,
    ageRange: "6–9",
    prices: { recorded: 149, live: 249, blended: 299 },
    compareAt: { blended: 349 },
    liveDates: D.a,
    liveTitle: B("لقاء الأبطال", "Heroes meet-up"),
    liveDuration: 60,
    seats: 20,
    left: [6, 9, 14, 17],
  }),
  build({
    slug: "young-money-wizards",
    audience: "kids",
    level: "beginner",
    topic: "finance",
    title: B("سحرة المال الصغار", "Young Money Wizards"),
    subtitle: B("الادخار والميزانية والاختيار الذكي بطريقة ممتعة", "Saving, budgeting and smart choices, the fun way"),
    description: B(
      "يتعلم الطفل الفرق بين الحاجة والرغبة، ويبني ميزانية صغيرة، ويضع هدف ادخار حقيقيًا ويتابعه أسبوعًا بعد أسبوع.",
      "Children learn the difference between needs and wants, build a mini budget and set a real saving goal they follow week by week.",
    ),
    outcomes: [
      B("يفرّق بين الحاجة والرغبة", "Tells needs from wants"),
      B("يبني ميزانية بسيطة", "Builds a simple budget"),
      B("يحقق هدف ادخار صغيرًا", "Reaches a small saving goal"),
    ],
    modules: [
      mod("m1", "قيمة المال", "The value of money", [
        lesson("l1", "من أين يأتي المال؟", "Where does money come from?", 9, "video", true),
        lesson("l2", "حاجة أم رغبة؟", "Need or want?", 11),
      ]),
      mod("m2", "ادّخر مثل الأبطال", "Save like a hero", [
        lesson("l3", "حصّالة الأهداف", "The goal jar", 12),
        lesson("l4", "تحدّي الأسبوع", "The weekly challenge", 10, "quiz"),
      ]),
    ],
    mentorId: "m3",
    rating: 4.8,
    reviewCount: 97,
    learners: 1240,
    hours: 4,
    languages: ["ar"],
    isNew: true,
    ageRange: "8–12",
    prices: { recorded: 99, blended: 199 },
    liveDates: D.b,
    liveTitle: B("ورشة الميزانية", "Budget workshop"),
    liveDuration: 60,
    seats: 20,
    left: [3, 8, 12],
  }),
  build({
    slug: "mini-ceo-workshop",
    audience: "kids",
    level: "intermediate",
    topic: "entrepreneurship",
    title: B("المدير التنفيذي الصغير", "Mini CEO Workshop"),
    subtitle: B("من فكرة مشروع إلى بسطة حقيقية في أسبوعين", "From a business idea to a real stall in two weeks"),
    description: B(
      "ورشة مباشرة يبتكر فيها الأطفال منتجًا بسيطًا، ويحددون سعره، ويصمّمون شعارًا ويجرّبون البيع الفعلي.",
      "A live workshop where children invent a simple product, set its price, design a logo and try real selling.",
    ),
    outcomes: [
      B("يبتكر فكرة منتج", "Invents a product idea"),
      B("يحسب السعر والربح", "Works out price and profit"),
      B("يقدّم فكرته للآخرين", "Pitches the idea to others"),
    ],
    modules: [
      mod("m1", "الفكرة", "The idea", [lesson("l1", "ابحث عن مشكلة", "Find a problem", 20, "live", true), lesson("l2", "ابتكر منتجك", "Invent your product", 25, "live")]),
      mod("m2", "البيع", "Selling", [lesson("l3", "السعر والربح", "Price and profit", 25, "live"), lesson("l4", "يوم البيع", "Selling day", 40, "live")]),
    ],
    mentorId: "m4",
    rating: 4.7,
    reviewCount: 64,
    learners: 590,
    hours: 4,
    languages: ["ar"],
    ageRange: "10–12",
    prices: { live: 349 },
    liveDates: D.d,
    liveTitle: B("ورشة", "Workshop"),
    liveDuration: 90,
    seats: 15,
    left: [2, 5, 10],
  }),
  build({
    slug: "think-like-an-inventor",
    audience: "kids",
    level: "beginner",
    topic: "creativity",
    title: B("فكّر مثل المخترعين", "Think Like an Inventor"),
    subtitle: B("تمارين تفكير وإبداع تحوّل الأسئلة إلى اختراعات", "Thinking and creativity exercises that turn questions into inventions"),
    description: B(
      "دروس قصيرة مسجّلة تعلّم الأطفال طرح الأسئلة، وتجربة الحلول، والتعلّم من الأخطاء كما يفعل المخترعون.",
      "Short recorded lessons that teach children to ask questions, test solutions and learn from mistakes like inventors do.",
    ),
    outcomes: [B("يطرح أسئلة جيدة", "Asks good questions"), B("يجرّب ويطوّر أفكاره", "Tests and improves ideas")],
    modules: [
      mod("m1", "الفضول", "Curiosity", [lesson("l1", "لماذا؟ وكيف؟", "Why? And how?", 8, "video", true), lesson("l2", "دفتر الأفكار", "The idea notebook", 10)]),
      mod("m2", "التجربة", "Experimenting", [lesson("l3", "جرّب وأخطئ", "Try and fail", 12), lesson("l4", "عرض الاختراع", "Invention show", 10)]),
    ],
    mentorId: "m3",
    rating: 4.8,
    reviewCount: 88,
    learners: 960,
    hours: 3,
    languages: ["ar"],
    ageRange: "6–10",
    prices: { recorded: 0 },
  }),

  // ---------------- Youth ----------------
  build({
    slug: "career-launchpad",
    audience: "youth",
    level: "beginner",
    topic: "projects",
    title: B("منصة انطلاق المهنة: أساسيات المشاريع", "Career Launchpad: Project Basics"),
    subtitle: B("مهارة يطلبها كل صاحب عمل، تتعلمها قبل أول وظيفة", "A skill every employer wants, learned before your first job"),
    description: B(
      "تعرّف على لغة المشاريع: النطاق والجدول والميزانية والمخاطر، وطبّقها على مشروع تخرّج أو مبادرة طلابية، ثم اخرج بملف إنجاز يضيف إلى سيرتك الذاتية.",
      "Learn the language of projects: scope, schedule, budget and risk, apply it to a graduation project or student initiative, and leave with a portfolio piece for your CV.",
    ),
    outcomes: [
      B("يكتب نطاق مشروع واضح", "Writes a clear project scope"),
      B("يبني جدولًا زمنيًا واقعيًا", "Builds a realistic schedule"),
      B("يحدد المخاطر ويتعامل معها", "Spots and handles risks"),
      B("يعرض خطته أمام لجنة", "Presents a plan to a panel"),
    ],
    modules: [
      mod("m1", "الأساسيات", "The basics", [
        lesson("l1", "ما الذي يجعل المشروع مشروعًا؟", "What makes a project a project?", 12, "video", true),
        lesson("l2", "النطاق في صفحة واحدة", "Scope on one page", 18),
      ]),
      mod("m2", "الخطة", "The plan", [
        lesson("l3", "الجدول والمعالم", "Schedule and milestones", 20),
        lesson("l4", "الميزانية والمخاطر", "Budget and risk", 22),
        lesson("l5", "اختبار الوحدة", "Module quiz", 8, "quiz"),
      ]),
      mod("m3", "العرض", "The pitch", [lesson("l6", "جلسة تطبيق مباشرة", "Live practice session", 60, "live"), lesson("l7", "قالب ملف الإنجاز", "Portfolio template", 5, "resource")]),
    ],
    mentorId: "m1",
    rating: 4.8,
    reviewCount: 233,
    learners: 2750,
    hours: 9,
    languages: ["ar", "en"],
    featured: true,
    bestseller: true,
    ageRange: "16–24",
    cpdPoints: 6,
    prices: { recorded: 299, blended: 499 },
    compareAt: { recorded: 399 },
    liveDates: D.c,
    liveTitle: B("جلسة تطبيق", "Practice session"),
    liveDuration: 90,
    seats: 30,
    left: [11, 15, 19, 24],
  }),
  build({
    slug: "startup-sprint",
    audience: "youth",
    level: "intermediate",
    topic: "entrepreneurship",
    title: B("سباق الشركات الناشئة", "Startup Sprint"),
    subtitle: B("ابنِ نموذج عملك واختبر فكرتك خلال أربعة أسابيع", "Build your business model and test your idea in four weeks"),
    description: B(
      "برنامج مباشر مكثّف مع رائد أعمال: من تحديد المشكلة والعميل، إلى النموذج الأولي، إلى عرض أمام مستثمرين افتراضيين في اليوم الأخير.",
      "An intensive live programme with a founder: from defining the problem and customer to a prototype and a pitch to mock investors on the final day.",
    ),
    outcomes: [
      B("يحدد مشكلة حقيقية وعميلًا مستهدفًا", "Defines a real problem and target customer"),
      B("يبني نموذج عمل بسيط", "Builds a simple business model"),
      B("يختبر الفكرة مع مستخدمين", "Tests the idea with users"),
      B("يقدّم عرضًا مقنعًا", "Delivers a convincing pitch"),
    ],
    modules: [
      mod("m1", "المشكلة والعميل", "Problem and customer", [lesson("l1", "جلسة الانطلاق", "Kick-off session", 90, "live", true), lesson("l2", "مقابلات العملاء", "Customer interviews", 20)]),
      mod("m2", "النموذج", "The model", [lesson("l3", "لوحة نموذج العمل", "Business model canvas", 90, "live"), lesson("l4", "النموذج الأولي", "The prototype", 25)]),
      mod("m3", "العرض", "The pitch", [lesson("l5", "يوم المستثمرين", "Investor day", 120, "live")]),
    ],
    mentorId: "m4",
    rating: 4.7,
    reviewCount: 119,
    learners: 880,
    hours: 12,
    languages: ["ar", "en"],
    isNew: true,
    ageRange: "15–24",
    prices: { live: 799, blended: 899 },
    liveDates: D.e,
    liveTitle: B("أسبوع", "Week"),
    liveDuration: 120,
    seats: 24,
    left: [7, 10, 13],
  }),
  build({
    slug: "communicate-to-convince",
    audience: "youth",
    level: "beginner",
    topic: "communication",
    title: B("تواصل لتُقنع", "Communicate to Convince"),
    subtitle: B("الإلقاء والتأثير والتفاوض للطلاب والخريجين الجدد", "Presenting, influence and negotiation for students and new graduates"),
    description: B(
      "تدريب عملي على بناء الرسالة، وإدارة التوتر، والإجابة عن الأسئلة الصعبة، مع تغذية راجعة على تسجيلات إلقائك.",
      "Hands-on practice in building a message, managing nerves and answering tough questions, with feedback on recordings of your delivery.",
    ),
    outcomes: [B("يبني رسالة واضحة", "Builds a clear message"), B("يتحكم في التوتر", "Manages nerves"), B("يتفاوض بثقة", "Negotiates with confidence")],
    modules: [
      mod("m1", "الرسالة", "The message", [lesson("l1", "قاعدة الثلاث نقاط", "The rule of three", 12, "video", true), lesson("l2", "القصة تقنع", "Stories persuade", 15)]),
      mod("m2", "الأداء", "The delivery", [lesson("l3", "الصوت ولغة الجسد", "Voice and body language", 18), lesson("l4", "جلسة إلقاء حيّة", "Live delivery session", 75, "live")]),
    ],
    mentorId: "m5",
    rating: 4.8,
    reviewCount: 176,
    learners: 1970,
    hours: 6,
    languages: ["ar", "en"],
    bestseller: true,
    ageRange: "14–24",
    prices: { recorded: 249, blended: 399 },
    liveDates: D.b,
    liveTitle: B("جلسة إلقاء", "Delivery session"),
    liveDuration: 75,
    seats: 20,
    left: [5, 9, 12],
  }),
  build({
    slug: "digital-leaders",
    audience: "youth",
    level: "intermediate",
    topic: "technology",
    title: B("قادة العصر الرقمي", "Digital Leaders"),
    subtitle: B("الذكاء الاصطناعي والأدوات الرقمية لقيادة الفرق والمبادرات", "AI and digital tools for leading teams and initiatives"),
    description: B(
      "تعلّم كيف تستخدم أدوات الذكاء الاصطناعي لتنظيم المهام وكتابة التقارير وتحليل الأفكار، مع وعي بأخلاقيات الاستخدام.",
      "Learn how to use AI tools to organise tasks, write reports and analyse ideas, with an awareness of responsible use.",
    ),
    outcomes: [B("يستخدم الذكاء الاصطناعي لتنظيم العمل", "Uses AI to organise work"), B("يتحقق من جودة المخرجات", "Checks the quality of outputs")],
    modules: [
      mod("m1", "الأدوات", "The tools", [lesson("l1", "خريطة الأدوات", "Tool map", 14, "video", true), lesson("l2", "اكتب أوامر فعّالة", "Write effective prompts", 18)]),
      mod("m2", "التطبيق", "Application", [lesson("l3", "مشروع تطبيقي", "Applied project", 30), lesson("l4", "المسؤولية والأخلاقيات", "Responsible use", 12, "quiz")]),
    ],
    mentorId: "m6",
    rating: 4.6,
    reviewCount: 81,
    learners: 740,
    hours: 5,
    languages: ["ar", "en"],
    isNew: true,
    ageRange: "16–24",
    prices: { recorded: 349 },
  }),

  // ---------------- Experts ----------------
  build({
    slug: "strategic-programme-leadership",
    audience: "experts",
    level: "advanced",
    topic: "projects",
    title: B("قيادة البرامج الاستراتيجية", "Strategic Programme Leadership"),
    subtitle: B("اربط الاستراتيجية بالتنفيذ وقد برنامجًا متعدد المشاريع", "Link strategy to delivery and steer a multi-project programme"),
    description: B(
      "برنامج متقدم لمديري المشاريع والبرامج: تصميم البرنامج، وإدارة المنافع والتبعيات، وحوكمة أصحاب المصلحة، مع دراسات حالة من مشاريع كبرى.",
      "An advanced programme for project and programme managers: programme design, benefits and dependency management and stakeholder governance, with case studies from major projects.",
    ),
    outcomes: [
      B("يصمّم هيكل البرنامج وحوكمته", "Designs programme structure and governance"),
      B("يدير المنافع والتبعيات", "Manages benefits and dependencies"),
      B("يقود أصحاب المصلحة ويحلّ التعارضات", "Leads stakeholders and resolves conflicts"),
      B("يقيس النجاح ويرفع التقارير للإدارة العليا", "Measures success and reports to executives"),
    ],
    modules: [
      mod("m1", "تصميم البرنامج", "Programme design", [lesson("l1", "من الاستراتيجية إلى البرنامج", "From strategy to programme", 25, "video", true), lesson("l2", "هيكل الحوكمة", "Governance structure", 30)]),
      mod("m2", "المنافع والتبعيات", "Benefits and dependencies", [lesson("l3", "خريطة المنافع", "Benefits map", 28), lesson("l4", "إدارة التبعيات", "Dependency management", 26), lesson("l5", "ورشة حالة مباشرة", "Live case workshop", 120, "live")]),
      mod("m3", "القيادة والتقارير", "Leadership and reporting", [lesson("l6", "أصحاب المصلحة", "Stakeholders", 30), lesson("l7", "تقارير الإدارة العليا", "Executive reporting", 25), lesson("l8", "الاختبار النهائي", "Final assessment", 40, "quiz")]),
    ],
    mentorId: "m1",
    rating: 4.9,
    reviewCount: 187,
    learners: 1450,
    hours: 24,
    languages: ["ar", "en"],
    featured: true,
    bestseller: true,
    cpdPoints: 24,
    prices: { recorded: 1450, blended: 2250 },
    compareAt: { blended: 2650 },
    liveDates: D.c,
    liveTitle: B("ورشة حالة", "Case workshop"),
    liveDuration: 120,
    seats: 30,
    left: [8, 12, 16, 22],
  }),
  build({
    slug: "risk-management-in-practice",
    audience: "experts",
    level: "intermediate",
    topic: "projects",
    title: B("إدارة المخاطر عمليًا", "Risk Management in Practice"),
    subtitle: B("من سجل المخاطر إلى قرارات تحمي الجدول والميزانية", "From the risk register to decisions that protect schedule and budget"),
    description: B(
      "تطبيق عملي لتحديد المخاطر وتحليلها والاستجابة لها، مع قوالب جاهزة وسيناريوهات من مشاريع حقيقية.",
      "Practical identification, analysis and response to risk, with ready templates and scenarios from real projects.",
    ),
    outcomes: [B("يبني سجل مخاطر فعّالًا", "Builds an effective risk register"), B("يحلل المخاطر كميًا ونوعيًا", "Analyses risk qualitatively and quantitatively"), B("يحدد خطط الاستجابة", "Defines response plans")],
    modules: [
      mod("m1", "تحديد المخاطر", "Identifying risks", [lesson("l1", "أين تختبئ المخاطر؟", "Where risks hide", 20, "video", true), lesson("l2", "سجل المخاطر", "The risk register", 24)]),
      mod("m2", "التحليل والاستجابة", "Analysis and response", [lesson("l3", "التحليل النوعي والكمي", "Qualitative and quantitative", 30), lesson("l4", "خطط الاستجابة", "Response plans", 25), lesson("l5", "جلسة أسئلة مباشرة", "Live Q&A", 60, "live")]),
    ],
    mentorId: "m2",
    rating: 4.8,
    reviewCount: 154,
    learners: 1320,
    hours: 14,
    languages: ["ar", "en"],
    cpdPoints: 14,
    prices: { recorded: 890, blended: 1290 },
    liveDates: D.b,
    liveTitle: B("جلسة أسئلة", "Q&A session"),
    liveDuration: 60,
    seats: 30,
    left: [14, 18, 22],
  }),
  build({
    slug: "ai-for-project-professionals",
    audience: "experts",
    level: "intermediate",
    topic: "technology",
    title: B("الذكاء الاصطناعي للمحترفين في إدارة المشاريع", "AI for Project Professionals"),
    subtitle: B("وفّر ساعات أسبوعيًا في التخطيط والتقارير وتحليل المخاطر", "Save hours every week on planning, reporting and risk analysis"),
    description: B(
      "جلسات مباشرة تطبيقية على سيناريوهات من عملك: التخطيط، ومحاضر الاجتماعات، والتقارير، وتحليل البيانات، مع ضوابط الخصوصية والجودة.",
      "Hands-on live sessions on scenarios from your own work: planning, meeting notes, reports and data analysis, with privacy and quality guardrails.",
    ),
    outcomes: [B("يؤتمت المهام المتكررة", "Automates repetitive tasks"), B("ينتج تقارير أسرع وأدق", "Produces faster, sharper reports"), B("يطبّق ضوابط الخصوصية", "Applies privacy guardrails")],
    modules: [
      mod("m1", "الأساسيات", "Foundations", [lesson("l1", "الذكاء الاصطناعي في بيئة العمل", "AI in the workplace", 90, "live", true)]),
      mod("m2", "التطبيق", "Applications", [lesson("l2", "التخطيط والتقارير", "Planning and reporting", 90, "live"), lesson("l3", "تحليل المخاطر والبيانات", "Risk and data analysis", 90, "live")]),
    ],
    mentorId: "m6",
    rating: 4.7,
    reviewCount: 73,
    learners: 540,
    hours: 6,
    languages: ["ar", "en"],
    isNew: true,
    cpdPoints: 6,
    prices: { live: 1190 },
    liveDates: D.e,
    liveTitle: B("جلسة تطبيقية", "Hands-on session"),
    liveDuration: 90,
    seats: 25,
    left: [4, 9, 11],
  }),
  build({
    slug: "pmo-design-masterclass",
    audience: "experts",
    level: "advanced",
    topic: "leadership",
    title: B("ماستر كلاس تصميم مكتب إدارة المشاريع", "PMO Design Masterclass"),
    subtitle: B("صمّم مكتبًا يضيف قيمة للإدارة العليا ولا يكتفي بالتقارير", "Design an office that adds value for executives, not just reports"),
    description: B(
      "جلسة مكثّفة لقادة المكاتب: نماذج التشغيل، والحوكمة، والمؤشرات، وكيف تقنع الإدارة بقيمة المكتب.",
      "An intensive session for PMO leaders: operating models, governance, metrics and how to prove the office's value to executives.",
    ),
    outcomes: [B("يختار نموذج المكتب المناسب", "Chooses the right PMO model"), B("يصمّم مؤشرات أداء ذات معنى", "Designs meaningful metrics")],
    modules: [mod("m1", "نماذج المكتب", "PMO models", [lesson("l1", "المحاضرة المباشرة", "Live masterclass", 180, "live", true)])],
    mentorId: "m1",
    rating: 4.9,
    reviewCount: 58,
    learners: 310,
    hours: 3,
    languages: ["ar", "en"],
    cpdPoints: 3,
    prices: { live: 650 },
    liveDates: ["2026-11-18T14:00:00Z"],
    liveTitle: B("الماستر كلاس", "Masterclass"),
    liveDuration: 180,
    seats: 40,
    left: [9],
  }),
  build({
    slug: "negotiation-for-leaders",
    audience: "experts",
    level: "intermediate",
    topic: "communication",
    title: B("التفاوض للقادة", "Negotiation for Leaders"),
    subtitle: B("اتفاقات أفضل مع الموردين والشركاء والفرق الداخلية", "Better agreements with suppliers, partners and internal teams"),
    description: B(
      "أدوات تفاوض عملية مع تمارين لعب أدوار وتحليل لحالات واقعية.",
      "Practical negotiation tools with role-play exercises and analysis of real cases.",
    ),
    outcomes: [B("يحضّر للتفاوض باحتراف", "Prepares for negotiation professionally"), B("يخلق قيمة لجميع الأطراف", "Creates value for all parties")],
    modules: [
      mod("m1", "الاستعداد", "Preparation", [lesson("l1", "خريطة المصالح", "Interest map", 20, "video", true), lesson("l2", "البدائل والحدود", "Alternatives and limits", 22)]),
      mod("m2", "الطاولة", "At the table", [lesson("l3", "تكتيكات الطاولة", "Table tactics", 25), lesson("l4", "لعب أدوار مباشر", "Live role-play", 90, "live")]),
    ],
    mentorId: "m5",
    rating: 4.8,
    reviewCount: 102,
    learners: 860,
    hours: 8,
    languages: ["ar", "en"],
    cpdPoints: 8,
    prices: { recorded: 690, blended: 990 },
    liveDates: D.d,
    liveTitle: B("لعب أدوار", "Role-play"),
    liveDuration: 90,
    seats: 20,
    left: [6, 10, 14],
  }),
];

export const REVIEWS: Review[] = [
  {
    id: "r1",
    courseSlug: "little-project-heroes",
    author: "أم سلمان",
    rating: 5,
    comment: B("ابني كان متحمسًا لكل جلسة، وصار يخطط ألعابه وواجباته بنفسه.", "My son was excited for every session and now plans his games and homework himself."),
    createdAt: "2026-10-02T09:00:00Z",
    mentorReply: B("يسعدنا ذلك! أبطالنا الصغار رائعون.", "We are delighted! Our little heroes are wonderful."),
  },
  {
    id: "r2",
    courseSlug: "little-project-heroes",
    author: "والد ريماس",
    rating: 5,
    comment: B("محتوى ممتع ومرتب، والمرشدة تتفاعل مع الأطفال بأسلوب جميل.", "Fun, well-organised content and the mentor interacts with children beautifully."),
    createdAt: "2026-09-21T09:00:00Z",
  },
  {
    id: "r3",
    courseSlug: "career-launchpad",
    author: "عبدالله م.",
    rating: 5,
    comment: B("أضفت ملف الإنجاز إلى سيرتي الذاتية وحصلت على مقابلة تدريب خلال أسبوعين.", "I added the portfolio piece to my CV and landed an internship interview within two weeks."),
    createdAt: "2026-10-10T09:00:00Z",
  },
  {
    id: "r4",
    courseSlug: "career-launchpad",
    author: "Sara K.",
    rating: 4,
    comment: B("شرح واضح وتطبيق عملي، وأتمنى المزيد من القوالب.", "Clear explanations and practical work; I would love more templates."),
    createdAt: "2026-09-30T09:00:00Z",
  },
  {
    id: "r5",
    courseSlug: "strategic-programme-leadership",
    author: "م. سلطان",
    rating: 5,
    comment: B("حالات حقيقية وتطبيق مباشر على برنامجنا. أفضل دورة حضرتها هذا العام.", "Real cases applied directly to our programme. The best course I took this year."),
    createdAt: "2026-10-12T09:00:00Z",
    mentorReply: B("شكرًا لمشاركتك الغنية في الورشة.", "Thank you for your rich contribution in the workshop."),
  },
  {
    id: "r6",
    courseSlug: "strategic-programme-leadership",
    author: "Hassan A.",
    rating: 5,
    comment: B("الجلسات المباشرة أضافت قيمة كبيرة فوق الدروس المسجّلة.", "The live sessions added great value on top of the recorded lessons."),
    createdAt: "2026-10-05T09:00:00Z",
  },
  {
    id: "r7",
    courseSlug: "risk-management-in-practice",
    author: "ن. القحطاني",
    rating: 5,
    comment: B("القوالب وفّرت علينا أسابيع من العمل على سجل المخاطر.", "The templates saved us weeks of work on our risk register."),
    createdAt: "2026-10-08T09:00:00Z",
  },
  {
    id: "r8",
    courseSlug: "startup-sprint",
    author: "ريان",
    rating: 5,
    comment: B("أربعة أسابيع غيّرت طريقة تفكيري في الفكرة والعميل.", "Four weeks that changed how I think about ideas and customers."),
    createdAt: "2026-10-14T09:00:00Z",
  },
];

export const TESTIMONIALS = REVIEWS.filter((r) => r.rating === 5).slice(0, 3);

export const DEMO_USER = { email: "learner@demo.sa", password: "Demo@1234", fullName: "متعلم تجريبي" };

/** Demo logins for mock mode. One login screen, the roles decide which interfaces open. */
export const DEMO_ACCOUNTS = [
  { key: "demo", email: "learner@demo.sa", password: "Demo@1234", fullName: "متعلم تجريبي", roles: ["learner"] as ("learner" | "mentor" | "admin")[] },
  { key: "mentor", email: "mentor@demo.sa", password: "Mentor@1234", fullName: "د. ليلى الحربي", roles: ["learner", "mentor"] as ("learner" | "mentor" | "admin")[] },
  { key: "admin", email: "admin@demo.sa", password: "Admin@1234", fullName: "مدير النظام", roles: ["learner", "admin"] as ("learner" | "mentor" | "admin")[] },
];
