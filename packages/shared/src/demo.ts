import type { LanguageCode } from "./languages";

/**
 * Prepared demo lecture segments.
 *
 * These are hand-authored samples used by the interactive demo. They are NOT
 * live AI translations and the UI always labels them as prepared samples.
 */
export interface DemoSegment {
  id: string;
  originalLanguage: LanguageCode;
  originalText: string;
  translations: Partial<Record<LanguageCode, string>>;
  speakerName: string;
  /** Milliseconds of "speech" before the segment is delivered. */
  durationMs: number;
  terms: string[];
}

export const DEMO_SEGMENTS: DemoSegment[] = [
  {
    id: "demo-1",
    originalLanguage: "en",
    originalText:
      "Good morning everyone. Today we will study the torque acting on a rotating body.",
    translations: {
      ta: "வணக்கம் அனைவருக்கும். இன்று நாம் சுழலும் ஒரு உடலில் செயல்படும் வட்டவிசையை (Torque) பற்றி ஆய்வு செய்வோம்.",
      hi: "सभी को सुप्रभात। आज हम एक घूमते हुए पिंड पर लगने वाले टॉर्क (Torque) का अध्ययन करेंगे।",
      bn: "সকলকে সুপ্রভাত। আজ আমরা ঘূর্ণির ধর্মীয় দেহের উপর প্রয়োগিত টর্ক (Torque) নিয়ে আলোচনা করব।",
      mr: "सर्वांना शुभसकाळीच्या शुभेच्छा. आज आपण फिरणाऱ्या घन वस्तूवर लागणारा टॉर्क (Torque) याचा अभ्यास करणार आहोत.",
      or: "ସବଙ୍କେ ଶୁଭ ପୂର୍ବାହ୍ନ. ଆଜି ଆମେ ଘୂରୁଥିବା କଠିଣ ଦେହରେ ପ୍ରୟୋଗ ହେଉଥିବା ଟର୍କ (Torque) ବିଷୟରେ ଅଧ୍ୟାୟନ କରିବା।",
    },
    speakerName: "Dr. Meera Krishnan",
    durationMs: 5200,
    terms: ["torque"],
  },
  {
    id: "demo-2",
    originalLanguage: "en",
    originalText: "The torque acting on this rotating body changes with angular acceleration.",
    translations: {
      ta: "இந்தச் சுழலும் உடலில் செயல்படும் வட்டவிசை (Torque), கோண முடக்கத்துடன் (angular acceleration) மாறுகிறது.",
      hi: "इस घूमते हुए पिंड पर लगने वाला टॉर्क कोणीय त्वरण (angular acceleration) के साथ बदलता है।",
      bn: "এই ঘূর্ণির ধর্মীয় দেহের উপর প্রয়োগিত টর্ক কোণীয় ত্বরণের (angular acceleration) সাথে পরিবর্তিত হয়।",
      mr: "या फिरणाऱ्या घन वस्तूवर लागणारा टॉर्क कोणीय त्वरणानुसार (angular acceleration) बदलतो.",
      or: "ଏହି ଘୂରୁଥିବା କଠିଣ ଦେହରେ ପ୍ରୟୋଗ ହେଉଥିବା ଟର୍କ କୋଣୀୟ ତ୍ୱରଣ ସହିତ (angular acceleration) ବଦଳେ।",
    },
    speakerName: "Dr. Meera Krishnan",
    durationMs: 4800,
    terms: ["torque", "angular-acceleration"],
  },
  {
    id: "demo-3",
    originalLanguage: "en",
    originalText: "Remember that the eigenvalue of a matrix determines its stability.",
    translations: {
      ta: "நினைவில் கொள்ளுங்கள், ஒரு அணியின் (matrix) ஈஜன்வில்யூ (eigenvalue) அதன் நிலையைத் தீர்மானிக்கிறது.",
      hi: "याद रखें कि किसी मैट्रिक्स का आइजनवैल्यू उसकी स्थिरता को निर्धारित करता है।",
      bn: "মনে রাখবেন, কোনো ম্যাট্রিক্সের ইজেনভ্যালিউ তার স্থিতিশীলতা নির্ধারণ করে।",
      mr: "लक्षात ठेवा, एखाद्या मॅट्रिक्सचा आइजनव्हॅल्यू त्याची स्थिरता ठरवतो.",
      or: "ମନେ ରଖନ୍ତୁ, ଗୋଟିଏ ମ୍ୟାଟ୍ରିକ୍ସର ଆଇଜନଭ୍ୟାଲ୍ୟୂ (eigenvalue) ତାର ସ୍ଥିତିସ୍ଥାପକତା ନିର୍ଣୟ କରେ।",
    },
    speakerName: "Dr. Meera Krishnan",
    durationMs: 4600,
    terms: ["eigenvalue", "matrix"],
  },
  {
    id: "demo-4",
    originalLanguage: "en",
    originalText: "If the eigenvector is zero, the matrix is singular and has no inverse.",
    translations: {
      ta: "ஈஜன்வெக்டர் (eigenvector) பூச்சியம் எனில், அந்த அணி ஒற்றைச் சிறப்பியல்புடையது (singular) மேலும் அதற்கு எதிர்மறை இல்லை.",
      hi: "यदि आइजनवेक्टर शून्य है, तो मैट्रिक्स एकविभ (singular) है और उसका कोई व्युत्क्रम नहीं है।",
      bn: "যদি ইজেনভেক্টর শূন্য হয়, তবে ম্যাট্রিক্সটি একবিশেষ (singular) এবং তার বিপরীত নেই।",
      mr: "जर आइजनव्हेक्टर शून्य असेल, तर मॅट्रिक्स एकविभ (singular) आहे आणि त्याचा व्युत्क्रम नाही.",
      or: "ଆଇଜନଭେକ୍ଟର ଶୂନ୍ୟ ହେଲେ, ମ୍ୟାଟ୍ରିକ୍ସ ଅବିଶେଷ (singular) ଏବଂ ତାର ବିପରୀତ ନାହିଁ।",
    },
    speakerName: "Dr. Meera Krishnan",
    durationMs: 5000,
    terms: ["eigenvector", "matrix"],
  },
  {
    id: "demo-5",
    originalLanguage: "en",
    originalText: "Now let us compute the momentum of the block as it slides down the incline.",
    translations: {
      ta: "இப்போது சாய்தளத்தில் இழிந்து வரும் துண்டின் (block) மொமென்டம் (momentum) ஐக் கணக்கிடுவோம்.",
      hi: "अब आते हैं कि ढलान से फिसलते ब्लॉक का संवेग (momentum) निकालेंगे।",
      bn: "এখন আমরা ঢালের নামতে নামছে ব্লকের (block) বলের পরিমাণ (momentum) হিসাব করি।",
      mr: "आता आपण सोडीवरून घसरत असलेया ब्लॉकचा संवेग (momentum) काढूया.",
      or: "ଏବେ ଆମେ ଢଲରେ ଗଡ଼ୁଥିବା ବ୍ଲକର ଗତିଶକ୍ତି (momentum) ଗଣନା କରିବା।",
    },
    speakerName: "Dr. Meera Krishnan",
    durationMs: 5000,
    terms: ["momentum"],
  },
  {
    id: "demo-6",
    originalLanguage: "en",
    originalText: "The derivative of velocity with respect to time gives us the acceleration.",
    translations: {
      ta: "நேரத்துடன் தொடர்பாக வேகத்தின் (velocity) வேதித்தொகை (derivative) நமக்கு முடக்கத்தை (acceleration) தருகிறது.",
      hi: "समय के सापेक्ष वेग का अवकलज (derivative) हमें त्वरण (acceleration) देता है।",
      bn: "সময়ের সাপেক্ষে বেগের অন্তরক (derivative) আমাদের ত্বরণ (acceleration) দেয়।",
      mr: "वेळेच्या सापेक्ष वेगाचा अवकलज (derivative) आपल्याला त्वरण (acceleration) देतो.",
      or: "ସମୟ ସାପେକ୍ଷରେ ବେଗର ଅବକଲଜ (derivative) ଆମକୁ ତ୍ୱରଣ (acceleration) ଦେଇଥାଏ।",
    },
    speakerName: "Dr. Meera Krishnan",
    durationMs: 4700,
    terms: ["derivative", "velocity", "acceleration"],
  },
  {
    id: "demo-7",
    originalLanguage: "en",
    originalText: "Finally, the integral of force over distance gives us the work done.",
    translations: {
      ta: "இறுதியாக, தூரத்தின் மீதான விசையின் ஒருங்கல் (integral) வேலையளவைத் தருகிறது.",
      hi: "अंत में, दूरी के सापेक्ष बल का समाकलन (integral) हमें किया गया कार्य देता है।",
      bn: "অবশেষে, দূরত্বের উপর বলের সমাকলন (integral) আমাদের সম্পাদিত কাজ দেয়।",
      mr: "शेवटी, अंतरावर बलाचे समाकलन (integral) आपल्याला केलेले काम देतो.",
      or: "ଶେଷରେ, ଦୂରତ୍ୱ ଉପରେ ବଳର ସମାକଲନ (integral) ଆମକୁ ସମ୍ପାदିତ କାମ ଦେଇଥାଏ।",
    },
    speakerName: "Dr. Meera Krishnan",
    durationMs: 4600,
    terms: ["integration"],
  },
  {
    id: "demo-8",
    originalLanguage: "en",
    originalText: "Please complete the neural network assignment before Friday.",
    translations: {
      ta: "புதன், வியாழக்கிழமைக்கு முன் நரம்பு வலைப்பின்னல் (neural network) விட்டுரையை முடியுங்கள்.",
      hi: "कृपया शुक्रवार से पहले न्यूरल नेटवर्क (neural network) असाइनमेंट पूरा करें।",
      bn: "অনুগ্রহ করে শুক্রবারের আগে নিউরাল নেটওয়ার্ক (neural network) অ্যাসাইনমেন্ট সম্পূর্ণ করুন।",
      mr: "कृपया शुक्रवारच्या आधी न्यूरल नेटवर्क (neural network) असाइनमेंट पूर्ण करा.",
      or: "ଦୟାକର ଶୁକ୍ରବାର ପୂର୍ବରେ ନ୍ୟୁରାଲ ନେଟୱାର୍କ (neural network) ଅସାଇନମେଣ୍ଟ ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ।",
    },
    speakerName: "Dr. Meera Krishnan",
    durationMs: 4400,
    terms: ["neural-network"],
  },
];

export interface DemoStudentSeed {
  id: string;
  name: string;
  language: LanguageCode;
  captionLanguage: LanguageCode;
  voiceLanguage: LanguageCode;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
}

export const DEMO_STUDENTS: DemoStudentSeed[] = [
  {
    id: "sim-arjun",
    name: "Arjun Patel",
    language: "hi",
    captionLanguage: "hi",
    voiceLanguage: "hi",
    cameraEnabled: true,
    microphoneEnabled: true,
  },
  {
    id: "sim-kavya",
    name: "Kavya Raman",
    language: "ta",
    captionLanguage: "ta",
    voiceLanguage: "ta",
    cameraEnabled: true,
    microphoneEnabled: false,
  },
  {
    id: "sim-sourav",
    name: "Sourav Das",
    language: "bn",
    captionLanguage: "bn",
    voiceLanguage: "bn",
    cameraEnabled: false,
    microphoneEnabled: false,
  },
  {
    id: "sim-ananya",
    name: "Ananya Kulkarni",
    language: "mr",
    captionLanguage: "mr",
    voiceLanguage: "mr",
    cameraEnabled: true,
    microphoneEnabled: true,
  },
  {
    id: "sim-priya",
    name: "Priya Nayak",
    language: "or",
    captionLanguage: "or",
    voiceLanguage: "or",
    cameraEnabled: false,
    microphoneEnabled: false,
  },
];

/**
 * Additional participants the demo can add after the five base students are
 * already in the room, so the "add student" control keeps working, mirrors
 * real class growth, and covers every language including English.
 */
export const DEMO_EXTRA_STUDENTS: DemoStudentSeed[] = [
  {
    id: "sim-rohit",
    name: "Rohit Verma",
    language: "en",
    captionLanguage: "en",
    voiceLanguage: "en",
    cameraEnabled: false,
    microphoneEnabled: true,
  },
  {
    id: "sim-divya",
    name: "Divya Menon",
    language: "ta",
    captionLanguage: "ta",
    voiceLanguage: "ta",
    cameraEnabled: true,
    microphoneEnabled: false,
  },
  {
    id: "sim-rahul",
    name: "Rahul Sen",
    language: "bn",
    captionLanguage: "bn",
    voiceLanguage: "bn",
    cameraEnabled: true,
    microphoneEnabled: false,
  },
  {
    id: "sim-sneha",
    name: "Sneha Joshi",
    language: "mr",
    captionLanguage: "mr",
    voiceLanguage: "mr",
    cameraEnabled: false,
    microphoneEnabled: true,
  },
  {
    id: "sim-bikash",
    name: "Bikash Pati",
    language: "or",
    captionLanguage: "or",
    voiceLanguage: "or",
    cameraEnabled: false,
    microphoneEnabled: false,
  },
  {
    id: "sim-isha",
    name: "Isha Malhotra",
    language: "hi",
    captionLanguage: "hi",
    voiceLanguage: "hi",
    cameraEnabled: true,
    microphoneEnabled: true,
  },
];

export const DEMO_CHAT_SEED: { sender: string; message: string }[] = [  { sender: "Kavya Raman", message: "Ma'am, could you repeat the part about torque?" },
  { sender: "Dr. Meera Krishnan", message: "Of course - I will show it on the shared board." },
  { sender: "Arjun Patel", message: "Eigenvalue ka example bhi dobara samjha sakte hain?" },
];
