type LogoProps = { size?: number; className?: string; decorative?: boolean };

/** Lesson Squeezy brand mark. Colors are fixed so it looks the same in every theme. */
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
      <rect width="64" height="64" rx="16" fill="#E3CDEF" />
      <g transform="translate(32 32) scale(0.72) translate(-32 -32)">
        <path d="M16 8H38L50 20V54Q50 56 48 56H16Q14 56 14 54V10Q14 8 16 8Z" fill="#7C4D9A" />
        <path d="M38 8V18Q38 20 40 20H50Z" fill="#A57BC0" />
        <rect x="20" y="30" width="24" height="3.5" rx="1.75" fill="#FFFFFF" />
        <rect x="20" y="38" width="24" height="3.5" rx="1.75" fill="#FFFFFF" />
        <rect x="20" y="46" width="15" height="3.5" rx="1.75" fill="#FFFFFF" />
      </g>
      <path transform="translate(47 17) scale(1.35)" d="M0,-10 Q1.5,-1.5 10,0 Q1.5,1.5 0,10 Q-1.5,1.5 -10,0 Q-1.5,-1.5 0,-10Z" fill="#E58AAE" stroke="#E3CDEF" strokeWidth="1.852" strokeLinejoin="round" />
      <path transform="translate(15 14) scale(0.6)" d="M0,-10 Q1.5,-1.5 10,0 Q1.5,1.5 0,10 Q-1.5,1.5 -10,0 Q-1.5,-1.5 0,-10Z" fill="#F4C95D" stroke="#E3CDEF" strokeWidth="4.167" strokeLinejoin="round" />
    </svg>
  );
}
