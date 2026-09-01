"use client";

import Image from "next/image";

import { cn } from "@/Backend/server/utils";

type MentorAvatarProps = {
  src?: string | null;
  alt: string;
  fallback: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  priority?: boolean;
};

export function MentorAvatar({
  src,
  alt,
  fallback,
  className,
  imageClassName,
  fallbackClassName,
  priority = false,
}: MentorAvatarProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-slate-600",
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={80}
          height={80}
          quality={85}
          priority={priority}
          className={cn("aspect-square size-full object-cover", imageClassName)}
        />
      ) : (
        <span className={cn("text-sm font-medium uppercase", fallbackClassName)}>{fallback}</span>
      )}
    </div>
  );
}
