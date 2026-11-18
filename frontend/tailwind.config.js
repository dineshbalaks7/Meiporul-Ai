/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          canvas: '#EBE6DF',
          background: '#FCFAF7',
          surface: '#FFFFFF',
          sidebar: '#F7F4EE',
          primary: '#1C1917',
          secondary: '#78716C',
          muted: '#A8A29E',
          border: '#E8E2D7',
          borderSubtle: '#F2EEE7',
          accent: '#9E4A25',       // Warm terracotta / burnt orange in the reference image
          accentHover: '#883E1D',
          accentLight: '#F7ECE4',
          accentSubtle: '#FAF4EE',
          bubbleUser: '#F5EBE1',   // Exact peach-sand tint in the reference image
          bubbleUserText: '#44392E',
          highlightItem: '#F0EAE1',// Active list item highlight
          success: '#16A34A',
          successLight: '#DCFCE7',
          error: '#DC2626',
          errorLight: '#FEE2E2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 10px 30px -5px rgba(28, 25, 23, 0.05), 0 2px 6px -1px rgba(28, 25, 23, 0.02)',
        'elevated': '0 16px 36px -6px rgba(28, 25, 23, 0.08), 0 4px 12px -2px rgba(28, 25, 23, 0.04)',
        'flyout': '0 12px 32px -4px rgba(28, 25, 23, 0.10), 0 4px 10px -2px rgba(28, 25, 23, 0.04)',
      },
    },
  },
  plugins: [],
}
