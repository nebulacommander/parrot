import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

/**
 * Enterprise-level Tailwind Configuration
 * Optimized for:
 * - KaTeX math rendering
 * - Code blocks with syntax highlighting
 * - Dark mode support
 * - Responsive typography
 * - Custom color schemes
 * - Geist font integration
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)"],
        mono: ["var(--font-jetbrains-mono)"],
        display: ["var(--font-manrope)"],
      },
      typography: {
        DEFAULT: {
          css: {
            'code::before': {
              content: '"'
            },
            'code::after': {
              content: '"'
            },
            'pre code::before': {
              content: '"'
            },
            'pre code::after': {
              content: '"'
            },
            pre: {
              'overflow-x': 'auto',
              'border-radius': 'var(--radius)',
              padding: '1.25rem',
              'background-color': 'var(--card)',
              color: 'var(--card-foreground)',
              border: '1px solid var(--border)',
              margin: '1.5rem 0'
            },
            'pre code': {
              'font-family': 'var(--font-geist-mono)',
              'font-size': '0.875rem',
              'line-height': '1.6'
            },
            code: {
              backgroundColor: 'hsl(var(--muted))',
              padding: '0.25rem 0.375rem',
              borderRadius: '0.25rem',
              fontWeight: '400'
            },
            table: {
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '1.5rem',
              marginBottom: '1.5rem'
            },
            'th,td': {
              padding: '0.75rem 1rem',
              borderColor: 'var(--border)',
              verticalAlign: 'top'
            },
            th: {
              backgroundColor: 'var(--muted)',
              color: 'var(--muted-foreground)',
              fontWeight: '600',
              textAlign: 'left',
              whiteSpace: 'nowrap'
            },
            tr: {
              borderBottom: '1px solid var(--border)',
              transition: 'background-color 0.2s ease'
            },
            'tr:last-child': {
              borderBottom: 'none'
            },
            'tbody tr:hover': {
              backgroundColor: 'var(--muted/5%)'
            },
            '.katex': {
              fontSize: '1.1em',
              fontWeight: '400',
              letterSpacing: '0.02em'
            },
            '.katex-display': {
              margin: '2rem 0',
              padding: '0.5rem 0',
              overflowX: 'auto',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              maxWidth: '100%'
            },
            '.math-content': {
              'overflow-x': 'auto',
              'max-width': '100%',
              'scrollbar-width': 'thin',
              'scrollbar-color': 'var(--border) transparent'
            },
            '.math-block': {
              margin: '1.5rem 0',
              padding: '1rem 0',
              borderTop: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)'
            },
            '.math-inline': {
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              backgroundColor: 'var(--muted/10%)'
            }
          }
        }
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        dark: {
          100: "#292827",
          200: "#242423",
          300: "#212121",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0px" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0px" },
        },
        "pulse-opacity": {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        "blink": {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        "fade-in": {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-opacity": "pulse-opacity 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "blink": "blink 1s step-end infinite",
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    typography,
  ],

  // Future-proofing configurations
  future: {
    hoverOnlyWhenSupported: true,
    respectDefaultRingColorOpacity: true,
    disableColorOpacityUtilitiesByDefault: true,
  },
};

export default config;