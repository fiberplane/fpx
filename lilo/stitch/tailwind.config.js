/** @type {import('tailwindcss').Config} */
const colors = {
  background: 'hsla(45, 20%, 96%, 1)',
  foreground: {
    DEFAULT: 'hsla(40, 11%, 5%, 1)',
    muted: 'hsla(40, 2%, 34%, 1)',
    subtle: 'hsla(48, 3%, 68%, 1)',
  },
  border: {
    DEFAULT: 'hsla(45, 6%, 87%, 1)',
    brand: 'hsla(11, 100%, 60%, 1)',
  },
  input: {
    DEFAULT: 'hsla(0, 0%, 100%, 1)',
  },
  primary: {
    DEFAULT: 'hsla(10, 78%, 51%, 1)',
    foreground: 'hsla(0, 0%, 100%, 1)',
  },
  brand: {
    DEFAULT: 'hsla(11, 100%, 60%, 1)',
    muted: 'hsla(11, 100%, 60%, 0.15)',
  },
  success: {
    DEFAULT: 'hsla(82, 50%, 42%, 1)',
    muted: 'hsla(82, 46%, 49%, 0.15)',
  },
  warning: {
    DEFAULT: 'hsla(38, 72%, 58%, 1)',
  },
  info: {
    DEFAULT: 'hsla(201, 51%, 57%, 1)',
  },
  neutral: {
    400: 'hsla(48, 3%, 68%, 1)',
    500: 'hsla(45, 2%, 47%, 1)',
    700: 'hsla(40, 3%, 22%, 1)',
  },
  emphasis: 'hsla(44, 26%, 92%, 1)',
}

module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors,
      backgroundColor: {
        ...colors,
        muted: colors.emphasis,
      },
      textColor: {
        ...colors,
        muted: colors.foreground.muted,
      },
      borderColor: {
        ...colors,
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
