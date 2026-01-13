/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'rakuten': {
          'red': '#BF0000',
          'dark': '#8B0000',
          'light': '#FFE5E5',
        },
        'profit': {
          'positive': '#10B981',
          'negative': '#EF4444',
        }
      },
      fontFamily: {
        'sans': ['Noto Sans JP', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
