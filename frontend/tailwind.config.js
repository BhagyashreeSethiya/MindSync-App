/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandBg: '#F0F4F8',    
        brandPrimary: '#4A90E2', 
        brandSuccess: '#2ECC71', 
      }
    },
  },
  plugins: [],
}