import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
        body: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
        heading: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      fontWeight: {
        bold: '600',
        extrabold: '600',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slide: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50px)' },
        },
        'accordion-down': {
          from: {height: '0'},
          to: {height: 'var(--radix-accordion-content-height)'},
        },
        'accordion-up': {
          from: {height: 'var(--radix-accordion-content-height)'},
          to: {height: '0'},
        },
        'fade-in': {
          from: {opacity: '0', transform: 'translateY(10px)'},
          to: {opacity: '1', transform: 'translateY(0)'},
        },
        'fade-out': {
          from: {opacity: '1'},
          to: {opacity: '0'},
        },
        'scale-in': {
          from: {opacity: '0', transform: 'scale(0.95)'},
          to: {opacity: '1', transform: 'scale(1)'},
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        slide: 'slide 20s linear infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Semânticas: agora seguem os tokens do index.css e reagem ao
        // dark mode, em vez dos HSL fixos que havia aqui.
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          foreground: 'hsl(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
          foreground: 'hsl(var(--warning-foreground) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'hsl(var(--info) / <alpha-value>)',
          foreground: 'hsl(var(--info-foreground) / <alpha-value>)',
        },
        // Identidade de marca e superfícies escuras, antes acessíveis
        // apenas por style inline via --auth-*.
        brand: {
          DEFAULT: 'hsl(var(--brand) / <alpha-value>)',
          strong: 'hsl(var(--brand-strong) / <alpha-value>)',
          foreground: 'hsl(var(--brand-foreground) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface-base) / <alpha-value>)',
          panel: 'hsl(var(--surface-panel) / <alpha-value>)',
          raised: 'hsl(var(--surface-raised) / <alpha-value>)',
          input: 'hsl(var(--surface-input) / <alpha-value>)',
          hairline: 'hsl(var(--surface-hairline) / <alpha-value>)',
        },
        'on-surface': {
          DEFAULT: 'hsl(var(--on-surface) / <alpha-value>)',
          accent: 'hsl(var(--on-surface-accent) / <alpha-value>)',
          muted: 'hsl(var(--on-surface-muted) / <alpha-value>)',
          subtle: 'hsl(var(--on-surface-subtle) / <alpha-value>)',
        },
        // Sinal de variação financeira. Substitui os emerald-400/rose-400
        // hardcoded que existiam nos componentes da landing.
        positive: 'hsl(var(--accent-positive) / <alpha-value>)',
        negative: 'hsl(var(--accent-negative) / <alpha-value>)',
        benchmark: 'hsl(var(--benchmark) / <alpha-value>)',
        'brand-soft': 'hsl(var(--brand-soft) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
