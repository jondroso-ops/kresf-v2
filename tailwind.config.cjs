/** KRESF CSS build: pin Tailwind v3 to match the previous CDN theme. */
module.exports = {
  content: ['./app/index.html'],
  safelist: [
    'bg-brand-primary','bg-brand-warning','bg-brand-danger',
    'text-brand-primary','text-brand-warning','text-brand-danger',
    'border-brand-primary','border-brand-warning','border-brand-danger'
  ],
  theme: { extend: { colors: {
    slate: { 850:'#141e33', 950:'#090d16' },
    brand: { primary:'#10b981', danger:'#ef4444', warning:'#f59e0b', rescue:'#f97316' }
  } } },
  plugins: []
};
