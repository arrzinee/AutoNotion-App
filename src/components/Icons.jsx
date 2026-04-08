function baseProps(size = 24) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  }
}

export function NotionIcon({ size = 24 }) {
  return (
    <svg {...baseProps(size)}>
      <rect
        x="4.25"
        y="4.25"
        width="15.5"
        height="15.5"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 17V7.5l7 9.5V7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SendIcon({ size = 18 }) {
  return (
    <svg {...baseProps(size)}>
      <path
        d="M21.5 2.5L11 13"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M21.5 2.5L14.8 21.3L11.1 13L2.7 9.2L21.5 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SpinnerIcon({ size = 16 }) {
  return (
    <svg
      {...baseProps(size)}
      style={{ animation: 'icon-spin 0.9s linear infinite' }}
    >
      <style>
        {`
          @keyframes icon-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.2"
      />
      <path
        d="M20 12a8 8 0 0 0-8-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function PageIcon({ size = 18 }) {
  return (
    <svg {...baseProps(size)}>
      <path
        d="M8 3.75h6.5L19.5 8.8v11.45a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 3.75v4.5h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10 12h6M10 15h6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function DatabaseIcon({ size = 18 }) {
  return (
    <svg {...baseProps(size)}>
      <ellipse cx="12" cy="6.5" rx="6.5" ry="2.75" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 6.5v5.5c0 1.52 2.91 2.75 6.5 2.75s6.5-1.23 6.5-2.75V6.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5.5 12v5.5c0 1.52 2.91 2.75 6.5 2.75s6.5-1.23 6.5-2.75V12"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export function RefreshIcon({ size = 16 }) {
  return (
    <svg {...baseProps(size)}>
      <path
        d="M20 6v5h-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19 11a7 7 0 1 0 1.16 3.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CheckIcon({ size = 16 }) {
  return (
    <svg {...baseProps(size)}>
      <path
        d="M5 12.5L9.2 16.5L19 7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function BotIcon({ size = 16 }) {
  return (
    <svg {...baseProps(size)}>
      <rect
        x="5"
        y="7"
        width="14"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M12 4v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9.5" cy="12.5" r="1" fill="currentColor" />
      <circle cx="14.5" cy="12.5" r="1" fill="currentColor" />
      <path d="M9 15.5h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
