import type { LanguageCode } from "@nexclass/shared";

/**
 * Curated interface strings for the shared classroom surfaces.
 *
 * Every participant resolves these strings independently in their own
 * interface language, which is what makes a shared room readable for a Tamil,
 * Hindi, Bengali, Marathi and Odia student at the same time.
 *
 * These are hand-authored product strings - they are not machine translations
 * and they are not presented as such.
 */
export const UI_STRINGS = {
  "room.title": {
    en: "Shared classroom",
    ta: "பகிரப்பட்ட வகுப்பு",
    hi: "साझा कक्षा",
    bn: "ভাগ করা শ্রেণিকক্ষ",
    mr: "सामायिक वर्गखंडा",
    or: "ସାଧାରଣ ଶ୍ରେଣୀକକ୍ଷ",
  },
  "room.instructions": {
    en: "Rotate the body and watch how the torque changes.",
    ta: "உடலைச் சுழற்றி டார்க் எவ்வாறு மாறுகிறது என்பதைப் பாருங்கள்.",
    hi: "वस्तु को घुमाएँ और देखें कि टॉर्क कैसे बदलता है।",
    bn: "দেহটি ঘোরান এবং দেখুন কীভাবে টর্ক পরিবর্তন হয়।",
    mr: "वस्तू फिरवा आणि पहा की टॉर्क कसा बदलतो.",
    or: "ଦେହଟି ଘୂରାନ୍ତୁ ଏବଂ ଦେଖନ୍ତୁ ଟର୍କ କିପରି ବଦଳେ।",
  },
  "room.controls": {
    en: "Room controls",
    ta: "அறை கட்டுப்புகள்",
    hi: "कक्षा नियंत्रण",
    bn: "শ্রেণিকক্ষ নিয়ন্ত্রণ",
    mr: "वर्गखंड नियंत्रण",
    or: "ଶ୍ରେଣୀକକ୍ଷ ନିୟନ୍ତ୍ରଣ",
  },
  "room.controls.rotate": {
    en: "Rotate body",
    ta: "உடலைச் சுழற்று",
    hi: "वस्तु घुमाएँ",
    bn: "দেহ ঘোরান",
    mr: "वस्तू फिरवा",
    or: "ଦେହ ଘୂରାନ୍ତୁ",
  },
  "room.controls.reset": {
    en: "Reset",
    ta: "மீட்டமை",
    hi: "रीसेट",
    bn: "রিসেট",
    mr: "रीसेट",
    or: "ରିସେଟ",
  },
  "room.controls.measure": {
    en: "Measure torque",
    ta: "டார்க் அளவிடு",
    hi: "टॉर्क मापें",
    bn: "টর্ক মাপুন",
    mr: "टॉर्क मोजा",
    or: "ଟର୍କ ମାପନ୍ତୁ",
  },
  "room.controls.vectors": {
    en: "Show force vectors",
    ta: "விசைகளைக் காட்டு",
    hi: "बल सदिश दिखाएँ",
    bn: "বলের ভেক্টর দেখান",
    mr: "बल सदिश दाखवा",
    or: "ବଳ ଭେକ୍ଟର ଦେଖାନ୍ତୁ",
  },
  "room.object.rotating-body": {
    en: "Rotating rigid body",
    ta: "சுழலும் கடின உடல்",
    hi: "घूमता हुआ दृढ़ शरीर",
    bn: "ঘূর্ণির ধর্মীয় দেহ",
    mr: "फिरणारा घन वस्तू",
    or: "ଘୂରୁଥିବା କଠିଣ ଦେହ",
  },
  "room.object.matrix-board": {
    en: "Matrix board",
    ta: "அணி அட்டை",
    hi: "मैट्रिक्स बोर्ड",
    bn: "ম্যাট্রিক্স বোর্ড",
    mr: "मॅट्रिक्स बोर्ड",
    or: "ମ୍ୟାଟ୍ରିକ୍ସ ବୋର୍ଡ",
  },
  "room.object.pendulum": {
    en: "Simple pendulum",
    ta: "எளிய தொங்கல்",
    hi: "सरल लोलक",
    bn: "সরল দোলক",
    mr: "सरळ दोलक",
    or: "ସରଳ ଦୋଲକ",
  },
  "room.object.spring": {
    en: "Helical spring",
    ta: "சுருள் முல்லை",
    hi: "कुंडलीदार स्प्रिंग",
    bn: "কোঁথালী আস্প্রিং",
    mr: "कुंडलदार स्प्रिंग",
    or: "କୁଣ୍ଡଳିଆ ସ୍ପ୍ରିଙ୍ଗ",
  },
  "room.unit.angle": {
    en: "Angle",
    ta: "கோணம்",
    hi: "कोण",
    bn: "কোণ",
    mr: "कोन",
    or: "କୋଣ",
  },
  "room.unit.degrees": {
    en: "degrees",
    ta: "டிகிரீகள்",
    hi: "डिग्री",
    bn: "ডিগ্রি",
    mr: "डिग्री",
    or: "ଡିଗ୍ରୀ",
  },
  "room.unit.newton": {
    en: "N·m",
    ta: "நியூட்டன்·மீ",
    hi: "N·m",
    bn: "N·m",
    mr: "N·m",
    or: "N·m",
  },
  "room.shared.panel": {
    en: "Shared object",
    ta: "பகிரப்பட்ட பொருள்",
    hi: "साझा वस्तु",
    bn: "ভাগ করা বস্তু",
    mr: "सामायिक वस्तू",
    or: "ସାଧାରଣ ବସ୍ତୁ",
  },
  "room.shared.choose": {
    en: "Choose the shared object",
    ta: "பகிரப்பட்ட பொருளைத் தேர்ந்தெடு",
    hi: "साझा वस्तु चुनें",
    bn: "ভাগ করা বস্তু বেছে নিন",
    mr: "सामायिक वस्तू निवडा",
    or: "ସାଧାରଣ ବସ୍ତୁ ବାଛନ୍ତୁ",
  },
  "room.shared.pending": {
    en: "The teacher has not highlighted an object for this room yet.",
    ta: "ஆசிரியர் இன்னும் இந்த வகுப்பில் எந்தப் பொருளையும் சிறப்பித்துக் காட்டவில்லை.",
    hi: "शिक्षक ने अभी तक इस कक्षा के लिए कोई वस्तु चिह्नित नहीं की है.",
    bn: "শিক্ষক এখনও এই ক্লাসের জন্য কোনো বস্তু চিহ্নিত করেননি.",
    mr: "शिक्षकांनी अद्याप या वर्गखंड्यासाठी वस्तू चिन्हांकित केलेली नाही.",
    or: "ଶିକ୍ଷକ ଏହି ଶ୍ରେଣୀକକ୍ଷ ପାଇଁ ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ବସ୍ତୁ ଚିହ୍ନଟ କରିନାହାଁନ୍ତି.",
  },
  "room.shared.sync": {
    en: "Same object, every participant",
    ta: "ஒரே பொருள், ஒவ்வொரு பங்கேற்பாளருக்கும்",
    hi: "वही वस्तु, हर प्रतिभागी के लिए",
    bn: "একই বস্তু, প্রতিটি অংশগ্রহণকারীর জন্য",
    mr: "तीच वस्तू, प्रत्येक सहभागीसाठी",
    or: "ଏକ ବସ୍ତୁ, ପ୍ରତ୍ୟେକ ଅଂଶଗ୍ରହିତା ପାଇଁ",
  },
  "room.shared.syncEmpty": {
    en: "Once other participants join, each will see this object in their own language here.",
    ta: "மற்ற பங்கேற்பாளர்கள் சேர்ந்தவுடன், ஒவ்வொருவரும் இந்தப் பொருளைத் தங்கள் சொந்த மொழியில் இங்கே பார்ப்பார்கள்.",
    hi: "अन्य प्रतिभागी जुड़ते ही, हर कोई इस वस्तु को अपनी भाषा में यहाँ देखेगा.",
    bn: "অন্য অংশগ্রহণকারীরা যোগ দিলে, প্রত্যেকে এখানে এই বস্তুটি নিজের ভাষায় দেখবে.",
    mr: "इतर सहभागी सामील झाल्यावर, प्रत्येकजण ही वस्तू आपल्या भाषेत येथे पाहील.",
    or: "ଅନ୍ୟ ଅଂଶଗ୍ରହିତାମାନେ ଯୋଗ ଦେଲେ, ପ୍ରତ୍ୟେକେ ଏଠାରେ ଏହି ବସ୍ତୁକୁ ନିଜ ଭାଷାରେ ଦେଖିବେ.",
  },
  "room.shared.reducedMotion": {
    en: "Reduced motion is on - the body moves in steps.",
    ta: "இயக்கக் குறைப்பு இயக்கத்தில் உள்ளது - உடல் படிப்படியாக நகரும்.",
    hi: "हल्की गति चालू है - वस्तु चरणों में चलती है.",
    bn: "কম গতি চালু আছে - বস্তুটি ধাপে ধাপে চলে.",
    mr: "कमी हालचाल सुरू आहे - वस्तू टप्प्याटप्प्याने हलते.",
    or: "କମ୍ ଚଳପ୍ରଚଳ ଚାଲୁ ଅଛି - ବସ୍ତୁ ପାଦ ପାଦ କରି ଚଲେ.",
  },
  "caption.original": {
    en: "Original",
    ta: "மூலம்",
    hi: "मूल",
    bn: "মূল",
    mr: "मूळ",
    or: "ମୂଳ",
  },
  "caption.translated": {
    en: "Translation",
    ta: "மொழிபெயர்ப்பு",
    hi: "अनुवाद",
    bn: "অনুবাদ",
    mr: "भाषांतर",
    or: "ଅନୁବାଦ",
  },
  "menu.participants": {
    en: "Participants",
    ta: "பங்கேற்பாளர்கள்",
    hi: "प्रतिभागी",
    bn: "অংশগ্রহণকারী",
    mr: "सहभागी",
    or: "ଅଂଶଗ୍ରହିତା",
  },
  "menu.chat": {
    en: "Chat",
    ta: "உரையாடல்",
    hi: "चैट",
    bn: "চ্যাট",
    mr: "संवाद",
    or: "ଚ୍ୟାଟ",
  },
  "menu.captions": {
    en: "Captions",
    ta: "தலைப்பெயர்கள்",
    hi: "कैप्शन",
    bn: "ক্যাপশন",
    mr: "कॅप्शन",
    or: "କ୍ୟାପସନ",
  },
  "menu.settings": {
    en: "Settings",
    ta: "அமைப்புகள்",
    hi: "सेटिंग्स",
    bn: "সেটিংস",
    mr: "सेटिंग्ज",
    or: "ସେଟିଙ୍ଗ",
  },
  "role.teacher": {
    en: "Teacher",
    ta: "ஆசிரியர்",
    hi: "शिक्षक",
    bn: "শিক্ষক",
    mr: "शिक्षक",
    or: "ଶିକ୍ଷକ",
  },
  "role.student": {
    en: "Student",
    ta: "மாணவர்",
    hi: "विद्यार्थी",
    bn: "শিক্ষার্থী",
    mr: "विद्यार्थी",
    or: "ଛାତ୍ରୀ",
  },
} as const satisfies Record<string, Record<LanguageCode, string>>;

export type UiStringKey = keyof typeof UI_STRINGS;

export const UI_STRING_KEYS = Object.keys(UI_STRINGS) as UiStringKey[];

export function translateUi(key: UiStringKey, language: LanguageCode): string {
  const entry = UI_STRINGS[key] as Record<LanguageCode, string> | undefined;
  return entry?.[language] ?? entry?.en ?? key;
}

export function translateUiBundle(
  language: LanguageCode,
  keys: UiStringKey[] = UI_STRING_KEYS,
): Record<string, string> {
  const out: Record<string, string> = {};
  keys.forEach((key) => {
    out[key] = translateUi(key, language);
  });
  return out;
}

/** Shared classroom resources that can be highlighted for every participant. */
export const SHARED_RESOURCES: {
  id: string;
  labelKey: UiStringKey;
  descriptionKey: UiStringKey;
  instructionKey: UiStringKey;
}[] = [
  {
    id: "rotating-body",
    labelKey: "room.object.rotating-body",
    descriptionKey: "room.instructions",
    instructionKey: "room.controls.rotate",
  },
  {
    id: "matrix-board",
    labelKey: "room.object.matrix-board",
    descriptionKey: "room.controls.vectors",
    instructionKey: "room.controls.reset",
  },
  {
    id: "pendulum",
    labelKey: "room.object.pendulum",
    descriptionKey: "room.controls.measure",
    instructionKey: "room.controls.rotate",
  },
  {
    id: "spring",
    labelKey: "room.object.spring",
    descriptionKey: "room.controls.vectors",
    instructionKey: "room.controls.reset",
  },
];
