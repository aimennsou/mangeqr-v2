// 8. SOCIAL PROOF — Problem → Solution → specific result → emotional impact.
const CASES = [
  {
    name: 'كريم ب.',
    role: 'صاحب مطعم — الجزائر العاصمة',
    initials: 'ك',
    before: 'كان يطبع 200 قائمة ورقية كل شهر عند كل تغيير سعر.',
    after: 'صار يحدّث الأسعار من هاتفه في ثوانٍ.',
    result: 'وفّر أكثر من 18,000 دج شهريًا في الطباعة.',
  },
  {
    name: 'سارة م.',
    role: 'مقهى — وهران',
    initials: 'س',
    before: 'لم تكن تعرف أي مشروب يجذب زبائنها فعلاً.',
    after: 'أصبحت ترى أكثر الأطباق مشاهدةً بالأرقام.',
    result: 'زادت مبيعات المشروبات المميّزة بنسبة 31%.',
  },
  {
    name: 'يوسف ح.',
    role: 'مطعم وجبات سريعة — قسنطينة',
    initials: 'ي',
    before: 'قلّة تقييمات Google كانت تضعف ثقة الزبائن الجدد.',
    after: 'صار يوجّه الزبائن الراضين للتقييم تلقائيًا.',
    result: 'انتقل من 42 إلى 380 تقييمًا في 3 أشهر.',
  },
];

export function Testimonials() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">
          مطاعم مثل مطعمك حقّقت نتائج حقيقية
        </h2>

        <div className="mt-12 grid gap-6 text-right md:grid-cols-3">
          {CASES.map((c) => (
            <div
              key={c.name}
              className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 text-right shadow-sm"
            >
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-bold text-neutral-500">قبل</p>
                  <p className="text-neutral-700">{c.before}</p>
                </div>
                <div>
                  <p className="font-bold text-neutral-500">بعد</p>
                  <p className="text-neutral-700">{c.after}</p>
                </div>
                <div className="rounded-lg bg-yellow-50 p-3">
                  <p className="font-bold text-yellow-700">النتيجة</p>
                  <p className="font-semibold text-neutral-900">{c.result}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 font-bold text-white">
                  {c.initials}
                </div>
                <div>
                  <p className="font-bold leading-none">{c.name}</p>
                  <p className="mt-1 text-xs text-neutral-500">{c.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
