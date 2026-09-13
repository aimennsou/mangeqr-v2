// 2. PROOF STRIP — answer "why should I believe you?" immediately.
const STATS = [
  { icon: '⭐', value: '4.9/5', label: 'من أكثر من 2,400 عميل' },
  { icon: '🏆', value: '+1,200', label: 'مطعم يستخدمنا' },
  { icon: '📈', value: '+22%', label: 'زيادة في ولاء الزبائن' },
  { icon: '⚡', value: 'دقيقتان', label: 'لإطلاق قائمتك' },
];

export function ProofStrip() {
  return (
    <section className="border-y border-neutral-200 bg-white/70 px-6 py-8">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-1 text-2xl font-extrabold text-neutral-900">
              {s.value}
            </div>
            <div className="mt-0.5 text-sm text-neutral-600">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
