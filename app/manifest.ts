import { type MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MangeQR',
    short_name: 'MangeQR',
    description:
      'Transformez vos menus avec MangeQR : une solution moderne et intuitive pour la gestion des restaurants.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    // Brand gold (Tailwind yellow-400) — matches the landing accent, the CTA
    // buttons and the HolyLoader progress bar. Was emerald-400, which belonged
    // to no part of the product.
    theme_color: '#facc15',
  };
}
