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
        extend: {
            fontFamily: {
                sans: [ 'Gilroy' ]
            },
            colors: {
                orange: '#ffa500'
            }
        },
    },
    variants: {
        extend: {},
    },
    plugins: [],
}
