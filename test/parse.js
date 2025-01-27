//import { strict as assert } from 'assert'
import * as assert from 'assert'
import { parseObject } from '../parse.js'

describe('parseObject function', () => {
    it('returns input when no mapping is provided', () => {
        const input = { foo: 'bar' }
        const result = parseObject(input)
        assert.strictEqual(result, input)
    })

    it('parses object with existing header', () => {
        const input = { foo: 'bar' }
        const mapping = { baz: { header: 'foo', parser: (x) => x.toUpperCase() } }
        const result = parseObject(input, { mapping })
        assert.deepStrictEqual(result.baz, 'BAR')
    })

    it('returns input when no mapping is provided', () => {
        const input = { foo: 'bar' }
        const result = parseObject(input)
        assert.strictEqual(result, input)
    })

    it('parses object with existing header', () => {
        const input = { foo: 'bar' }
        const mapping = { baz: { header: 'foo', parser: (x) => x.toUpperCase() } }
        const result = parseObject(input, { mapping })
        assert.strictEqual(result, { baz: 'BAR' })
    })

    it('ignores non-existing header', () => {
        const input = { foo: 'bar' }
        const mapping = { baz: { header: 'qux', parser: (x) => x.toUpperCase() } }
        const result = parseObject(input, { mapping })
        assert.strictEqual(result, {})
    })

    it('parses object with multiple headers', () => {
        const input = { foo: 'bar', qux: 'quux' }
        const mapping = {
            baz: { header: 'foo', parser: (x) => x.toUpperCase() },
            quuz: { header: 'qux', parser: (x) => x.toLowerCase() }
        }
        const result = parseObject(input, { mapping })
        assert.strictEqual(result, { baz: 'BAR', quuz: 'quux' })
    })

    it('throws error with invalid input', () => {
        const input = null
        assert.throws(() => parseObject(input), Error)
    })

    it('throws error with invalid mapping', () => {
        const input = { foo: 'bar' }
        const mapping = 'invalid mapping'
        assert.throws(() => parseObject(input, { mapping }), Error)
    })
})
