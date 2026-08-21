import { cn } from "@/lib/utils";

/**
 * Logo RWS inline (SVG) para que el wordmark se adapte al tema.
 * El badge conserva su fondo oscuro con contenido blanco; el texto
 * "RWS", la línea divisora y el subtítulo usan `currentColor`, por lo
 * que toman el color del tema (negro en claro, blanco en oscuro).
 */
export function LogoRws({
  className,
  width = 360,
  height = 112,
}: {
  className?: string;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 900 280"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="RWS — Gestión de Préstamos"
      className={cn("text-foreground", className)}
    >
      <defs>
        <linearGradient id="rwsBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2B2B2B" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
      </defs>

      {/* ===== ICONO / BADGE ===== */}
      <g transform="translate(20,20)">
        <rect x="0" y="0" width="240" height="240" rx="42" fill="url(#rwsBadgeGrad)" />
        <rect
          x="6"
          y="6"
          width="228"
          height="228"
          rx="38"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          opacity="0.55"
        />

        <g stroke="#555555" strokeWidth="1.5" opacity="0.6">
          <line x1="30" y1="185" x2="210" y2="185" />
          <line x1="30" y1="200" x2="210" y2="200" />
        </g>

        <rect x="52" y="150" width="26" height="55" rx="4" fill="#FFFFFF" />
        <rect x="94" y="120" width="26" height="85" rx="4" fill="#FFFFFF" />
        <rect x="136" y="90" width="26" height="115" rx="4" fill="#FFFFFF" />

        <path
          d="M50 128 L96 92 L138 112 L192 58"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M158 58 L192 58 L192 92"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* ===== WORDMARK (se adapta al tema vía currentColor) ===== */}
      <g transform="translate(300,0)" fill="currentColor">
        <text
          x="0"
          y="140"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="700"
          fontSize="76"
          letterSpacing="1"
        >
          RWS
        </text>

        <rect x="2" y="162" width="420" height="3" />

        <text
          x="2"
          y="195"
          fontFamily="Arial, Helvetica, sans-serif"
          fontWeight="600"
          fontSize="22"
          letterSpacing="3"
          opacity="0.6"
        >
          GESTIÓN DE PRÉSTAMOS
        </text>
      </g>
    </svg>
  );
}
