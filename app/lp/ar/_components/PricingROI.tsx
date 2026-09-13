import { CTA } from './CTA';

// 9/11. PRICE / ROI — frame the price against the alternative.
export function PricingROI() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm sm:p-12">
        <h2 className="text-3xl font-extrabold sm:text-4xl">
          الحساب بسيط جدًا
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600">
          إعادة طباعة قوائمك الورقية وحدها قد تكلّفك آلاف الدنانير كل شهر.
          <span className="font-bold text-neutral-900">
            {' '}
            MangeQR بـ 1,500 دج / شهريًا فقط.
          </span>
        </p>

        <div className="mx-auto mt-8 grid max-w-lg gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm font-bold text-red-600">الطريقة القديمة</p>
            <p className="mt-2 text-2xl font-extrabold text-neutral-900">
              +15,000 دج
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              طباعة، تصميم، ووقت ضائع شهريًا
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-bold text-emerald-600">مع MangeQR</p>
            <p className="mt-2 text-2xl font-extrabold text-neutral-900">
              1,500 دج
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              كل شيء مشمول — دون تكلفة خفية
            </p>
          </div>
        </div>

        <p className="mt-8 text-lg font-semibold text-neutral-800">
          إن ساعدك MangeQR في استرجاع زبون واحد فقط، فقد دفع ثمن نفسه.
        </p>

        <div className="mt-8 flex justify-center">
          <CTA>جرّبه اليوم</CTA>
        </div>
      </div>
    </section>
  );
}
