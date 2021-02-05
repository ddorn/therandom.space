const colors = require('tailwindcss/colors')

module.exports = {
    purge: {
        // enabled: false,
        content: [
            'templates/**/*.html',
            'templates/*.html'
        ]
    },
    darkMode: false, // or 'media' or 'class'
    theme: {
        colors: {
            black: colors.black,
            white: colors.white,
            gray: colors.trueGray,
            orange: '#ffa500'
        },
        screens: {
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            // 'xl': '1280px',
            // '2xl': '1536px',
        },
        extend: {
            fontFamily: {
                sans: [ 'Gilroy' ]
            }
        },
    },
    variants: {
        extend: {},
    },
    plugins: [],
}
