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
    constructor(raw) {
        if (!raw) {
            throw new Error('Invalid input: raw data is required')
        }
        this.id = ++ids
        this.matchcode = raw['MATCHCODE'] || null
        this.start = raw['Veranstaltungsbeginn'] ? excelDateToJsDate(raw['Veranstaltungsbeginn']) : null
        this.end = raw['Veranstaltungsende'] ? excelDateToJsDate(raw['Veranstaltungsende']) : null
        this.duration = this.start && this.end ? dateDiff(this.start, this.end) : 0
        this.kind = raw['Veranstaltungsart'] || null
        this.name = raw['Name'] || null
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
        return item?.kind === 'Wartung'
    },
    function (item) {
        return item?.duration >= 364
    }
]

function parseData(data, { blacklist = [] } = {}) {
    let result = []
    for (const raw of data) {
        const eventData = new EventData(raw)
        if (!blacklist.some((predicate) => predicate(eventData))) result.push(eventData)
    }
    return result
}

upload.addEventListener('change', (e) => {
    const reader = new FileReader()
    reader.onload = function () {
        const data = new Uint8Array(reader.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet)
        const parsed = parseData(json, { blacklist: dataBlacklist })
        console.log(parsed)
        const ganttChart = new Gantt('#gantt-chart', parsed, { auto_move_label: true, container_height: 500 })
        console.log(ganttChart)
    }
    reader.readAsArrayBuffer(e.target.files[0])
})
