/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const defaultTheme = require('tailwindcss/defaultTheme')
const { iconsPlugin, getIconCollections } = require('@egoist/tailwindcss-icons')

const generateSizeClass = (upToSize, startAt = 80) => {
    const classes = {}
    for (let i = startAt; i < upToSize / 4; i += 4) {
        classes[i] = `${(i * 4) / 16}rem`
    }

    return classes
}

const labelsClasses = ['indigo', 'gray', 'green', 'blue', 'red', 'purple']

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // add class='dark' to <html> to enable dark mode - https://tailwindcss.com/docs/dark-mode
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,css,md,mdx,html,json,scss}'],
    purge: {
        //Because we made a dynamic class with the label we need to add those classes
        // to the safe list so the purge does not remove that
        safelist: [
            ...labelsClasses.map((lbl) => `bg-${lbl}-500`),
            ...labelsClasses.map((lbl) => `bg-${lbl}-200`),
            ...labelsClasses.map((lbl) => `text-${lbl}-400`),
        ],
    },
    theme: {
        screens: {
            xxs: '300px',
            xs: '475px',
            ...defaultTheme.screens,
        },
        extend: {
            width: generateSizeClass(1024),
            minHeight: generateSizeClass(1024, 0),
            maxHeight: generateSizeClass(1024, 0),
            maxWidth: generateSizeClass(1024, 0),
            minWidth: generateSizeClass(1024, 0),
            borderWidth: {
                1: '1px',
            },
            fontFamily: {
                sans: ['Roboto', 'sans-serif'],
            },
            gridTemplateColumns: {
                '1/5': '1fr 5fr',
            },
            keyframes: {
                slideDownAndFade: {
                    from: { opacity: 0, transform: 'translateY(-2px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
                slideLeftAndFade: {
                    from: { opacity: 0, transform: 'translateX(2px)' },
                    to: { opacity: 1, transform: 'translateX(0)' },
                },
                slideUpAndFade: {
                    from: { opacity: 0, transform: 'translateY(2px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
                slideRightAndFade: {
                    from: { opacity: 0, transform: 'translateX(-2px)' },
                    to: { opacity: 1, transform: 'translateX(0)' },
                },
            },
            animation: {
                slideDownAndFade: 'slideDownAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                slideLeftAndFade: 'slideLeftAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                slideUpAndFade: 'slideUpAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                slideRightAndFade: 'slideRightAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        require('tailwindcss-neumorphism'),
        require('@kobalte/tailwindcss')({ prefix: 'kb' }),

        iconsPlugin({
            collections: getIconCollections(['lucide']),
        }),
    ],
}
