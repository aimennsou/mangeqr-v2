import { type MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MangeQR — Menu QR Restaurant',
    short_name: 'MangeQR',
    description:
      'Créez votre menu numérique QR en 2 minutes. أنشئ قائمة طعام رقمية برمز QR في دقيقتين.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    // Brand gold (Tailwind yellow-400) — matches the landing accent, CTA
    // buttons, and the HolyLoader progress bar.
    theme_color: '#facc15',
    lang: 'fr',
    dir: 'ltr',
    categories: ['business', 'food', 'productivity'],
  };
}
