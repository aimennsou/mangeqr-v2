import { Button } from '@/components/ui/button';
import Link from 'next/link';



export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center">
      <p className="mb-4 text-4xl font-bold">Ouups!</p>
      <Link href="/">
        <Button>Precedent</Button>
      </Link>
    </div>
  );
}
