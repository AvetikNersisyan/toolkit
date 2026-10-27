import Image from "next/image";
import { site } from "@/data/site";

// Transparent PNGs made from the brand artwork, ~4x their on-screen height so they stay sharp on phones.
const LOGOS = {
  light: { src: "/brand/logo-on-light.png", width: 787, height: 160 }, // dark lettering, for white backgrounds
  dark: { src: "/brand/logo-on-dark.png", width: 799, height: 160 }, // white lettering, for dark backgrounds
};

/** `on` is the background the logo sits on. Set the height with `className` (e.g. "h-8"). */
export function Logo({ on, className = "", priority = false }: { on: "light" | "dark"; className?: string; priority?: boolean }) {
  const logo = LOGOS[on];
  return (
    <Image
      src={logo.src}
      width={logo.width}
      height={logo.height}
      alt={site.shopName}
      priority={priority}
      sizes="220px"
      className={`w-auto ${className}`}
    />
  );
}
