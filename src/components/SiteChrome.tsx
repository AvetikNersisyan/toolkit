import Link from "next/link";
import { PhoneIcon } from "@/components/Icons";
import { Logo } from "@/components/Logo";
import { site } from "@/data/site";

// Header and footer shared by product pages and the 404 / error pages.
// No server-only imports, so the client-side error page can use them too.

export function SiteHeader() {
  return (
    <header className="border-b border-line px-4">
      <div className="mx-auto flex min-h-14 max-w-[1120px] items-center justify-between gap-3">
        {/* The logo's alt text ("Toolkit.am") names the link for screen readers. */}
        <Link href="/" className="flex min-h-11 flex-none items-center">
          <Logo on="light" priority className="h-8 sm:h-9" />
        </Link>
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
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-ink px-4 py-8 text-sm text-[#c9ced2]">
      <div className="mx-auto flex max-w-[1120px] flex-wrap justify-between gap-4">
        <div className="flex flex-col gap-1">
          {/* self-start: a flex column would otherwise stretch the link (and logo) to the column's width */}
          <Link href="/" className="mb-1 self-start">
            <Logo on="dark" className="h-8" />
          </Link>
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
  );
}

/** Centered message with "home" and "call us" buttons, used by the 404 and error pages. */
export function ProblemPage({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center px-4 py-16">
        <div className="mx-auto flex max-w-[560px] flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
          <p className="text-muted">{text}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {children}
            <Link
              href="/"
              className="flex min-h-12 items-center rounded-lg bg-accent px-6 font-bold text-white hover:bg-accent-dark"
            >
              Գլխավոր էջ
            </Link>
            <a
              href={`tel:${site.phone}`}
              className="flex min-h-12 items-center gap-2 rounded-lg border border-line px-6 font-bold"
            >
              <PhoneIcon className="h-5 w-5" />
              {site.phoneDisplay}
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
