import { I18nManager } from 'react-native';
import { useSyncExternalStore } from 'react';

type Lang = 'en' | 'ar';

const dict = {
  en: {
    'app.name': 'SPP',
    'nav.home': 'Home', 'nav.portfolio': 'Portfolio', 'nav.brain': 'Brain', 'nav.insights': 'Insights',
    'brain.title': 'Unified Brain', 'brain.subtitle': 'Ask me anything about your portfolio.',
    'brain.placeholder': 'Ask the Brain…', 'brain.suggest': 'Suggested',
    'brain.q1': 'Which properties need attention?', 'brain.q2': 'Should I renew Marcus Reed at 4%?',
    'brain.q3': 'What is my portfolio yield vs market?', 'brain.q4': 'Summarize this week for me.',
    'portfolio.title': 'Portfolio', 'portfolio.sub': 'Your properties, ranked by health.',
    'portfolio.filter.all': 'All', 'portfolio.filter.attention': 'Attention', 'portfolio.filter.stable': 'Stable',
    'insights.title': 'Insights', 'insights.sub': 'Signals worth your time.',
    'property.overview': 'Overview', 'property.sensors': 'Sensors', 'property.timeline': 'Timeline',
    'maintenance.title': 'Predictive Maintenance', 'maintenance.sub': 'Interventions before failure.',
    'health.title': 'Property Health', 'health.sub': 'Composite score across your portfolio.',
    'sensors.title': 'Virtual Sensors', 'sensors.sub': 'Silent signals across every property.',
    'notif.title': 'Notifications', 'notif.sub': 'Only what needs you.',
    'settings.title': 'Settings', 'settings.sub': 'Tune your AI Employee.',
    'settings.language': 'Language', 'settings.appearance': 'Appearance', 'settings.brain': 'Brain',
    'onboarding.slide1.title': 'Meet your AI Employee', 'onboarding.slide1.body': 'Not another dashboard. A calm advisor that watches every property, every day.',
    'onboarding.slide2.title': 'Decisions, not data', 'onboarding.slide2.body': 'Every morning, one clear list of what to do next — ranked by projected impact.',
    'onboarding.slide3.title': 'Talk to your portfolio', 'onboarding.slide3.body': 'Ask the Unified Brain anything. It remembers every property.',
    'onboarding.cta': 'Enter SPP',
  },
  ar: {
    'app.name': 'SPP',
    'nav.home': 'الرئيسية', 'nav.portfolio': 'المحفظة', 'nav.brain': 'الدماغ', 'nav.insights': 'الرؤى',
    'brain.title': 'الدماغ الموحد', 'brain.subtitle': 'اسألني أي شيء عن محفظتك.',
    'brain.placeholder': 'اسأل الدماغ…', 'brain.suggest': 'مقترحات',
    'brain.q1': 'أي العقارات تحتاج انتباه؟', 'brain.q2': 'هل أجدد عقد ماركوس بزيادة ٤٪؟',
    'brain.q3': 'ما عائد محفظتي مقارنة بالسوق؟', 'brain.q4': 'لخص لي هذا الأسبوع.',
    'portfolio.title': 'المحفظة', 'portfolio.sub': 'عقاراتك، مرتبة حسب الحالة.',
    'portfolio.filter.all': 'الكل', 'portfolio.filter.attention': 'تحتاج انتباه', 'portfolio.filter.stable': 'مستقرة',
    'insights.title': 'الرؤى', 'insights.sub': 'إشارات تستحق وقتك.',
    'property.overview': 'نظرة عامة', 'property.sensors': 'المستشعرات', 'property.timeline': 'الجدول الزمني',
    'maintenance.title': 'الصيانة التنبؤية', 'maintenance.sub': 'تدخلات قبل الأعطال.',
    'health.title': 'صحة العقارات', 'health.sub': 'نتيجة مركبة عبر محفظتك.',
    'sensors.title': 'المستشعرات الافتراضية', 'sensors.sub': 'إشارات صامتة في كل عقار.',
    'notif.title': 'الإشعارات', 'notif.sub': 'فقط ما يهمك.',
    'settings.title': 'الإعدادات', 'settings.sub': 'اضبط موظفك الذكي.',
    'settings.language': 'اللغة', 'settings.appearance': 'المظهر', 'settings.brain': 'الدماغ',
    'onboarding.slide1.title': 'تعرّف على موظفك الذكي', 'onboarding.slide1.body': 'ليس لوحة تحكم جديدة. مستشار هادئ يراقب كل عقار كل يوم.',
    'onboarding.slide2.title': 'قرارات، لا بيانات', 'onboarding.slide2.body': 'كل صباح، قائمة واضحة بما يجب فعله — مرتبة حسب الأثر.',
    'onboarding.slide3.title': 'تحدث إلى محفظتك', 'onboarding.slide3.body': 'اسأل الدماغ الموحد أي شيء. يتذكر كل عقار.',
    'onboarding.cta': 'ابدأ SPP',
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
