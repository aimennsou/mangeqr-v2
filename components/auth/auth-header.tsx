import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import Logo from '../Logo';
import { CardTitle } from '../ui/card';

interface AuthHeaderProps {
  label: string;
}

export function AuthHeader({ label }: AuthHeaderProps) {
  return (
    <div className='w-full flex flex-col gap-y-3 items-center justify-center'>
                  <Link className="mb-4" href="/">
<Logo/>

      </Link>
      <CardTitle className="text-center pb-6 text-2xl">{label}</CardTitle>
    </div>
  );
}
