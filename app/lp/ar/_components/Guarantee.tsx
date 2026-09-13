import { ShieldCheck } from 'lucide-react';

// 11/12. GUARANTEE — risk reversal.
export function Guarantee() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl border-2 border-dashed border-yellow-400 bg-yellow-50 p-8 text-center sm:flex-row sm:text-right">
        <ShieldCheck className="h-16 w-16 shrink-0 text-yellow-600" />
        <div>
          <h2 className="text-2xl font-extrabold">ضمان 30 يومًا — بلا مخاطرة</h2>
          <p className="mt-2 text-neutral-700">
            جرّب MangeQR لمدة 30 يومًا. إن لم تجد أنه سهّل إدارة قائمتك ووفّر عليك
            الوقت والمال، نعيد لك كامل المبلغ — دون أسئلة ودون تعقيد.
          </p>
        </div>
      </div>
    </section>
  );
}
