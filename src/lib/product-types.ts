// Product shape used by the pages and components. Rows come from the database (src/lib/products.ts).
// Plain types only, so client components can import it.

import type { Benefit, Faq, ProductStatus, Spec } from "@/db/schema";

export type { Benefit, Faq, Spec };

export type ProductImage = { id: number; src: string; width: number; height: number };

export type ProductVideo = { type: "mp4"; src: string; poster?: string } | { type: "youtube"; id: string };

export type Product = {
  id: number;
  slug: string;
  status: ProductStatus;
  /** Full name used in the title, order summary and admin. */
  name: string;
  /** Short name for cards. */
  shortName: string;
  brand: string;

  price: number;
  oldPrice?: number;
  /** ISO time. Missing hides the countdown. */
  offerEnd?: string;
  gift?: string;
  stockNote?: string;

  subheadline: string;
  highlights: string[];
  benefits: Benefit[];
  specs: Spec[];
  inTheBox: string[];
  faq: Faq[];

  /** First image is the hero; ideally the same photo as the ad. */
  images: ProductImage[];
  boxImage?: ProductImage;
  video?: ProductVideo;

  addon?: { name: string; price: number; note?: string };
  relatedIds: number[];
  /** Meta share preview text. */
  metaDescription: string;
};
