module.exports = {
    purge: {
        enabled: true,
        content: [
            'templates/**/*.html',
            'templates/*.html'
        ]
    },
    darkMode: false, // or 'media' or 'class'
    theme: {
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
