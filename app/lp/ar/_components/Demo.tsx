import PhoneFrame from '@/app/(landing)/_components/ui/PhoneFrame';
import LiveMenu from '@/app/(landing)/_components/ui/LiveMenu';
import { CTA } from './CTA';

// 6. DEMONSTRATION — show, don't tell (interactive live menu).
export function Demo() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
        <div className="text-center lg:text-right">
          <h2 className="text-3xl font-extrabold leading-snug sm:text-4xl">
            جرّب القائمة بنفسك — الآن
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            هذه قائمة حقيقية تعمل. بدّل بين الأقسام واضغط على الأطباق تمامًا كما
            سيفعل زبونك بعد أن يمسح رمز QR. هكذا ستبدو قائمتك — أنيقة، سريعة،
            وسهلة.
          </p>
          <ul className="mt-6 space-y-2 text-neutral-700">
            <li>✓ تعمل على أي هاتف بدون تحميل تطبيق</li>
            <li>✓ صور، أسعار، ومكوّنات لكل طبق</li>
            <li>✓ تحديث لحظي من لوحة تحكّمك</li>
          </ul>
          <div className="mt-8 flex justify-center lg:justify-end">
            <CTA>أنشئ قائمة مثل هذه</CTA>
          </div>
        </div>

        <div className="flex justify-center">
          <PhoneFrame>
            <LiveMenu />
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}
