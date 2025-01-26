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
    theme_color: '#34d399', // Tailwind CSS's emerald-400
  };
}
