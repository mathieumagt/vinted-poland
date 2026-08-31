"use client";

import { useState } from "react";

export function ZoomableImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [hover, setHover] = useState(false);

  return (
    <>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="h-full w-full"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={className} />
      </div>
      {hover && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="h-[85vh] w-[85vw] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
