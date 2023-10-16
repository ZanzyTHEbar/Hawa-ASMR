export const BULLET_POSITION_ADJUSTMENT = 18

export const getBulletPosition = (range: HTMLInputElement) => {
    return +range.value / +range.max
}

export const CapitalizeFirstLetter = (letter: string) => {
    return letter.charAt(0).toUpperCase() + letter.slice(1)
}

export const classNames = (...classes: (string | boolean | undefined)[]): string => {
    return classes.filter(Boolean).join(' ')
}

export const isEmpty = <T>(obj: object | Array<T>) => {
    if (!Array.isArray(obj)) {
        // ⇒ do not attempt to process array
        return Object.keys(obj).length === 0
    }
    return !obj.length
}
