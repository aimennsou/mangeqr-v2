import { XCircle } from 'lucide-react';

// 3. PROBLEM AGITATION — make the visitor feel understood.
const PAINS = [
  'تطبع قائمة جديدة في كل مرة تغيّر فيها سعرًا أو تضيف طبقًا — تكلفة تتكرر بلا نهاية.',
  'قوائمك الورقية تتّسخ وتتمزّق، وتعطي انطباعًا سيّئًا عن مطعمك.',
  'لا تعرف أي طبق يجذب زبائنك فعلاً، ولا كيف تتّخذ قرارًا مبنيًا على أرقام.',
  'الحلول الأخرى معقّدة، تتطلّب خبرة تقنية أو مصمّمًا، وتضيّع وقتك.',
];

export function Problem() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-extrabold leading-snug sm:text-4xl">
          لا يجب أن تخسر الوقت والمال في قوائم ورقية قديمة
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600">
          كل أسبوع يمرّ بالطريقة القديمة يكلّفك مالًا، زبائن، وفرصًا ضائعة.
        </p>

        <div className="mt-10 grid gap-4 text-right sm:grid-cols-2">
          {PAINS.map((p) => (
            <div
              key={p}
              className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-5"
            >
              <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-500" />
              <p className="text-neutral-700">{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
