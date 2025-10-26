/**
 * A constant used to represent the current object itself when parsing properties
 * that do not have a nested structure and need to reference the object directly.
 */
const SELF = 'self'

/**
 * Parses an input object according to a specified mapping.
 *
 * @param {Object} input - The input object to be parsed.
 * @param {Object} [options] - Options for parsing.
 * @param {Object} [options.mapping={}] - A mapping object where each key is a new key for the output object,
 *                                        and the value is an object containing a `property` to look for in the input,
 *                                        and a `parser` function to transform the value.
 * @returns {Object} - The parsed object with keys and values transformed as specified by the mapping.
 */
export function parseObject(input, { mapping = {} } = {}) {
    if (Object.keys(mapping).length === 0) return input
    let output = {}
    for (let [key, { property, parser }] of Object.entries(mapping)) {
        if (property in input) {
            output[key] = parser(input[property]) 
        }
        if (property === SELF) {
            output[key] = parser(input)
        }
    }
    //console.log({ output, mapping })
    return output
}

/**
 * Parses an array of input objects according to a specified mapping.
 *
 * @param {Array} array - The array of input objects to be parsed.
 * @param {Object} [options] - Options for parsing.
 * @param {Object} [options.mapping={}] - A mapping object where each key is a new key for the output object,
 *                                        and the value is an object containing a `property` to look for in the input,
 *                                        and a `parser` function to transform the value.
 * @returns {Array} - The parsed array with objects having keys and values transformed as specified by the mapping.
 */
export function parseArray(array, { mapping = {} } = {}) {
    if (Object.keys(mapping).length === 0) return array
    const output = new Array(array.length)
    for (let i = 0; i < array.length; i++) {
        output[i] = parseObject(array[i], mapping)
    }
    return output
}
