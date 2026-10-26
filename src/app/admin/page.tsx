import { count, desc, eq, gte, sql, sum } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { ORDER_STATUSES, orders, type OrderStatus } from "@/db/schema";
import { formatAmd } from "@/lib/format";
import { updateOrder } from "./actions";
import { STATUS_LABEL, STATUS_STYLE } from "./statuses";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Պատվերներ", robots: { index: false, follow: false } };

const dateFmt = new Intl.DateTimeFormat("hy-AM", {
  timeZone: "Asia/Yerevan",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  const { status: statusParam } = await searchParams;
  const filter = ORDER_STATUSES.includes(statusParam as OrderStatus) ? (statusParam as OrderStatus) : undefined;

  // Start of today in Yerevan.
  const todayStart = sql`date_trunc('day', now() at time zone 'Asia/Yerevan') at time zone 'Asia/Yerevan'`;

  const [list, byStatus, [today]] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(filter ? eq(orders.status, filter) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(200),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
    db
      .select({ n: count(), revenue: sum(orders.total) })
      .from(orders)
      .where(gte(orders.createdAt, todayStart)),
  ]);

  const counts = Object.fromEntries(byStatus.map((r) => [r.status, r.n])) as Partial<Record<OrderStatus, number>>;
  const totalCount = byStatus.reduce((a, r) => a + r.n, 0);

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Պատվերներ</h1>
          <div className="text-sm text-muted">
            Այսօր՝ {today.n} պատվեր · {formatAmd(Number(today.revenue ?? 0))}
          </div>
        </div>
        {/* plain <a>: this is a file download, not a page */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/admin/export" className="flex min-h-11 items-center rounded-lg border border-[#8a939a] px-4 text-sm font-medium hover:bg-soft">
          Ներբեռնել CSV
        </a>
      </div>

      <nav className="mb-5 flex flex-wrap gap-2" aria-label="Ֆիլտր">
        <Link
          href="/admin"
          className={`rounded-full border px-3.5 py-2 text-sm ${!filter ? "border-ink bg-ink text-white" : "border-line"}`}
        >
          Բոլորը ({totalCount})
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin?status=${s}`}
            className={`rounded-full border px-3.5 py-2 text-sm ${filter === s ? "border-ink bg-ink text-white" : "border-line"}`}
          >
            {STATUS_LABEL[s]} ({counts[s] ?? 0})
          </Link>
        ))}
      </nav>

      {list.length === 0 ? (
        <p className="rounded-xl border border-line p-8 text-center text-muted">Պատվերներ դեռ չկան։</p>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((o) => (
            <article key={o.id} className="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border border-line p-4">
              <div className="flex min-w-[220px] flex-[2_1_260px] flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold">№{o.id}</span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                  <span className="text-sm text-muted">{dateFmt.format(o.createdAt)}</span>
                </div>
                <div className="font-bold">{o.customerName}</div>
                <a href={`tel:${o.phone}`} className="w-fit text-lg font-bold text-accent underline-offset-2 hover:underline">
                  {o.phone}
                </a>
              </div>

              <div className="flex min-w-[220px] flex-[2_1_260px] flex-col gap-1 text-sm">
                <div className="font-medium">
                  {o.productName} × {o.qty}
                </div>
                {o.addonName ? <div className="text-muted">+ {o.addonName} ({formatAmd(o.addonPrice)})</div> : null}
                <div className="text-base font-extrabold">{formatAmd(o.total)}</div>
                {o.utmCampaign || o.utmSource ? (
                  <div className="text-xs text-muted">
                    {[o.utmSource, o.utmCampaign, o.utmContent].filter(Boolean).join(" · ")}
                  </div>
                ) : null}
              </div>

              <form action={updateOrder} className="flex min-w-[240px] flex-[1_1_280px] flex-col gap-2">
                <input type="hidden" name="id" value={o.id} />
                <label className="sr-only" htmlFor={`status-${o.id}`}>Կարգավիճակ</label>
                <select
                  id={`status-${o.id}`}
                  name="status"
                  defaultValue={o.status}
                  className="min-h-11 rounded-lg border border-[#8a939a] bg-white px-3"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <label className="sr-only" htmlFor={`note-${o.id}`}>Նշում</label>
                <input
                  id={`note-${o.id}`}
                  name="note"
                  defaultValue={o.note ?? ""}
                  placeholder="Նշում (հասցե, ժամ…)"
                  className="min-h-11 rounded-lg border border-[#8a939a] px-3"
                />
                <button type="submit" className="min-h-11 rounded-lg bg-ink font-bold text-white hover:bg-ink-2">
                  Պահպանել
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
