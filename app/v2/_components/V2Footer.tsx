import Link from 'next/link';

import Logo from '@/components/Logo';

const LINKS = [
  { label: 'Tarifs', href: '/#tarifs' },
  { label: 'Se connecter', href: '/auth/sign-in' },
  { label: 'Créer un compte', href: '/auth/sign-up' },
  { label: 'Voir un menu', href: '/artisto' }
];

/** Quiet editorial footer coherent with the v2 system. */
export default function V2Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
        <Link href="/v2" aria-label="MangeQR" className="flex items-center">
          <Logo />
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} MangeQR
        </p>
      </div>
    </footer>
  );
}
