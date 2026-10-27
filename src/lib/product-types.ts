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

export type Review = {
  id: number;
  name: string;
  city?: string;
  /** 1–5 */
  rating: number;
  text: string;
  /** "YYYY-MM-DD" */
  date: string;
  photo?: { src: string; width: number; height: number };
  /** Linked to a real order of this product. */
  verified: boolean;
};

export type ReviewSummary = {
  average: number;
  count: number;
  /** How many reviews gave 1, 2, 3, 4 and 5 stars (index 0 = 1 star). */
  counts: [number, number, number, number, number];
};

/** Visible reviews in display order; summary is null when there are none. */
export type ProductReviews = { list: Review[]; summary: ReviewSummary | null };
