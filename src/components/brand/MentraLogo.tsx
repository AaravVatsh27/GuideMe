import Image from "next/image";

type MentraLogoVariant = "light" | "dark" | "color";
type MentraLogoSize = "sm" | "md" | "lg";

type MentraLogoProps = {
  variant?: MentraLogoVariant;
  showTagline?: boolean;
  size?: MentraLogoSize;
  className?: string;
  alt?: string;
};

const sizeMap = {
  sm: { width: 160, height: 135 },
  md: { width: 220, height: 186 },
  lg: { width: 300, height: 254 },
} as const;

export function MentraLogo({
  variant = "color",
  showTagline = true,
  size = "md",
  className,
  alt = "Mentra",
}: MentraLogoProps) {
  const { width, height } = sizeMap[size];

  const filter =
    variant === "light" ? "brightness(0) invert(1)" : "none";

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
        src="/brand/mentra-logo-approved-transparent.png"
        alt={alt}
        width={width}
        height={height}
        priority={false}
        className="block h-auto w-full select-none object-contain"
        style={{
          filter,
          objectPosition: showTagline ? "center" : "50% 15%",
        }}
      />
    </div>
  );
}