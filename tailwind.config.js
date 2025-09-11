export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
// tailwind.config.js
module.exports = {
  darkMode: 'class', // 'class' ou 'media' selon ce que tu veux ; 'class' est généralement plus sûr
  content: [
    './src/**/*.{js,jsx,ts,tsx,html}',
    './public/index.html'
  ],
  theme: {
    extend: {}
  },
  safelist: [
    // classes dynamiques que Tailwind pourrait purger ; ajoute ici si tu utilises des classes construites dynamiquement
    'text-emerald-600','text-emerald-400',
    'text-red-600','text-red-400',
    'text-zinc-50','text-zinc-900',
    'bg-zinc-950','bg-white'
  ],
  plugins: []
};
