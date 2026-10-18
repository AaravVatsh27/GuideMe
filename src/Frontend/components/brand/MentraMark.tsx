import Image from "next/image";

type MentraMarkProps = {
  size?: number | string;
  className?: string;
  alt?: string;
};

export function MentraMark({
  size = 64,
  className,
  alt = "Mentra",
}: MentraMarkProps) {
  const resolvedSize = typeof size === "number" ? `${size}px` : size;

  return (
    <div
      className={className}
      style={{
        width: resolvedSize,
        height: resolvedSize,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Image
        src="/brand/mentra-logo-approved.png"
        alt={alt}
        width={512}
        height={512}
        priority={false}
        className="h-full w-full object-cover object-center"
        style={{ objectPosition: "50% 18%" }}
      />
    </div>
  );
}
