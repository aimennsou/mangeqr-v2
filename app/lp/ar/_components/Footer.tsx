import Link from 'next/link';

// 15. FOOTER — minimal, no big navigation to distract from the CTA.
export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-lg">
            🍽️
          </span>
          <span className="text-lg font-extrabold">MangeQR</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-neutral-600">
          <Link href="/pricing" className="hover:text-neutral-900">
            الأسعار
          </Link>
          <Link href="/auth/sign-in" className="hover:text-neutral-900">
            تسجيل الدخول
          </Link>
          <Link href="/" className="hover:text-neutral-900">
            الموقع الكامل
          </Link>
        </nav>

        <p className="text-sm text-neutral-400">
          © {new Date().getFullYear()} MangeQR
        </p>
      </div>
    </footer>
  );
}
