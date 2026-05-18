// Iconos SVG estilo Feather/Lucide — stroke-based, 24×24 viewBox

const S = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '100%',
  height: '100%',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.75',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function CardboardIcon() {
  return (
    <svg {...S}>
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  )
}

export function GlassIcon() {
  return (
    <svg {...S}>
      <path d="M8 2h8"/>
      <path d="M9 2v2.5A4 4 0 007 8v10a2 2 0 002 2h6a2 2 0 002-2V8a4 4 0 00-2-3.5V2"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
    </svg>
  )
}

export function MetalIcon() {
  return (
    <svg {...S}>
      <ellipse cx="12" cy="5" rx="6" ry="2"/>
      <path d="M6 5v14"/>
      <path d="M18 5v14"/>
      <ellipse cx="12" cy="19" rx="6" ry="2"/>
      <line x1="6" y1="12" x2="18" y2="12"/>
    </svg>
  )
}

export function PaperIcon() {
  return (
    <svg {...S}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="13" y2="17"/>
    </svg>
  )
}

export function PlasticIcon() {
  return (
    <svg {...S}>
      <path d="M10 2h4v2c1.5.7 2 2 2 3.5V19a2 2 0 01-8 0V7.5C8 6 8.5 4.7 10 4V2z"/>
      <line x1="8" y1="11" x2="16" y2="11"/>
    </svg>
  )
}

export function TrashIcon() {
  return (
    <svg {...S}>
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  )
}

export function ScanIcon() {
  return (
    <svg {...S}>
      <path d="M3 7V5a2 2 0 012-2h2"/>
      <path d="M17 3h2a2 2 0 012 2v2"/>
      <path d="M21 17v2a2 2 0 01-2 2h-2"/>
      <path d="M7 21H5a2 2 0 01-2-2v-2"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
    </svg>
  )
}

export function RecycleIcon() {
  return (
    <svg {...S}>
      <polyline points="1 4 1 10 7 10"/>
      <polyline points="23 20 23 14 17 14"/>
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
    </svg>
  )
}

export const CLASS_ICONS = {
  cardboard: CardboardIcon,
  glass:     GlassIcon,
  metal:     MetalIcon,
  paper:     PaperIcon,
  plastic:   PlasticIcon,
  trash:     TrashIcon,
}
