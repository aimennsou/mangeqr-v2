import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="w-full h-22  bg-background px-4">
      <div className="mx-auto px-8 flex py-4 flex-col md:flex-row max-w-container">
        <Logo className="h-6 w-6 text-accent-foreground ml-14 mr-auto" />

        <div className="justify-center">© 2025 MangeQR. Tous droits réservés</div>

<div className="flex ml-auto gap-4">
  <a href="/cgu">Politique de confidentialité</a>
</div>

      </div>
    </footer>
  );
}
