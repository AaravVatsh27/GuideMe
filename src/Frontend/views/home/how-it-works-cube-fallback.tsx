/** Static cube for reduced motion, small screens and browsers without WebGL. Same colours as the WebGL cube. */
export function HowItWorksCubeFallback() {
  return (
    <svg
      viewBox="0 0 320 320"
      className="mx-auto block aspect-square h-full w-full max-w-[460px] overflow-visible"
      aria-hidden="true"
    >
      <defs>
        {/* The one glow behind the cube, in --glow at low opacity */}
        <radialGradient id="how-it-works-cube-haze">
          <stop offset="0%" stopColor="#C8663A" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#C8663A" stopOpacity="0" />
        </radialGradient>
        {/* Soft accent sphere at the core */}
        <radialGradient id="how-it-works-cube-core">
          <stop offset="0%" stopColor="#F2A65A" stopOpacity="0.55" />
          <stop offset="42%" stopColor="#F2A65A" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#F2A65A" stopOpacity="0" />
        </radialGradient>
        {/* Redraws the purple-to-pink Mentra mark as a solid cream silhouette */}
        <filter id="how-it-works-mark-cream" colorInterpolationFilters="sRGB">
          <feFlood floodColor="#F5E6D3" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
      </defs>

      <ellipse cx="160" cy="160" rx="146" ry="142" fill="url(#how-it-works-cube-haze)" />

      <g transform="translate(160 150) scale(1.3) translate(-160 -150)" strokeWidth="1.5">
        <g fill="#F2A65A" fillOpacity="0.04" stroke="#F5E6D3" strokeOpacity="0.75" strokeLinejoin="round">
          <polygon points="160,58 250,100 160,142 70,100" />
          <polygon points="70,100 160,142 160,242 70,200" />
          <polygon points="250,100 160,142 160,242 250,200" />
        </g>
        {/* Front-facing edges: the three that meet at the corner nearest the viewer */}
        <g stroke="#F2A65A" strokeOpacity="0.9" strokeLinecap="round">
          <line x1="70" y1="100" x2="160" y2="142" />
          <line x1="250" y1="100" x2="160" y2="142" />
          <line x1="160" y1="142" x2="160" y2="242" />
        </g>
      </g>

      <circle cx="160" cy="142" r="34" fill="url(#how-it-works-cube-core)" />
      <circle cx="160" cy="142" r="7" fill="#F2A65A" />
      <circle cx="160" cy="142" r="3" fill="#F5E6D3" />
      <image
        href="/brand/mentra-icon.png"
        x="143"
        y="76"
        width="34"
        height="42"
        preserveAspectRatio="xMidYMid meet"
        filter="url(#how-it-works-mark-cream)"
      />
    </svg>
  );
}
