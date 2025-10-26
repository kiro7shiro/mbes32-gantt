/**
 * Converts an Excel date number to a JavaScript Date object.
 *
 * @param {Number} number The Excel date number
 * @returns {Date} The corresponding JavaScript Date object
 * @throws {TypeError} If the given number is not a number
 */
export function excelDateToJsDate(number) {
    if (typeof number !== 'number') {
        throw new TypeError('The given number is not a number')
    }
    const date = new Date((number - 25569) * 86400 * 1000)
    const timezoneOffset = date.getTimezoneOffset() * 60 * 1000
    return new Date(date.getTime() + timezoneOffset)
}
