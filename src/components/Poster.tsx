"use client";

import Image from "next/image";

export default function Poster({ url, title, size = 342 }: { url: string | null; title: string; size?: 92 | 154 | 185 | 342 | 500 | 780 }) {
  const width = size;
  const height = Math.round((size * 3) / 2); // 2:3 aspect

  if (url) {
    return (
      <Image
        src={url}
        alt={title}
        width={width}
        height={height}
        className="w-full h-auto object-cover"
        priority={false}
      />
    );
  }

  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative w-full" style={{ aspectRatio: "2 / 3" }}>
      <div className="absolute inset-0 rounded bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
        <span className="text-3xl font-semibold opacity-70">{initials || "?"}</span>
      </div>
    </div>
  );
}


