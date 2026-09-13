import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RestaurantNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Restaurant introuvable</h1>
      <p className="max-w-md text-muted-foreground">
        Ce menu n&apos;existe pas ou n&apos;est plus disponible. Vérifiez le lien
        ou scannez à nouveau le QR code.
      </p>
      <Button asChild className="text-black">
        <Link href="/">Retour à l&apos;accueil</Link>
      </Button>
    </div>
  );
}
