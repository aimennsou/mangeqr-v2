import { Check } from 'lucide-react';

// 9. OBJECTION DESTRUCTION — remove perceived effort + perceived risk.
const OBJECTIONS = [
  {
    q: 'لست متمكّنًا من التقنية…',
    a: 'لا حاجة لأي خبرة. الإعداد بسيط وبالعربية، ونرافقك خطوة بخطوة حتى تنطلق قائمتك.',
  },
  {
    q: 'ليس لديّ وقت…',
    a: 'تنشئ قائمتك الأولى في أقل من دقيقتين، وتستوردها من قائمتك الحالية بسهولة.',
  },
  {
    q: 'هل تناسب حالة مطعمي؟',
    a: 'مطاعم، مقاهي، وجبات سريعة، شاحنات طعام… MangeQR يناسب كل من يقدّم قائمة طعام.',
  },
  {
    q: 'ماذا لو لم تعجبني؟',
    a: 'لديك ضمان 30 يومًا. إن لم تقتنع، تسترجع أموالك بالكامل دون أسئلة.',
  },
  {
    q: 'هل بياناتي آمنة؟',
    a: 'بياناتك محميّة ومستضافة بأمان، ولك وحدك التحكّم الكامل في قائمتك.',
  },
  {
    q: 'هل يستحق السعر فعلاً؟',
    a: 'كلفة أقل من قهوتين في اليوم، مقابل توفير الطباعة وكسب زبائن جدد.',
  },
];

export function Objections() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">
          «لكن ماذا لو…؟» — أزلنا كل تردّد
        </h2>

        <div className="mt-12 grid gap-4 text-right sm:grid-cols-2">
          {OBJECTIONS.map((o) => (
            <div
              key={o.q}
              className="rounded-xl border border-neutral-200 bg-[#faf7f2] p-5"
            >
              <div className="flex items-start gap-2">
                <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-bold text-neutral-900">{o.q}</p>
                  <p className="mt-1 text-neutral-600">{o.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
