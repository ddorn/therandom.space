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
            orange: '#ffa500',
            elevation: {
                0: 'rgba(255, 255, 255, 0)',
                1: 'rgba(255, 255, 255, 0.05)',
                2: 'rgba(255, 255, 255, 0.07)',
                3: 'rgba(255, 255, 255, 0.08)',
                4: 'rgba(255, 255, 255, 0.09)',
                6: 'rgba(255, 255, 255, 0.11)',
                8: 'rgba(255, 255, 255, 0.12)',
                16: 'rgba(255, 255, 255, 0.14)',
                24: 'rgba(255, 255, 255, 0.16)',
            }
        },
        screens: {
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            // '2xl': '1536px',
        },
        extend: {
            colors: {
                gray: {
                    950: '#121212'
                },
            },
            fontFamily: {
                sans: [ 'Gilroy' ]
            },
        },
    },
    variants: {
        extend: {
            backgroundColor: ['odd'],
            zIndex: ['hover'],
        },
    }
}
