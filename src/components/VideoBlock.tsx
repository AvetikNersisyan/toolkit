"use client";

import { useState } from "react";
import type { ProductVideo } from "@/data/products";
import { PlayIcon } from "./Icons";

/** `video` is null when there is no video file yet: shows a placeholder. */
export function VideoBlock({ video }: { video: ProductVideo | null }) {
  const [ytLoaded, setYtLoaded] = useState(false);

  if (!video) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#6b747c] bg-[#2a2e32] p-4 text-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent">
          <PlayIcon className="h-7 w-7 text-white" />
        </div>
        <div className="font-bold">Տեսանյութ՝ 15–30 վրկ</div>
        <div className="text-sm text-[#c9ced2]">Ավելացրեք demo.mp4 ֆայլը կամ YouTube հղումը products.ts-ում</div>
      </div>
    );
  }

  if (video.type === "mp4") {
    return (
      <video
        className="aspect-video w-full rounded-xl bg-black object-contain"
        src={video.src}
        poster={video.poster}
        controls
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  // YouTube: load the heavy iframe only after a tap.
  return ytLoaded ? (
    <iframe
      className="aspect-video w-full rounded-xl"
      src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
      title="Տեսանյութ"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  ) : (
    <button
      type="button"
      onClick={() => setYtLoaded(true)}
      aria-label="Դիտել տեսանյութը"
      className="relative block aspect-video w-full overflow-hidden rounded-xl bg-black"
      style={{ backgroundImage: `url(https://i.ytimg.com/vi/${video.id}/hqdefault.jpg)`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <span className="absolute left-1/2 top-1/2 flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent">
        <PlayIcon className="h-7 w-7 text-white" />
      </span>
    </button>
  );
}
