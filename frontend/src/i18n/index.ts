import { I18nManager } from 'react-native';
import { useSyncExternalStore } from 'react';

type Lang = 'en' | 'ar';

const dict = {
  en: {
    'app.name': 'SPP',
    'app.tagline': 'AI Operating System for Real Estate',

    // Navigation
    'nav.home': 'Home', 'nav.portfolio': 'Portfolio', 'nav.brain': 'Brain', 'nav.insights': 'Insights',
    'nav.hub': 'Hub',

    // Home
    'home.brief.eyebrow': 'Morning brief',
    'home.brief.title': 'Priorities',
    'home.brief.sub': 'Ranked by projected impact',
    'home.priorities.title': "Today's priorities",
    'home.priorities.sub': 'Ranked by projected impact',
    'home.brainCard.title': 'Ask the Unified Brain',
    'home.brainCard.example': '"Should I renew Marcus Reed at 4%?"',
    'home.quicknav.sensors': 'Sensors',
    'home.quicknav.health': 'Health',
    'home.quicknav.hub': 'SPP Hub',
    'home.footer': 'SPP · your AI executive, always working',
    'home.subhead': "I've reviewed your portfolio overnight. Here is what matters today.",

    // Brain / Chat
    'brain.title': 'Unified Brain', 'brain.subtitle': 'Ask me anything about your portfolio.',
    'brain.placeholder': 'Ask the Brain…', 'brain.suggest': 'Suggested',
    'brain.empty.title': 'Unified Brain',
    'brain.empty.body': 'I remember every property, every decision, every signal. Ask me anything.',
    'brain.q1': 'Which properties need attention?',
    'brain.q2': 'Should I renew Marcus Reed at 4%?',
    'brain.q3': 'What is my portfolio yield vs market?',
    'brain.q4': 'Summarize this week for me.',
    'brain.thinking': 'Thinking',

    // Portfolio
    'portfolio.title': 'Portfolio', 'portfolio.sub': 'Your properties, ranked by health.',
    'portfolio.filter.all': 'All', 'portfolio.filter.attention': 'Attention', 'portfolio.filter.stable': 'Stable',

    // Insights
    'insights.title': 'Insights', 'insights.sub': 'Signals worth your time.',
    'insights.kpi.annualized': 'Annualized revenue',
    'insights.revenueByProp': 'Revenue by property · monthly',
    'insights.aiActivity': 'AI activity · today',
    'insights.occupancy': 'Occupancy',
    'insights.signals': 'Signals',

    // Property detail
    'property.overview': 'Overview', 'property.sensors': 'Sensors', 'property.timeline': 'Timeline',
    'property.ai': 'AI summary',
    'property.kind': 'Kind',

    // Maintenance
    'maintenance.title': 'Predictive Maintenance',
    'maintenance.sub': 'Interventions before failure.',
    'maintenance.explain': 'SPP watches every sensor and every service log. Interventions are proposed before a failure, not after.',
    'maintenance.upcoming': 'Upcoming interventions',
    'maintenance.empty.title': 'Your properties are calm.',
    'maintenance.empty.body': "You'll see interventions here well before any failure.",

    // Health
    'health.title': 'Property Health',
    'health.sub': 'Composite score across your portfolio.',
    'health.excellent': 'Your portfolio is in world-class condition.',
    'health.stable': 'Stable overall. A few items need attention.',
    'health.attention': 'Attention required across multiple properties.',
    'health.ranked': 'Ranked by health',

    // Sensors
    'sensors.title': 'Virtual Sensors',
    'sensors.sub': 'Silent signals across every property.',
    'sensors.filter.all': 'All',
    'sensors.filter.attention': 'Attention',
    'sensors.filter.nominal': 'Nominal',
    'sensors.empty.title': 'No sensors match this filter.',

    // Notifications
    'notif.title': 'Notifications',
    'notif.sub': 'Only what needs you.',
    'notif.empty.title': "You're all caught up.",
    'notif.empty.body': "SPP only surfaces what matters. You'll see something here when it does.",

    // Settings
    'settings.title': 'Settings', 'settings.sub': 'Tune your AI executive.',
    'settings.language': 'Language', 'settings.appearance': 'Appearance', 'settings.brain': 'Brain',
    'settings.about': 'About',

    // Onboarding
    'onboarding.slide1.title': 'Meet your AI executive',
    'onboarding.slide1.body': 'Not another dashboard. A calm senior advisor that watches every property, every day.',
    'onboarding.slide2.title': 'Decisions, not data',
    'onboarding.slide2.body': 'Every morning, one clear list of what to do next — ranked by projected impact.',
    'onboarding.slide3.title': 'Talk to your portfolio',
    'onboarding.slide3.body': 'Ask the Unified Brain anything. It remembers every property.',
    'onboarding.cta': 'Enter SPP',
    'onboarding.continue': 'Continue',

    // Hub
    'hub.title': 'SPP Platform',
    'hub.sub': 'Every surface of your AI operating system.',
    'hub.section.ai': 'Intelligence',
    'hub.section.assets': 'Assets & people',
    'hub.section.ops': 'Operations',
    'hub.section.grow': 'Learn & grow',
    'hub.tile.brain': 'Unified Brain', 'hub.tile.brain.sub': 'Ask, decide, act.',
    'hub.tile.decisions': 'AI Decisions', 'hub.tile.decisions.sub': "Today's ranked priorities.",
    'hub.tile.health': 'Property Health', 'hub.tile.health.sub': 'Composite portfolio score.',
    'hub.tile.maintenance': 'Predictive Maintenance', 'hub.tile.maintenance.sub': 'Before failure, not after.',
    'hub.tile.sensors': 'Virtual Sensors', 'hub.tile.sensors.sub': 'Silent signals everywhere.',
    'hub.tile.portfolio': 'Portfolio', 'hub.tile.portfolio.sub': 'Every property, every unit.',
    'hub.tile.tenants': 'Tenants', 'hub.tile.tenants.sub': 'Reliability & relationships.',
    'hub.tile.contracts': 'Contracts', 'hub.tile.contracts.sub': 'Renewals & lifecycle.',
    'hub.tile.reports': 'Smart Reports', 'hub.tile.reports.sub': 'AI-authored analysis.',
    'hub.tile.notifications': 'Notifications', 'hub.tile.notifications.sub': 'Only what matters.',
    'hub.tile.knowledge': 'Knowledge Center', 'hub.tile.knowledge.sub': 'How SPP thinks.',
    'hub.tile.guides': 'DIY & Video Guides', 'hub.tile.guides.sub': 'Install and integrate.',
    'hub.tile.owner': 'Owner Profile', 'hub.tile.owner.sub': 'Your portfolio identity.',
    'hub.tile.settings': 'Settings', 'hub.tile.settings.sub': 'Tune your executive.',

    // Reports
    'reports.title': 'Smart Reports', 'reports.sub': 'AI-authored analysis of your portfolio.',
    'reports.pages': 'pages',

    // Knowledge
    'knowledge.title': 'Knowledge Center', 'knowledge.sub': 'Understand how SPP thinks.',
    'knowledge.minRead': 'min read',

    // Guides
    'guides.title': 'DIY & Video Guides', 'guides.sub': 'Install, integrate, master.',
    'guides.chapters': 'chapters',

    // Tenants
    'tenants.title': 'Tenants', 'tenants.sub': 'Reliability, tenure and relationship signals.',
    'tenants.since': 'Since',
    'tenants.rent': 'Monthly rent',
    'tenants.reliability': 'Reliability',

    // Contracts
    'contracts.title': 'Contracts', 'contracts.sub': 'Lifecycle and renewal windows.',
    'contracts.status.active': 'Active',
    'contracts.status.expiring': 'Expiring',
    'contracts.status.renewed': 'Renewed',

    // Owner
    'owner.title': 'Owner Profile', 'owner.sub': 'Your portfolio identity.',
    'owner.value': 'Portfolio value',
    'owner.properties': 'Properties',
  },
  ar: {
    'app.name': 'SPP',
    'app.tagline': 'نظام تشغيل بالذكاء الاصطناعي للعقارات',

    'nav.home': 'الرئيسية', 'nav.portfolio': 'المحفظة', 'nav.brain': 'الدماغ', 'nav.insights': 'الرؤى',
    'nav.hub': 'المركز',

    'home.brief.eyebrow': 'ملخص الصباح',
    'home.brief.title': 'الأولويات',
    'home.brief.sub': 'مرتبة حسب الأثر المتوقع',
    'home.priorities.title': 'أولويات اليوم',
    'home.priorities.sub': 'مرتبة حسب الأثر المتوقع',
    'home.brainCard.title': 'اسأل الدماغ الموحد',
    'home.brainCard.example': '«هل أجدد ماركوس بزيادة ٤٪؟»',
    'home.quicknav.sensors': 'المستشعرات',
    'home.quicknav.health': 'الحالة',
    'home.quicknav.hub': 'مركز SPP',
    'home.footer': 'SPP · مديرك التنفيذي الذكي، يعمل دومًا',
    'home.subhead': 'راجعت محفظتك ليلًا. هذا ما يهم اليوم.',

    'brain.title': 'الدماغ الموحد', 'brain.subtitle': 'اسألني أي شيء عن محفظتك.',
    'brain.placeholder': 'اسأل الدماغ…', 'brain.suggest': 'مقترحات',
    'brain.empty.title': 'الدماغ الموحد',
    'brain.empty.body': 'أتذكر كل عقار، وكل قرار، وكل إشارة. اسألني أي شيء.',
    'brain.q1': 'أي العقارات تحتاج انتباه؟',
    'brain.q2': 'هل أجدد عقد ماركوس بزيادة ٤٪؟',
    'brain.q3': 'ما عائد محفظتي مقارنة بالسوق؟',
    'brain.q4': 'لخص لي هذا الأسبوع.',
    'brain.thinking': 'أفكر',

    'portfolio.title': 'المحفظة', 'portfolio.sub': 'عقاراتك، مرتبة حسب الحالة.',
    'portfolio.filter.all': 'الكل', 'portfolio.filter.attention': 'تحتاج انتباه', 'portfolio.filter.stable': 'مستقرة',

    'insights.title': 'الرؤى', 'insights.sub': 'إشارات تستحق وقتك.',
    'insights.kpi.annualized': 'الإيراد السنوي',
    'insights.revenueByProp': 'الإيراد حسب العقار · شهريًا',
    'insights.aiActivity': 'نشاط الذكاء اليوم',
    'insights.occupancy': 'الإشغال',
    'insights.signals': 'إشارات',

    'property.overview': 'نظرة عامة', 'property.sensors': 'المستشعرات', 'property.timeline': 'الجدول الزمني',
    'property.ai': 'ملخص الذكاء',
    'property.kind': 'النوع',

    'maintenance.title': 'الصيانة التنبؤية',
    'maintenance.sub': 'تدخلات قبل الأعطال.',
    'maintenance.explain': 'يراقب SPP كل مستشعر وكل سجل خدمة. يُقترح التدخل قبل حدوث العطل، لا بعده.',
    'maintenance.upcoming': 'التدخلات القادمة',
    'maintenance.empty.title': 'عقاراتك مستقرة.',
    'maintenance.empty.body': 'ستظهر التدخلات هنا قبل أي عطل بوقت كافٍ.',

    'health.title': 'صحة العقارات',
    'health.sub': 'نتيجة مركبة عبر محفظتك.',
    'health.excellent': 'محفظتك في حالة ممتازة.',
    'health.stable': 'مستقرة عمومًا. بعض العناصر تحتاج انتباه.',
    'health.attention': 'الانتباه مطلوب في عدة عقارات.',
    'health.ranked': 'مرتبة حسب الحالة',

    'sensors.title': 'المستشعرات الافتراضية',
    'sensors.sub': 'إشارات صامتة في كل عقار.',
    'sensors.filter.all': 'الكل',
    'sensors.filter.attention': 'تحتاج انتباه',
    'sensors.filter.nominal': 'طبيعية',
    'sensors.empty.title': 'لا مستشعرات تطابق هذا المرشح.',

    'notif.title': 'الإشعارات',
    'notif.sub': 'فقط ما يهمك.',
    'notif.empty.title': 'كل شيء تحت السيطرة.',
    'notif.empty.body': 'يعرض SPP فقط ما يستحق. سترى شيئًا هنا عندما يستحق.',

    'settings.title': 'الإعدادات', 'settings.sub': 'اضبط مديرك التنفيذي.',
    'settings.language': 'اللغة', 'settings.appearance': 'المظهر', 'settings.brain': 'الدماغ',
    'settings.about': 'حول',

    'onboarding.slide1.title': 'تعرّف على مديرك التنفيذي الذكي',
    'onboarding.slide1.body': 'ليست لوحة تحكم جديدة. مستشار كبير هادئ يراقب كل عقار كل يوم.',
    'onboarding.slide2.title': 'قرارات، لا بيانات',
    'onboarding.slide2.body': 'كل صباح، قائمة واضحة بما يجب فعله — مرتبة حسب الأثر.',
    'onboarding.slide3.title': 'تحدث إلى محفظتك',
    'onboarding.slide3.body': 'اسأل الدماغ الموحد أي شيء. يتذكر كل عقار.',
    'onboarding.cta': 'ابدأ SPP',
    'onboarding.continue': 'التالي',

    'hub.title': 'منصة SPP',
    'hub.sub': 'كل سطح من نظام تشغيلك الذكي.',
    'hub.section.ai': 'الذكاء',
    'hub.section.assets': 'الأصول والأشخاص',
    'hub.section.ops': 'العمليات',
    'hub.section.grow': 'التعلم والنمو',
    'hub.tile.brain': 'الدماغ الموحد', 'hub.tile.brain.sub': 'اسأل، قرّر، نفّذ.',
    'hub.tile.decisions': 'قرارات الذكاء', 'hub.tile.decisions.sub': 'أولويات اليوم.',
    'hub.tile.health': 'صحة العقارات', 'hub.tile.health.sub': 'النتيجة المركبة.',
    'hub.tile.maintenance': 'الصيانة التنبؤية', 'hub.tile.maintenance.sub': 'قبل العطل، لا بعده.',
    'hub.tile.sensors': 'المستشعرات', 'hub.tile.sensors.sub': 'إشارات صامتة في كل مكان.',
    'hub.tile.portfolio': 'المحفظة', 'hub.tile.portfolio.sub': 'كل عقار ووحدة.',
    'hub.tile.tenants': 'المستأجرون', 'hub.tile.tenants.sub': 'الموثوقية والعلاقات.',
    'hub.tile.contracts': 'العقود', 'hub.tile.contracts.sub': 'التجديدات والدورة.',
    'hub.tile.reports': 'التقارير الذكية', 'hub.tile.reports.sub': 'تحليل بالذكاء الاصطناعي.',
    'hub.tile.notifications': 'الإشعارات', 'hub.tile.notifications.sub': 'فقط ما يهم.',
    'hub.tile.knowledge': 'مركز المعرفة', 'hub.tile.knowledge.sub': 'كيف يفكر SPP.',
    'hub.tile.guides': 'أدلة الفيديو', 'hub.tile.guides.sub': 'ثبّت وتكامل.',
    'hub.tile.owner': 'ملف المالك', 'hub.tile.owner.sub': 'هوية محفظتك.',
    'hub.tile.settings': 'الإعدادات', 'hub.tile.settings.sub': 'اضبط مديرك.',

    'reports.title': 'التقارير الذكية', 'reports.sub': 'تحليل محفظتك بواسطة الذكاء الاصطناعي.',
    'reports.pages': 'صفحة',

    'knowledge.title': 'مركز المعرفة', 'knowledge.sub': 'افهم كيف يفكر SPP.',
    'knowledge.minRead': 'دقيقة قراءة',

    'guides.title': 'أدلة الفيديو والتركيب', 'guides.sub': 'ثبّت، تكامل، أتقن.',
    'guides.chapters': 'فصول',

    'tenants.title': 'المستأجرون', 'tenants.sub': 'الموثوقية والمدة وإشارات العلاقة.',
    'tenants.since': 'منذ',
    'tenants.rent': 'الإيجار الشهري',
    'tenants.reliability': 'الموثوقية',

    'contracts.title': 'العقود', 'contracts.sub': 'الدورة ونوافذ التجديد.',
    'contracts.status.active': 'نشط',
    'contracts.status.expiring': 'ينتهي',
    'contracts.status.renewed': 'مجدد',

    'owner.title': 'ملف المالك', 'owner.sub': 'هوية محفظتك.',
    'owner.value': 'قيمة المحفظة',
    'owner.properties': 'العقارات',
  },
} as const;

type Key = keyof typeof dict['en'];

let currentLang: Lang = 'en';
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => currentLang;

export function setLang(l: Lang) {
  currentLang = l;
  const wantRTL = l === 'ar';
  if (I18nManager.isRTL !== wantRTL) {
    I18nManager.allowRTL(wantRTL);
    I18nManager.forceRTL(wantRTL);
  }
  listeners.forEach((fn) => fn());
}

export function useI18n() {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const t = (k: Key): string => (dict[lang] as any)[k] ?? (dict.en as any)[k] ?? k;
  const isRTL = lang === 'ar';
  return { t, lang, isRTL, setLang };
}
