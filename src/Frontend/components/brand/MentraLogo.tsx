import Image from "next/image";

export type MentraLogoVariant = "light" | "dark" | "color";
export type MentraLogoSize = "sm" | "md" | "lg";
export type MentraLogoLayout = "horizontal" | "stacked" | "icon";

export type MentraLogoProps = {
  variant?: MentraLogoVariant;
  layout?: MentraLogoLayout;
  showTagline?: boolean;
  size?: MentraLogoSize;
  className?: string;
  alt?: string;
  priority?: boolean;
};

const horizontalWithTaglineSizes = {
  sm: { width: 156, height: 40 },
  md: { width: 180, height: 46 },
  lg: { width: 215, height: 55 },
} as const;

const horizontalSizes = {
  sm: { width: 147, height: 36 },
  md: { width: 172, height: 42 },
  lg: { width: 204, height: 50 },
} as const;

const stackedSizes = {
  sm: { width: 57, height: 48 },
  md: { width: 75, height: 64 },
  lg: { width: 95, height: 80 },
} as const;

const iconSizes = {
  sm: { width: 35, height: 40 },
  md: { width: 44, height: 50 },
  lg: { width: 52, height: 60 },
} as const;

export function MentraLogo({
  variant = "color",
  layout = "horizontal",
  showTagline = true,
  size = "md",
  className,
  alt = "Mentra - Your Senior Friend · Your Guide",
  priority = false,
}: MentraLogoProps) {
  let src = "/brand/mentra-logo-horizontal-tagline.png";
  let width: number = horizontalWithTaglineSizes[size].width;
  let height: number = horizontalWithTaglineSizes[size].height;

  if (layout === "horizontal") {
    if (showTagline) {
      src = "/brand/mentra-logo-horizontal-tagline.png";
      width = horizontalWithTaglineSizes[size].width;
      height = horizontalWithTaglineSizes[size].height;
    } else {
      src = "/brand/mentra-logo-horizontal.png";
      width = horizontalSizes[size].width;
      height = horizontalSizes[size].height;
    }
  } else if (layout === "stacked") {
    if (showTagline) {
      src = "/brand/mentra-logo-approved-transparent.png";
      const dims = stackedSizes[size];
      width = dims.width;
      height = Math.round(dims.width * (739 / 874));
    } else {
      src = "/brand/mentra-logo-stacked.png";
      const dims = stackedSizes[size];
      width = dims.width;
      height = Math.round(dims.width * (672 / 874));
    }
  } else if (layout === "icon") {
    src = "/brand/mentra-icon.png";
    const dims = iconSizes[size];
    width = dims.width;
    height = dims.height;
  }

  const filter =
    variant === "light"
      ? "brightness(0) invert(1)"
      : variant === "dark"
        ? "brightness(0.95)"
        : "none";

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        lineHeight: 0,
        flexShrink: 0,
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="block h-auto w-auto max-h-full max-w-full select-none object-contain"
        style={{ filter }}
      />
    </div>
  );
}