type LogoProps = { size?: number; className?: string; decorative?: boolean };

/**
 * Lesson Squeezy brand mark. Colors are fixed so it looks the same in every theme.
 * Babyblue tile, lemon-yellow slice, pink and white sparkles.
 */
export function Logo({ size = 32, className, decorative = true }: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      {...(decorative
        ? { "aria-hidden": true, focusable: false }
        : { role: "img", "aria-label": "Lesson Squeezy logo" })}
    >
      <rect width="64" height="64" rx="16" fill="#BEE0FE" />
      <g transform="translate(30 36)">
        <circle r="19" fill="#FFD966" />
        <circle r="16.5" fill="#FFF3C6" />
        <circle r="14.5" fill="#FFE58F" />
        {[
          [14.5, 0], [10.25, 10.25], [0, 14.5], [-10.25, 10.25],
          [-14.5, 0], [-10.25, -10.25], [0, -14.5], [10.25, -10.25],
        ].map(([x, y], i) => (
          <line key={i} x1="0" y1="0" x2={x} y2={y} stroke="#FFF3C6" strokeWidth="1.8" strokeLinecap="round" />
        ))}
        <circle r="1.8" fill="#FFF3C6" />
      </g>
      <path transform="translate(48 17) scale(1.15)" d="M0,-10 Q1.5,-1.5 10,0 Q1.5,1.5 0,10 Q-1.5,1.5 -10,0 Q-1.5,-1.5 0,-10Z" fill="#FFAFCC" stroke="#BEE0FE" strokeWidth="2.174" strokeLinejoin="round" />
      <path transform="translate(14 15) scale(0.55)" d="M0,-10 Q1.5,-1.5 10,0 Q1.5,1.5 0,10 Q-1.5,1.5 -10,0 Q-1.5,-1.5 0,-10Z" fill="#FFFFFF" stroke="#BEE0FE" strokeWidth="4.545" strokeLinejoin="round" />
    </svg>
  );
}
