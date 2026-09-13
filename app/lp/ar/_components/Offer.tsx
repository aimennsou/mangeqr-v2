import { QrCode, Star, Megaphone, BarChart3, Palette, Printer } from 'lucide-react';

// 5. THE OFFER — features translated into outcomes.
const ITEMS = [
  {
    icon: QrCode,
    title: 'قائمة رقمية برمز QR',
    benefit: 'زبونك يمسح ويطلب في ثوانٍ — بدون تطبيق وبدون تسجيل.',
  },
  {
    icon: Palette,
    title: 'تصميم على ذوقك',
    benefit: 'ألوان وشعار وصور مطعمك — قائمة تشبه علامتك التجارية تمامًا.',
  },
  {
    icon: Star,
    title: 'تجميع آراء الزبائن',
    benefit: 'حوّل الزبائن الراضين إلى تقييمات على Google تلقائيًا.',
  },
  {
    icon: Megaphone,
    title: 'حملات تسويقية',
    benefit: 'أرسل عروضك عبر البريد إلى زبائنك واسترجعهم من جديد.',
  },
  {
    icon: BarChart3,
    title: 'إحصائيات ومسحات',
    benefit: 'اعرف بالضبط أين تربح وأين تخسر — بالأرقام لا بالحدس.',
  },
  {
    icon: Printer,
    title: 'قوائم فيزيائية أنيقة',
    benefit: 'اطلب طباعة احترافية لقائمتك أو رمز QR ونوصلها إليك.',
  },
];

export function Offer() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-600">
          تعرّف على MangeQR
        </p>
        <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
          كل ما تحتاجه لرقمنة مطعمك في مكان واحد
        </h2>

        <div className="mt-12 grid gap-6 text-right sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">
                <it.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-bold">{it.title}</h3>
              <p className="mt-1 text-neutral-600">{it.benefit}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
