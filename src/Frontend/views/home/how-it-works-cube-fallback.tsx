export function HowItWorksCubeFallback() {
  return (
    <svg
      viewBox="0 0 320 320"
      className="mx-auto block aspect-square h-full w-full max-w-[460px] overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="how-it-works-cube-haze">
          <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4F46E5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="how-it-works-cube-core">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" />
          <stop offset="42%" stopColor="#7C3AED" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="160" cy="160" rx="146" ry="142" fill="url(#how-it-works-cube-haze)" />

      <g
        transform="translate(160 150) scale(1.3) translate(-160 -150)"
        fill="#4F46E5"
        fillOpacity="0.06"
        stroke="#C7D2FE"
        strokeOpacity="0.8"
        strokeWidth="1.5"
      >
        <polygon points="160,58 250,100 160,142 70,100" />
        <polygon points="70,100 160,142 160,242 70,200" />
        <polygon points="250,100 160,142 160,242 250,200" />
      </g>

      <circle cx="160" cy="142" r="34" fill="url(#how-it-works-cube-core)" />
      <circle cx="160" cy="142" r="7" fill="#A5B4FC" fillOpacity="0.82" />
      <image
        href="/brand/mentra-icon.png"
        x="143"
        y="76"
        width="34"
        height="42"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
