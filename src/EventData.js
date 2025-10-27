import { parseObject } from './parse.js'
import { excelDateToJsDate } from './helper.js'

export class EventData {
    /**
     * A mapping of event data properties to the corresponding JSON object properties and
     * value parsers.
     */
    static mapping = {
        name: { property: 'Name', parser: (name) => name },
        matchcode: { property: 'MATCHCODE', parser: (matchcode) => matchcode },
        start: { property: 'Beginn Mantelzeit', parser: (start) => excelDateToJsDate(start) },
        setup: { property: 'Beginn externer Aufbau', parser: (setup) => excelDateToJsDate(setup) },
        eventStart: { property: 'Veranstaltungsbeginn', parser: (eventStart) => excelDateToJsDate(eventStart) },
        eventEnd: { property: 'Veranstaltungsende', parser: (eventEnd) => excelDateToJsDate(eventEnd) },
        dismantle: { property: 'Ende externer Abbau', parser: (dismantle) => excelDateToJsDate(dismantle) },
        end: { property: 'Ende Mantelzeit', parser: (end) => excelDateToJsDate(end) },
        halls: { property: 'Hallen', parser: (halls) => halls.split(',').map((h) => h.trim()) }
    }
    /**
     * Converts an array of JSON objects into an array of EventData instances.
     *
     * @param {Array} array - The array of JSON objects to be converted.
     * @returns {Array<EventData>} - An array of EventData instances.
     */
    static fromArray(array, { blacklist = [], mapping = EventData.mapping } = {}) {
        const filtered = array.filter((json) => !blacklist.some((predicate) => predicate(json)))
        const result = new Array(filtered.length)
        for (let index = 0; index < filtered.length; index++) {
            const json = filtered[index]
            result[index] = new EventData(json, { mapping })
        }
        return result
    }
    /**
     * Creates an EventData object from a JSON object.
     * @param {Object} json - The JSON object to be parsed.
     */
    constructor(json, { mapping = EventData.mapping } = {}) {
        const { matchcode, name, start, setup, eventStart, eventEnd, dismantle, end, halls } = parseObject(json, { mapping })
        this.id = matchcode.replace('/', '-bs-') ?? crypto.randomUUID()
        this.name = name ?? this.id
        this.start = start ?? new Date()
        this.setup = setup ?? this.start
        this.eventStart = eventStart ?? this.start
        this.eventEnd = eventEnd ?? this.start
        this.dismantle = dismantle ?? this.start
        this.end = end ?? this.start
        this.halls = halls ?? []
        this.progress = this.getProgress()
        this.times = {
            setup: Math.abs(this.start.getTime() - this.setup.getTime()),
            event: Math.abs(this.eventStart.getTime() - this.eventEnd.getTime()),
            duration: Math.abs(this.start.getTime() - this.end.getTime())
        }
    }
    createGradient({ colors = ['#F00', '#0F0', '#FF0'], opacity = 1 } = {}) {
        const { setup, event, duration } = this.times
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
        gradient.id = `${this.id}_gradient`
        const stops = [
            { offset: 0, color: colors[0] },
            { offset: setup / duration, color: colors[0] },
            { offset: setup / duration, color: colors[1] },
            { offset: (setup + event) / duration, color: colors[1] },
            { offset: (setup + event) / duration, color: colors[2] },
            { offset: 1, color: colors[2] }
        ]
        stops.forEach(({ offset, color }) => {
            const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
            stop.setAttribute('offset', `${offset * 100}%`)
            stop.setAttribute('stop-color', color)
            stop.setAttribute('stop-opacity', `${opacity}`)
            gradient.appendChild(stop)
        })
        return gradient
    }
    createProgressGradient({ colors = ['#F00', '#0F0', '#FF0'], opacity = 1 } = {}) {
        const { setup, event, duration } = this.times
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
        gradient.id = `${this.id}_gradient`
        const today = duration * (this.progress / 100)
        const stops = []
        if (today < setup) {
            stops.push({ offset: 0, color: colors[0] })
            stops.push({ offset: 1, color: colors[0] })
        } else if (today > setup && today < event) {
            stops.push({ offset: 0, color: colors[0] })
            stops.push({ offset: setup / duration, color: colors[0] })
            stops.push({ offset: setup / duration, color: colors[1] })
            stops.push({ offset: 1, color: colors[1] })
        } else if (today > event) {
            stops.push({ offset: 0, color: colors[0] })
            stops.push({ offset: setup / duration, color: colors[0] })
            stops.push({ offset: setup / duration, color: colors[1] })
            stops.push({ offset: (setup + event) / duration, color: colors[1] })
            stops.push({ offset: (setup + event) / duration, color: colors[2] })
            stops.push({ offset: 1, color: colors[2] })
        }
        stops.forEach(({ offset, color }) => {
            const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
            stop.setAttribute('offset', `${offset * 100}%`)
            stop.setAttribute('stop-color', color)
            stop.setAttribute('stop-opacity', `${opacity}`)
            gradient.appendChild(stop)
        })
        return gradient
    }
    getProgress() {
        const now = Date.now()
        const start = this.start.getTime()
        const end = this.end.getTime()
        if (start > now) return 0
        if (end <= now) return 100
        const todayDiff = end - now
        const duration = end - start
        return 100 - (todayDiff / duration) * 100
    }
}
