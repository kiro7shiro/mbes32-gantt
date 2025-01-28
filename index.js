/**
 * TODO:
 * - [ ] save app data
 * - [ ] load app data
 * - [ ] events gantt chart
 *      - [ ] load file data into gantt tasks
 *      - [ ] build gantt chart
 *      - [ ] show gantt chart
 * - [ ] events todos
 *      - [ ] create, update, delete todos
 *      - [ ] show todo status
 */

import { EventTask } from './EventTask.js'

const upload = document.getElementById('upload')

function excelDateToJsDate(number) {
    return new Date((number - 25569) * 86400 * 1000)
}

function dateDiff(date1, date2, { unit = 'days' } = {}) {
    const diff = date2.getTime() - date1.getTime()
    const units = {
        years: 1000 * 60 * 60 * 24 * 365,
        months: 1000 * 60 * 60 * 24 * 30,
        weeks: 1000 * 60 * 60 * 24 * 7,
        days: 1000 * 60 * 60 * 24
    }
    return Math.floor(diff / units[unit]) + 1
}

function addOrSubtractDate(startDate, value, { unit = 'day' } = {}) {
    const date = new Date(startDate)
    switch (unit) {
        case 'year':
            date.setFullYear(date.getFullYear() + value)
            break
        case 'month':
            date.setMonth(date.getMonth() + value)
            break
        case 'week':
            date.setDate(date.getDate() + value * 7)
            break
        case 'day':
            date.setDate(date.getDate() + value)
            break
        default:
            throw new Error(`Invalid unit: ${unit}`)
    }
    return date
}

let ids = 0

class EventData {
    static errors = {
        INVALID_INPUT: class InvalidInput extends Error {
            constructor(message) {
                super(message)
            }
        },
        MISSING_HEADERS: class MissingHeaders extends Error {
            constructor(missingHeaders) {
                super(`Missing row data headers: ${missingHeaders.join(', ')}`)
                this.missingHeaders = missingHeaders
            }
        }
    }

    static dataMap = {
        MATCHCODE: 'MATCHCODE',
        START: 'Veranstaltungsbeginn',
        END: 'Veranstaltungsende',
        KIND: 'Veranstaltungsart',
        NAME: 'Name'
    }

    constructor(data, { dataMap = EventData.dataMap } = {}) {
        if (!data) throw new EventData.errors.INVALID_INPUT('Invalid input: data is required')
        if (!dataMap) throw new EventData.errors.INVALID_INPUT('Invalid input: dataMap is required')
        const missingHeaders = []
        for (const key in dataMap) {
            const header = dataMap[key]
            if (!(header in data)) missingHeaders.push(header)
        }
        if (missingHeaders.length > 0) {
            throw new EventData.errors.MISSING_HEADERS(missingHeaders)
        }

        //this.id = ++ids
        //this.id = new Date().getTime() + Math.floor(Math.random() * 1000)
        this.id = Math.floor(Math.random() * 1000)

        this.matchcode = data[dataMap.MATCHCODE] || null
        this.start = data[dataMap.START] ? excelDateToJsDate(data[dataMap.START]) : null
        this.end = data[dataMap.END] ? excelDateToJsDate(data[dataMap.END]) : null
        this.duration = this.start && this.end ? dateDiff(this.start, this.end) : 0
        this.kind = data[dataMap.KIND] || null
        this.name = data[dataMap.NAME] || null
        this.progress = this.start && this.end ? this.getProgress() : 0
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

const dataBlacklist = [
    function (item) {
        return item['Veranstaltungsart'] === 'Wartung'
    }
]

function parse(data, { blacklist = [] } = {}) {
    let result = []
    for (const row of data) {
        try {
            const eventData = new EventData(row)
            if (!blacklist.some((predicate) => predicate(eventData))) result.push(eventData)
        } catch (error) {
            if (error instanceof EventData.errors.MISSING_HEADERS) {
                //console.error(error.message)
                for (const header of error.missingHeaders) {
                    row[header] = undefined
                }
                result.push(...parse([row], { blacklist }))
                continue
            }
            throw error
        }
    }
    return result
}

function downloadJsonFile(data, filename) {
    const json = JSON.stringify(data, null, 4)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

function handleJsonFileInput(event) {
    const file = event.target.files[0]
    if (!file || file.type !== 'application/json') {
        throw new Error('Only JSON files are allowed')
    }

    const reader = new FileReader()
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result)
            // data is now an array of JSON objects
            console.log(data)
            // do something with the data
        } catch (error) {
            throw new Error(`Error parsing JSON file: ${error.message}`)
        }
    }
    reader.onerror = (event) => {
        throw new Error(`Error reading JSON file: ${event.target.error.message}`)
    }
    reader.readAsText(file)
}

// TODO : explore sheet_to_json options: https://docs.sheetjs.com/docs/api/utilities/array#array-output
upload.addEventListener('change', (e) => {
    const reader = new FileReader()
    reader.onload = function () {
        const data = new Uint8Array(reader.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet)
        console.log(json.length)
        const filtered = json.filter((eventTask) => !dataBlacklist.some((predicate) => predicate(eventTask)))
        console.log(filtered.length)
        const eventTasks = EventTask.fromArray(filtered)
        const ganttChart = new Gantt('#gantt-chart', eventTasks, { auto_move_label: true, container_height: 500 })
        console.log(ganttChart.tasks.length)        
        const svg = ganttChart.$svg
        for (const eventTask of eventTasks) {
            const gradient = eventTask.createGradient()
            svg.insertAdjacentElement('afterbegin', gradient)
        }
        for (const task of ganttChart.tasks) {
            const gradient = document.getElementById(`${task.id}_gradient`)
            const bar = document.querySelector('.bar-wrapper[data-id="' + task.id + '"] .bar-progress')
			bar.style.fill = 'url(#' + gradient.id + ')'
            //bar.setAttribute('style', 'fill:url(#' + gradient.id + ');')
            //bar.setAttribute('fill', 'url(#' + gradient.id + ')')
        }
    }
    reader.readAsArrayBuffer(e.target.files[0])
})
