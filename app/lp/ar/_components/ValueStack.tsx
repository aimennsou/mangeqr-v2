import { CTA, TrustMicrocopy } from './CTA';

// 6/8. VALUE STACK — everything included, framed as a stack (Hormozi).
const STACK = [
  { label: 'قائمة رقمية غير محدودة الأطباق برمز QR', value: '12,000 دج' },
  { label: 'تصميم مخصّص بألوان وشعار مطعمك', value: '8,000 دج' },
  { label: 'نظام تجميع تقييمات Google', value: '6,000 دج' },
  { label: 'حملات تسويق بالبريد الإلكتروني', value: '7,000 دج' },
  { label: 'لوحة إحصائيات ومسحات', value: '5,000 دج' },
  { label: 'إعداد ومرافقة عند الانطلاق', value: '4,000 دج' },
];

export function ValueStack() {
  return (
    <section className="bg-neutral-900 px-6 py-20 text-white">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-3xl font-extrabold sm:text-4xl">
          كل ما تحتاجه لرقمنة مطعمك
        </h2>

        <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
          {STACK.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 border-b border-white/10 bg-white/5 px-5 py-4 last:border-b-0"
            >
              <span className="text-neutral-200">{row.label}</span>
              <span className="shrink-0 font-bold text-neutral-400 line-through">
                {row.value}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 bg-white/10 px-5 py-4">
            <span className="font-bold">القيمة الإجمالية</span>
            <span className="font-extrabold text-neutral-300 line-through">
              42,000 دج
            </span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-lg text-neutral-300">احصل على كل هذا اليوم مقابل</p>
          <p className="mt-1 text-4xl font-extrabold text-yellow-400">
            1,500 دج / شهريًا
          </p>
          <div className="mt-6 flex flex-col items-center gap-4">
            <CTA>ابدأ الآن</CTA>
            <TrustMicrocopy className="text-neutral-400" />
          </div>
        </div>
      </div>
    </section>
  );
}
