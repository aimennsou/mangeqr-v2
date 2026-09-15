// Self-contained dictionaries for the lead-gen funnel (paid ads). The funnel is
// NOT part of the app's i18n system — it's two standalone pages (French LTR,
// Arabic RTL), each passing its own `FunnelDict` so the wizard stays
// language-agnostic and copy stays conversion-tuned per market.

export interface FunnelDict {
  dir: 'ltr' | 'rtl';
  locale: 'fr' | 'ar';
  // Hero
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  // Stepper labels
  stepMenu: string;
  stepShare: string;
  stepDesign: string;
  stepDone: string;
  // Step 1 — build menu
  s1Title: string;
  s1Subtitle: string;
  restaurantName: string;
  restaurantNamePh: string;
  currency: string;
  categoryName: string;
  categoryNamePh: string;
  addCategory: string;
  dishName: string;
  dishNamePh: string;
  dishPrice: string;
  dishDesc: string;
  dishDescPh: string;
  addDish: string;
  removeLabel: string;
  atLeastOne: string;
  createMenu: string;
  creating: string;
  // Step 2 — QR + share
  s2Title: string;
  s2Subtitle: string;
  yourLink: string;
  copyLink: string;
  copied: string;
  openMenu: string;
  downloadQr: string;
  continueDesign: string;
  // Step 3 — order design
  s3Title: string;
  s3Subtitle: string;
  chooseDesign: string;
  quantity: string;
  yourName: string;
  yourNamePh: string;
  yourPhone: string;
  yourPhonePh: string;
  yourEmail: string;
  yourEmailPh: string;
  notes: string;
  notesPh: string;
  submitOrder: string;
  submitting: string;
  skipForNow: string;
  // Step 4 — done
  s4Title: string;
  s4Subtitle: string;
  s4Note: string;
  // Design catalog (labels + short price hints)
  designs: {
    id: string;
    shape: 'poster' | 'disc' | 'sticker';
    name: string;
    price: string;
  }[];
}

export const FR_DICT: FunnelDict = {
  dir: 'ltr',
  locale: 'fr',
  heroEyebrow: 'Gratuit · 2 minutes',
  heroTitle: 'Votre carte en ligne, prête en 2 minutes.',
  heroSubtitle:
    "Créez votre menu numérique, obtenez votre QR code et votre lien à partager — sans compte, sans installation.",
  stepMenu: 'Votre carte',
  stepShare: 'QR & lien',
  stepDesign: 'Votre support',
  stepDone: 'Terminé',
  s1Title: 'Composez votre carte',
  s1Subtitle: 'Le nom de votre restaurant, vos catégories et quelques plats.',
  restaurantName: 'Nom du restaurant',
  restaurantNamePh: 'Ex : Le Bistrot',
  currency: 'Devise',
  categoryName: 'Catégorie',
  categoryNamePh: 'Ex : Entrées',
  addCategory: 'Ajouter une catégorie',
  dishName: 'Plat',
  dishNamePh: 'Ex : Bruschetta',
  dishPrice: 'Prix',
  dishDesc: 'Description',
  dishDescPh: 'Ex : Tomates fraîches, basilic',
  addDish: 'Ajouter un plat',
  removeLabel: 'Supprimer',
  atLeastOne: 'Ajoutez au moins une catégorie avec un plat.',
  createMenu: 'Créer ma carte',
  creating: 'Création…',
  s2Title: 'Votre carte est en ligne !',
  s2Subtitle:
    'Partagez ce lien ou ce QR code avec vos clients pour qu’ils découvrent votre menu.',
  yourLink: 'Votre lien',
  copyLink: 'Copier',
  copied: 'Copié !',
  openMenu: 'Voir la carte',
  downloadQr: 'Télécharger le QR',
  continueDesign: 'Commander mon support QR',
  s3Title: 'Choisissez votre support QR',
  s3Subtitle:
    'On imprime et on vous livre un support physique élégant pour votre QR code.',
  chooseDesign: 'Support',
  quantity: 'Quantité',
  yourName: 'Votre nom',
  yourNamePh: 'Ex : Jean Dupont',
  yourPhone: 'Téléphone',
  yourPhonePh: 'Ex : +213 …',
  yourEmail: 'Email (optionnel)',
  yourEmailPh: 'vous@exemple.com',
  notes: 'Notes (optionnel)',
  notesPh: 'Couleurs, logo, délais…',
  submitOrder: 'Commander',
  submitting: 'Envoi…',
  skipForNow: 'Plus tard',
  s4Title: 'Merci ! On vous contacte très vite.',
  s4Subtitle:
    'Votre demande est enregistrée. Notre équipe vous appelle pour finaliser votre support et activer votre espace.',
  s4Note:
    'Votre carte et votre QR restent accessibles pendant 30 jours. Passez à l’offre complète pour la gérer sans limite.',
  designs: [
    { id: 'table-sticker', shape: 'sticker', name: 'Sticker de table', price: 'à partir de 12€' },
    { id: 'wood-disc', shape: 'disc', name: 'Disque en bois gravé', price: 'à partir de 34€' },
    { id: 'elegant-poster', shape: 'poster', name: 'Affiche élégante', price: 'à partir de 24€' }
  ]
};

export const AR_DICT: FunnelDict = {
  dir: 'rtl',
  locale: 'ar',
  heroEyebrow: 'مجانًا · دقيقتان',
  heroTitle: 'قائمتك على الإنترنت، جاهزة في دقيقتين.',
  heroSubtitle:
    'أنشئ قائمتك الرقمية، واحصل على رمز QR ورابط للمشاركة — بدون حساب وبدون تثبيت.',
  stepMenu: 'قائمتك',
  stepShare: 'QR والرابط',
  stepDesign: 'الحامل',
  stepDone: 'تم',
  s1Title: 'أنشئ قائمتك',
  s1Subtitle: 'اسم مطعمك، فئاتك وبعض الأطباق.',
  restaurantName: 'اسم المطعم',
  restaurantNamePh: 'مثال: المطعم',
  currency: 'العملة',
  categoryName: 'الفئة',
  categoryNamePh: 'مثال: المقبلات',
  addCategory: 'إضافة فئة',
  dishName: 'الطبق',
  dishNamePh: 'مثال: بروسكيتّا',
  dishPrice: 'السعر',
  dishDesc: 'الوصف',
  dishDescPh: 'مثال: طماطم طازجة وريحان',
  addDish: 'إضافة طبق',
  removeLabel: 'حذف',
  atLeastOne: 'أضف فئة واحدة على الأقل مع طبق.',
  createMenu: 'أنشئ قائمتي',
  creating: 'جارٍ الإنشاء…',
  s2Title: 'قائمتك على الإنترنت الآن!',
  s2Subtitle: 'شارك هذا الرابط أو رمز QR مع زبائنك ليكتشفوا قائمتك.',
  yourLink: 'رابطك',
  copyLink: 'نسخ',
  copied: 'تم النسخ!',
  openMenu: 'عرض القائمة',
  downloadQr: 'تحميل رمز QR',
  continueDesign: 'اطلب حامل QR',
  s3Title: 'اختر حامل رمز QR',
  s3Subtitle: 'نطبع ونوصّل لك حاملًا فعليًا أنيقًا لرمز QR الخاص بك.',
  chooseDesign: 'الحامل',
  quantity: 'الكمية',
  yourName: 'اسمك',
  yourNamePh: 'مثال: محمد',
  yourPhone: 'الهاتف',
  yourPhonePh: 'مثال: +213 …',
  yourEmail: 'البريد الإلكتروني (اختياري)',
  yourEmailPh: 'you@example.com',
  notes: 'ملاحظات (اختياري)',
  notesPh: 'الألوان، الشعار، المواعيد…',
  submitOrder: 'اطلب الآن',
  submitting: 'جارٍ الإرسال…',
  skipForNow: 'لاحقًا',
  s4Title: 'شكرًا! سنتواصل معك قريبًا.',
  s4Subtitle:
    'تم تسجيل طلبك. سيتصل بك فريقنا لإنهاء الحامل وتفعيل مساحتك.',
  s4Note:
    'تبقى قائمتك ورمز QR متاحين لمدة 30 يومًا. اشترك في العرض الكامل لإدارتها بلا حدود.',
  designs: [
    { id: 'table-sticker', shape: 'sticker', name: 'ملصق للطاولة', price: 'ابتداءً من 12€' },
    { id: 'wood-disc', shape: 'disc', name: 'قرص خشبي محفور', price: 'ابتداءً من 34€' },
    { id: 'elegant-poster', shape: 'poster', name: 'ملصق أنيق', price: 'ابتداءً من 24€' }
  ]
};
