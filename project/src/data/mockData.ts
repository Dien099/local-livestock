import { CATEGORY_IMAGES, FALLBACK_IMAGE } from '@/data/regions';

export function getCategoryImage(category: string): string {
  return CATEGORY_IMAGES[category] || FALLBACK_IMAGE;
}
