// One entry per landing page. The URL is /<slug> (e.g. /hammer-drill).
// Prices are in AMD. Everything in [brackets] is a placeholder to replace.
//
// Images: put files in /public/products/<slug>/ and list them as
// "/products/<slug>/main.jpg". A missing image shows a labelled placeholder.

export type ProductVideo =
  | { type: "mp4"; src: string; poster?: string }
  | { type: "youtube"; id: string };

export type Product = {
  slug: string;
  /** Full name used in the title, order summary and admin. */
  name: string;
  /** Short name for cards ("Անկյունային հղկիչ"). */
  shortName: string;
  brand: string;

  price: number;
  oldPrice?: number;
  /** Real end of the current offer, ISO with timezone. Omit to hide the countdown. */
  offerEnd?: string;
  /** e.g. "Նվեր՝ 2 հատ ածուխ". Omit to hide the gift badge. */
  gift?: string;
  /** e.g. "Պահեստում մնացել է 12 հատ". Only use real numbers. */
  stockNote?: string;

  subheadline: string;
  highlights: string[];
  benefits: { value: string; title: string; text: string }[];
  specs: { label: string; value: string }[];
  inTheBox: string[];

  /** First image is the main one; ideally the same photo as the ad. */
  images: string[];
  boxImage?: string;
  video?: ProductVideo;

  addon?: { name: string; price: number; note?: string };
  faq?: { q: string; a: string }[];
  /** Slugs of other products shown at the bottom. */
  related?: string[];
  /** Meta share preview text. */
  metaDescription: string;
};

export const products: Product[] = [
  {
    slug: "hammer-drill",
    name: "Պերֆորատոր [ԲՐԵՆԴ] [ՄՈԴԵԼ]",
    shortName: "Պերֆորատոր",
    brand: "[ԲՐԵՆԴ]",
    price: 45000,
    oldPrice: 59000,
    offerEnd: "2026-10-31T23:59:00+04:00",
    gift: "Նվեր՝ [գայլիկոնների հավաքածու]",
    stockNote: "Պահեստում մնացել է [__] հատ",
    subheadline:
      "Հորատում է բետոն, աղյուս և մետաղ առանց ավելորդ ջանքի։ [__] Վտ, SDS-plus պատրոն, 3 աշխատանքային ռեժիմ։",
    highlights: [
      "Հարվածի էներգիա՝ [__] Ջ",
      "Կեյս և լրացուցիչ բռնակ՝ հավաքածուում",
      "[3] ամիս երաշխիք մեր խանութից",
    ],
    benefits: [
      { value: "[__] Վտ", title: "Բարձր հզորություն", text: "Հեշտությամբ անցնում է բետոնի և աղյուսի միջով։" },
      { value: "3 ռեժիմ", title: "Մեկ գործիք՝ երեք աշխատանք", text: "Հորատում, հարվածով հորատում և ջարդում։" },
      { value: "[__] կգ", title: "Հարմար և հավասարակշռված", text: "Ձեռքը չի հոգնում նույնիսկ երկար աշխատանքի ժամանակ։" },
      { value: "SDS-plus", title: "Արագ գայլիկոնափոխություն", text: "Գայլիկոնը փոխվում է վայրկյանների ընթացքում՝ առանց բանալու։" },
    ],
    specs: [
      { label: "Հզորություն", value: "[__] Վտ" },
      { label: "Հարվածի էներգիա", value: "[__] Ջ" },
      { label: "Պտույտներ", value: "[__] պտ/րոպե" },
      { label: "Հարվածներ", value: "[__] հարված/րոպե" },
      { label: "Առավելագույն տրամագիծ (բետոն)", value: "[__] մմ" },
      { label: "Պատրոն", value: "SDS-plus" },
      { label: "Քաշ", value: "[__] կգ" },
      { label: "Երաշխիք", value: "[3] ամիս" },
    ],
    inTheBox: ["Պերֆորատոր", "Պլաստիկ կեյս", "Լրացուցիչ բռնակ", "Խորության սահմանափակիչ", "[Գայլիկոնների հավաքածու]"],
    images: [
      "/products/hammer-drill/main.jpg",
      "/products/hammer-drill/2.jpg",
      "/products/hammer-drill/3.jpg",
      "/products/hammer-drill/4.jpg",
    ],
    boxImage: "/products/hammer-drill/box.jpg",
    video: { type: "mp4", src: "/products/hammer-drill/demo.mp4", poster: "/products/hammer-drill/main.jpg" },
    addon: { name: "Գայլիկոնների լրացուցիչ հավաքածու", price: 8000, note: "միայն այս պատվերի հետ" },
    faq: [
      { q: "Կհորատի՞ ամուր բետոն", a: "[Պատասխան՝ ըստ մոդելի բնութագրի]" },
    ],
    related: ["angle-grinder"],
    metaDescription: "Պերֆորատոր [ԲՐԵՆԴ]՝ բետոնի, աղյուսի և մետաղի համար։ Վճարում ստանալիս, առաքում ամբողջ Հայաստանում։",
  },
  {
    slug: "angle-grinder",
    name: "Անկյունային հղկիչ [ԲՐԵՆԴ] [ՄՈԴԵԼ]",
    shortName: "Անկյունային հղկիչ",
    brand: "[ԲՐԵՆԴ]",
    price: 19900,
    oldPrice: 26000,
    offerEnd: "2026-10-31T23:59:00+04:00",
    gift: "Նվեր՝ [2 հատ ածուխ]",
    subheadline:
      "Կտրում և հղկում է մետաղ, քար և սալիկ։ [1100] Վտ, արագության կարգավորում, 115–125 մմ սկավառակներ։",
    highlights: [
      "Արագության կարգավորում՝ [6] ռեժիմ",
      "Մետաղական ռեդուկտոր",
      "[3] ամիս երաշխիք մեր խանութից",
    ],
    benefits: [
      { value: "[1100] Վտ", title: "Հզոր շարժիչ", text: "Չի կանգնում ծանրաբեռնվածության տակ։" },
      { value: "[6] ռեժիմ", title: "Արագության կարգավորում", text: "Ցածր արագություն՝ հղկման, բարձր՝ կտրելու համար։" },
      { value: "115–125 մմ", title: "Տարբեր սկավառակներ", text: "Կտրող, հղկող և մաքրող սկավառակներ։" },
      { value: "Մետաղ", title: "Ամուր ռեդուկտոր", text: "Մետաղական պատյանը երկար է ծառայում։" },
    ],
    specs: [
      { label: "Հզորություն", value: "[1100] Վտ" },
      { label: "Պտույտներ", value: "[__–11000] պտ/րոպե" },
      { label: "Սկավառակի տրամագիծ", value: "115–125 մմ" },
      { label: "Լարում", value: "220 Վ" },
      { label: "Քաշ", value: "[__] կգ" },
      { label: "Երաշխիք", value: "[3] ամիս" },
    ],
    inTheBox: ["Անկյունային հղկիչ", "Պաշտպանիչ պատյան", "Կողային բռնակ", "Բանալի", "[2 հատ ածուխ՝ նվեր]"],
    images: [
      "/products/angle-grinder/main.jpg",
      "/products/angle-grinder/2.jpg",
      "/products/angle-grinder/3.jpg",
      "/products/angle-grinder/4.jpg",
    ],
    boxImage: "/products/angle-grinder/box.jpg",
    addon: { name: "10 կտրող սկավառակ", price: 3500, note: "միայն այս պատվերի հետ" },
    related: ["hammer-drill"],
    metaDescription: "Անկյունային հղկիչ [ԲՐԵՆԴ]՝ արագության կարգավորումով։ Վճարում ստանալիս, առաքում ամբողջ Հայաստանում։",
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
