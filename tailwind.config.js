/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF00E6',
        'primary-light': 'rgba(250, 47, 230, 0.5)',
        'dark-bg': '#000000',
        'dark-secondary': '#111111',
        'dark-tertiary': '#1C1C1C',
        'dark-card': 'rgb(35, 35, 35)',
      },
      backgroundColor: {
        gradient: 'linear-gradient(135deg, rgb(35, 35, 35) 0%, rgb(25, 25, 25) 100%)',
      },
      borderColor: {
        gradient: 'transparent',
      },
    },
  },
  plugins: [],
}

