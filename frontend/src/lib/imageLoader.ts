import type { ImageLoaderProps } from 'next/image';

const MEDIA_URL = process.env.NEXT_PUBLIC_MEDIA_URL || 'https://img.narayanenterprise.in';
const VARIANT_WIDTHS = [400, 800];

export function sizedImageUrl(src: string, width: number): string {
  if (!src?.startsWith(MEDIA_URL) || !src.endsWith('.webp')) return src;
  const variant = VARIANT_WIDTHS.find((w) => width <= w);
  return variant ? src.replace(/\.webp$/, `-w${variant}.webp`) : src;
}

export default function mediaLoader({ src, width }: ImageLoaderProps): string {
  return sizedImageUrl(src, width);
}
