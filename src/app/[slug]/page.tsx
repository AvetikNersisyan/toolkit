import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CountdownBar, CountdownBoxes } from "@/components/Countdown";
import { Gallery } from "@/components/Gallery";
import {
  BoxOpenIcon,
  CashIcon,
  CheckIcon,
  ChevronDownIcon,
  GiftIcon,
  PhoneIcon,
  ShieldIcon,
  TruckIcon,
} from "@/components/Icons";
import { OrderSection } from "@/components/OrderSection";
import { Placeholder } from "@/components/Placeholder";
import { StickyOrderBar } from "@/components/StickyOrderBar";
import { TrackViewContent } from "@/components/TrackViewContent";
import { VideoBlock } from "@/components/VideoBlock";
import { getProduct, products, type ProductVideo } from "@/data/products";
import { site } from "@/data/site";
import { existing } from "@/lib/assets";
import { discountPercent, formatAmd } from "@/lib/format";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) return {};
  const image = existing(p.images[0]);
  return {
    title: `${p.name} — ${formatAmd(p.price)} | ${site.shopName}`,
    description: p.metaDescription,
    openGraph: {
      title: `${p.name} — ${formatAmd(p.price)}`,
      description: p.metaDescription,
      images: image ? [image] : undefined,
      locale: "hy_AM",
      type: "website",
    },
  };
}

const sectionTitle = "m-0 text-[clamp(24px,3vw,32px)] font-extrabold leading-tight";

export default async function ProductPage({ params }: Params) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const images = product.images.map(existing);
  const boxImage = existing(product.boxImage);
  let video: ProductVideo | null = product.video ?? null;
  if (video?.type === "mp4" && !existing(video.src)) video = null;
  if (video?.type === "mp4" && video.poster && !existing(video.poster)) video = { ...video, poster: undefined };

  const discount = discountPercent(product.price, product.oldPrice);
  const related = (product.related ?? []).map(getProduct).filter((p) => p !== undefined);

  const faq = [
    { q: "Ինչպե՞ս է կատարվում վճարումը", a: "Վճարում եք ապրանքը ստանալիս՝ կանխիկ [կամ քարտով]։ Կանխավճար չի պահանջվում։" },
    {
      q: "Որքա՞ն ժամանակում կառաքեք",
      a: `Երևանում՝ ${site.delivery.yerevanDays} օրում, մարզերում՝ ${site.delivery.regionsDays} օրում։`,
    },
    {
      q: "Ի՞նչ երաշխիք կա",
      a: `${site.warrantyMonths} ամիս երաշխիք մեր խանութից։ Թերության դեպքում կփոխարինենք գործիքը։ Ստանալիս կարող եք բացել և ստուգել այն մինչև վճարելը։`,
    },
    { q: "Կարո՞ղ եմ վերադարձնել ապրանքը", a: `Այո, ${site.returnDays} օրվա ընթացքում, եթե ապրանքը չի օգտագործվել։` },
    ...(product.faq ?? []),
  ];

  const messengers = Object.entries(site.messengers).filter(([, url]) => url) as [string, string][];
  const messengerLabel: Record<string, string> = { whatsapp: "WhatsApp", viber: "Viber", telegram: "Telegram" };

  return (
    <div className="pb-[76px]">
      <TrackViewContent slug={product.slug} name={product.name} price={product.price} />
      <CountdownBar offerEnd={product.offerEnd} note="Վճարում ստանալիս · Կանխավճար չկա" />

      <header className="border-b border-line px-4">
        <div className="mx-auto flex min-h-14 max-w-[1120px] items-center justify-between gap-3">
          <div className="min-w-0 truncate text-lg font-extrabold tracking-wide sm:text-xl">{site.shopName}</div>
          <a
            href={`tel:${site.phone}`}
            aria-label={`Զանգահարել ${site.phoneDisplay}`}
            className="flex min-h-11 min-w-11 flex-none items-center justify-center gap-2 font-bold"
          >
            <PhoneIcon className="h-5 w-5" />
            <span className="hidden sm:inline">{site.phoneDisplay}</span>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pb-12 pt-8">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-start gap-10">
          <div className="min-w-0 flex-[1_1_420px]">
            <Gallery images={images} alt={product.name} />
          </div>

          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-[18px]">
            <div className="flex flex-wrap gap-2">
              {discount ? <span className="rounded-md bg-highlight px-2.5 py-1 text-[13px] font-bold">Ակցիա</span> : null}
              {product.gift ? (
                <span className="flex items-center gap-1.5 rounded-md bg-[#dcfce7] px-2.5 py-1 text-[13px] font-bold text-[#14532d]">
                  <GiftIcon className="h-4 w-4" />
                  {product.gift}
                </span>
              ) : null}
            </div>
            <h1 className="m-0 text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.15]">{product.name}</h1>
            <p className="m-0 text-lg text-ink-2">{product.subheadline}</p>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2.5">
                  <CheckIcon className="h-5 w-5 flex-none text-ok" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3.5 rounded-xl border border-line bg-soft p-5">
              <CountdownBoxes offerEnd={product.offerEnd} />
              {product.oldPrice && discount ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  <s className="text-lg text-muted">{formatAmd(product.oldPrice)}</s>
                  <span className="rounded-md bg-sale px-2 py-0.5 text-sm font-bold text-white">-{discount}%</span>
                </div>
              ) : null}
              <div className="text-[40px] font-extrabold leading-none">{formatAmd(product.price)}</div>
              {product.oldPrice && discount ? (
                <div className="text-[15px] font-bold text-ok">Խնայում եք {formatAmd(product.oldPrice - product.price)}</div>
              ) : null}
              <a
                href="#order"
                className="flex min-h-14 items-center justify-center rounded-[10px] bg-accent text-lg font-extrabold text-white hover:bg-accent-dark"
              >
                Պատվիրել հիմա
              </a>
              <div className="flex items-center justify-center gap-2 text-center text-sm text-ink-2">
                <CashIcon className="h-[18px] w-[18px]" />
                <span>Վճարում եք միայն ստանալիս</span>
              </div>
            </div>
            {product.stockNote ? <div className="text-sm font-bold text-sale">{product.stockNote}</div> : null}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-line bg-soft px-4 py-6">
        <div className="mx-auto flex max-w-[1120px] flex-wrap gap-4">
          {[
            { icon: <BoxOpenIcon className="h-8 w-8" />, title: "Ստուգեք, հետո վճարեք", text: "Բացեք տուփը առաքիչի մոտ" },
            { icon: <ShieldIcon className="h-8 w-8" />, title: `${site.warrantyMonths} ամիս երաշխիք`, text: "Թերության դեպքում կփոխարինենք" },
            { icon: <TruckIcon className="h-8 w-8" />, title: `Առաքում ${site.delivery.yerevanDays} օրում`, text: "Երևան և մարզեր" },
            { icon: <CashIcon className="h-8 w-8" />, title: "Վճարում ստանալիս", text: "Կանխիկ կամ քարտով" },
          ].map((t) => (
            <div key={t.title} className="flex flex-[1_1_220px] items-center gap-3">
              {t.icon}
              <div>
                <div className="font-bold">{t.title}</div>
                <div className="text-sm text-muted">{t.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-14">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-7">
          <h2 className={sectionTitle}>Ինչու՞ այս գործիքը</h2>
          <div className="flex flex-wrap gap-4">
            {product.benefits.map((b) => (
              <div key={b.title} className="flex flex-[1_1_240px] flex-col gap-2 rounded-xl border border-line p-5">
                <div className="text-[28px] font-extrabold text-accent">{b.value}</div>
                <div className="font-bold">{b.title}</div>
                <div className="text-[15px] text-muted">{b.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="bg-ink px-4 py-14 text-white">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
          <h2 className={sectionTitle}>Տեսեք աշխատանքի մեջ</h2>
          <VideoBlock video={video} />
        </div>
      </section>

      {/* Specs + box */}
      <section className="px-4 py-14">
        <div className="mx-auto flex max-w-[1120px] flex-wrap gap-10">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5">
            <h2 className={sectionTitle}>Տեխնիկական բնութագիր</h2>
            <dl className="m-0 overflow-hidden rounded-xl border border-line">
              {product.specs.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex justify-between gap-4 px-4 py-3.5 ${i % 2 ? "bg-soft" : ""} ${
                    i < product.specs.length - 1 ? "border-b border-line" : ""
                  }`}
                >
                  <dt className="text-muted">{s.label}</dt>
                  <dd className="m-0 text-right font-bold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-5">
            <h2 className={sectionTitle}>Տուփի պարունակությունը</h2>
            {boxImage ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-placeholder">
                <Image src={boxImage} alt="Տուփի պարունակությունը" fill sizes="(max-width: 860px) 100vw, 480px" className="object-cover" />
              </div>
            ) : (
              <Placeholder className="aspect-[4/3]" label="Տուփի պարունակության լուսանկար" hint="Բոլոր պարագաները դասավորված սեղանին" />
            )}
            <ul className="m-0 flex flex-col gap-1.5 pl-5">
              {product.inTheBox.map((item) => (
                <li key={item} className="list-disc">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How to order */}
      <section className="px-4 pt-14">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
          <h2 className={sectionTitle}>Ինչպե՞ս պատվիրել</h2>
          <ol className="m-0 flex list-none flex-wrap gap-4 p-0">
            {[
              ["Թողեք անունն ու հեռախոսը", "Ընդամենը 2 դաշտ, 10 վայրկյան"],
              ["Մենք կզանգահարենք", "Կհաստատենք պատվերն ու հասցեն"],
              ["Ստացեք և վճարեք", "Ստուգեք գործիքը, հետո վճարեք առաքիչին"],
            ].map(([title, text], i) => (
              <li key={title} className="flex flex-[1_1_260px] items-start gap-3.5">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-ink text-lg font-extrabold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="font-bold">{title}</div>
                  <div className="text-[15px] text-muted">{text}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Order */}
      <section id="order" className="px-4 py-14">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
          <h2 className={sectionTitle}>Պատվիրել</h2>
          <OrderSection
            product={{ slug: product.slug, name: product.name, price: product.price, oldPrice: product.oldPrice, addon: product.addon }}
            image={images[0]}
            deliveryPriceText={site.delivery.priceText}
            callbackMinutes={site.callbackMinutes}
          />
          {messengers.length ? (
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="mr-1.5 font-bold">Հարց ունե՞ք, գրեք մեզ՝</span>
              {messengers.map(([key, url]) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center rounded-full border border-[#8a939a] px-4 font-medium hover:bg-soft"
                >
                  {messengerLabel[key] ?? key}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-soft px-4 py-14">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4">
          <h2 className={`${sectionTitle} mb-2`}>Հաճախ տրվող հարցեր</h2>
          {faq.map((f) => (
            <details key={f.q} className="rounded-[10px] border border-line bg-white">
              <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 p-4 font-bold">
                {f.q}
                <ChevronDownIcon className="faq-chevron h-5 w-5 flex-none transition-transform" />
              </summary>
              <p className="m-0 px-4 pb-4 text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related */}
      {related.length ? (
        <section className="px-4 py-14">
          <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
            <h2 className={sectionTitle}>Այլ գործիքներ</h2>
            <div className="flex flex-wrap gap-4">
              {related.map((r) => {
                const img = existing(r.images[0]);
                return (
                  <Link
                    key={r.slug}
                    href={`/${r.slug}`}
                    className="flex max-w-[360px] flex-[1_1_240px] flex-col gap-2.5 rounded-xl border border-line p-4 hover:border-ink"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg bg-placeholder">
                      {img ? (
                        <Image src={img} alt={r.name} fill sizes="300px" className="object-contain" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted">Լուսանկար</div>
                      )}
                    </div>
                    <div className="font-bold">{r.name}</div>
                    <div className="font-extrabold">{formatAmd(r.price)}</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="bg-ink px-4 py-8 text-sm text-[#c9ced2]">
        <div className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="text-base font-extrabold text-white">{site.shopName}</div>
            <div>
              {site.address} · {site.workingHours}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <a href={`tel:${site.phone}`}>{site.phoneDisplay}</a>
            <div>{site.legalName}</div>
          </div>
        </div>
      </footer>

      <StickyOrderBar price={product.price} />
    </div>
  );
}
