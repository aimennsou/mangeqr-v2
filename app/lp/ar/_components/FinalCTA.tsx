import { CTA } from './CTA';

// 14. FINAL CTA — end with the transformation.
export function FinalCTA() {
  return (
    <section className="bg-neutral-900 px-6 py-24 text-center text-white">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-3xl font-extrabold leading-snug sm:text-5xl">
          جاهز لرقمنة مطعمك؟
        </h2>
        <p className="mt-4 text-lg text-neutral-300">
          أطلق قائمتك الرقمية اليوم، وابدأ في كسب زبائن جدد ووقتٍ ثمين.
        </p>
        <div className="mt-8 flex justify-center">
          <CTA>ابدأ الآن</CTA>
        </div>
        <p className="mt-4 text-sm text-neutral-400">
          بدون بطاقة بنكية · الإعداد في 5 دقائق · إلغاء في أي وقت
        </p>
      </div>
    </section>
  );
}
