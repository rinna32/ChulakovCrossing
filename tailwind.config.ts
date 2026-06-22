import type { Config } from 'tailwindcss'

// Привязываем CSS-переменные из app/assets/css/main.css к классам Tailwind,
// чтобы в шаблонах писать bg-bg / text-ink / rounded-card и т.п.
// Сам main.css не трогаем — переменные и классы .btn/.card живут там.
export default <Partial<Config>>{
  content: ['./app/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--c-bg)',
        ink: 'var(--c-ink)',
        muted: 'var(--c-muted)',
        line: 'var(--c-line)',
        surface: 'var(--c-surface)',
      },
      borderRadius: {
        card: 'var(--radius)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
