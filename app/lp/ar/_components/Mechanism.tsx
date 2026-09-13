// 4. NEW MECHANISM — give a reason to believe this works when others didn't.
export function Mechanism() {
  return (
    <section className="bg-neutral-900 px-6 py-20 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-400">
          هناك طريقة أفضل
        </p>
        <h2 className="mt-4 text-3xl font-extrabold leading-snug sm:text-4xl">
          قائمة واحدة رقمية تحدّثها لحظيًا — والزبون يراها فورًا
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-300">
          معظم الحلول تركّز على تصميم قائمة ورقية «مرّة واحدة». نحن نركّز على
          قائمة <span className="font-bold text-white">حيّة</span>: تعدّلها من
          هاتفك، فتتحدّث لدى كل زبون يمسح رمز QR في نفس اللحظة — بدون إعادة طباعة،
          وبدون تطبيق يحمّله الزبون.
        </p>

        <div className="mx-auto mt-10 grid max-w-2xl gap-4 text-right sm:grid-cols-3">
          <div className="rounded-xl bg-white/5 p-5">
            <div className="text-2xl">📱</div>
            <p className="mt-2 font-bold">رمز QR واحد</p>
            <p className="mt-1 text-sm text-neutral-400">
              يمسحه الزبون بكاميرا هاتفه مباشرة.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-5">
            <div className="text-2xl">⚡</div>
            <p className="mt-2 font-bold">تحديث لحظي</p>
            <p className="mt-1 text-sm text-neutral-400">
              غيّر سعرًا أو طبقًا، فيتحدّث فورًا.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-5">
            <div className="text-2xl">📊</div>
            <p className="mt-2 font-bold">أرقام واضحة</p>
            <p className="mt-1 text-sm text-neutral-400">
              اعرف أكثر الأطباق مشاهدةً واتّخذ قرارك.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
