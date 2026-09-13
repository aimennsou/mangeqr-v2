import PhoneFrame from '@/app/(landing)/_components/ui/PhoneFrame';
import LiveMenu from '@/app/(landing)/_components/ui/LiveMenu';
import { CTA, TrustMicrocopy } from './CTA';

// 1. HERO — sell the destination, not the product.
export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-14">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        {/* Copy */}
        <div className="text-center lg:text-right">
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-medium text-neutral-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            يثق بنا أكثر من 2,400 مطعم
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
            قائمة طعام رقمية بـ
            <span className="text-yellow-500"> رمز QR </span>
            بدون طباعة متكررة ولا أي خبرة تقنية
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-neutral-600 lg:mx-0">
            <span className="font-bold text-neutral-900">MangeQR</span> يساعد
            أصحاب المطاعم على إنشاء قائمة طعام رقمية أنيقة يمسحها الزبون برمز QR
            في أقل من دقيقتين — تحدّثها متى شئت، وبدون أي تكلفة طباعة إضافية.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 lg:items-end">
            <CTA>أنشئ قائمتك الآن</CTA>
            <TrustMicrocopy className="lg:justify-end" />
          </div>
        </div>

        {/* Live, explorable menu preview */}
        <div className="relative flex justify-center">
          <div className="absolute -left-2 top-6 z-10 hidden h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-yellow-400 bg-yellow-100/60 text-sm font-bold text-yellow-700 lg:flex">
            جرّبها!
          </div>
          <PhoneFrame>
            <LiveMenu />
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
