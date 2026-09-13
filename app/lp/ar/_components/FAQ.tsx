'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// 13. FAQ — eliminate remaining purchase objections.
const FAQS = [
  {
    q: 'هل MangeQR مناسب لمطعمي؟',
    a: 'نعم. سواء كنت مطعمًا، مقهى، محل وجبات سريعة أو شاحنة طعام، إن كنت تقدّم قائمة طعام فـ MangeQR صُمّم لك.',
  },
  {
    q: 'كم يستغرق الإعداد؟',
    a: 'أقل من دقيقتين لإنشاء قائمتك الأولى ورمز QR الخاص بها. يمكنك البدء فورًا دون انتظار.',
  },
  {
    q: 'هل أحتاج إلى معرفة تقنية؟',
    a: 'إطلاقًا. كل شيء بالعربية وبسيط، ونرافقك في الإعداد. إن عرفت استعمال هاتفك، تعرف استعمال MangeQR.',
  },
  {
    q: 'ماذا يحدث بعد التسجيل؟',
    a: 'تنشئ مطعمك، تضيف أطباقك (أو تستوردها)، فتحصل على رمز QR جاهز للطباعة والاستعمال في مطعمك مباشرة.',
  },
  {
    q: 'هل يمكنني الإلغاء في أي وقت؟',
    a: 'نعم، بدون التزام وبدون رسوم إلغاء. أنت حرّ في الإلغاء متى شئت.',
  },
  {
    q: 'كيف يختلف عن قائمة PDF عادية؟',
    a: 'قائمة PDF ثابتة وثقيلة ويصعب تحديثها. MangeQR قائمة حيّة سريعة، تحدّثها لحظيًا، وتمنحك تقييمات وإحصائيات وتسويقًا في آنٍ واحد.',
  },
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-right"
      >
        <span className="text-lg font-bold text-neutral-900">{q}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-neutral-500 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && <p className="pb-5 text-neutral-600">{a}</p>}
    </div>
  );
}

export function FAQ() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-extrabold sm:text-4xl">
          أسئلة شائعة
        </h2>
        <div className="mt-10">
          {FAQS.map((f) => (
            <Item key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
