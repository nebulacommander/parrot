import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
    darkMode: ["class"],
    content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
	plugins: [
		require("tailwindcss-animate"),
		typography
	],
	theme: {
    	extend: {
			typography: {
			  DEFAULT: {
				css: {
					'code::before': {
						content: '""',
					},
					'code::after': {
						content: '""',
					},
					'pre code::before': {
						content: '""',
					},
					'pre code::after': {
						content: '""',
					},
					'pre': {
						'overflow-x': 'auto',
						'border-radius': 'var(--radius)',
						'padding': '1rem',
						'background-color': 'var(--card)',
						'color': 'var(--card-foreground)',
						'border': '1px solid var(--border)',
					},
					'pre code': {
						'font-family': 'var(--font-geist-mono)',
						'font-size': '0.875rem',
					},
					code: {
						backgroundColor: 'hsl(var(--muted))',
						padding: '0.25rem',
						borderRadius: '0.25rem',
						fontWeight: '400',
					},
                     
				}
			  }	
			},
    		colors: {
    			neutral: {
    				'200': '#F0F0F0',
    				'300': '#D1D1D1'
    			},
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		fontFamily: {
    			sans: [
    				'var(--font-geist-sans)'
    			],
    			mono: [
    				'var(--font-geist-mono)'
    			]
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		}
    	}
    },
	future: {
		hoverOnlyWhenSupported: true,
	},
};
export default config;
