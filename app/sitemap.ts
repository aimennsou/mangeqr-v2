import { type MetadataRoute } from 'next'



export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.mangeqr.com'

  
  // Add the homepage
  const routes: MetadataRoute.Sitemap = [{
    url: baseUrl,
    lastModified: new Date(),
  }]


  return routes
}

