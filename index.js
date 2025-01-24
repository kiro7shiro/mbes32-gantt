const upload = document.getElementById('upload')

function excelDateToJsDate(number) {
    return new Date((number - 25569) * 86400 * 1000)
}

function dateDiff(date1, date2, { unit = 'days' } = {}) {
    const units = {
        years: 31536000000, // 1000 * 60 * 60 * 24 * 365
        months: 2628000000, // 1000 * 60 * 60 * 24 * 30
        weeks: 604800000, // 1000 * 60 * 60 * 24 * 7
        days: 86400000 // 1000 * 60 * 60 * 24
    }
    if (!units[unit]) {
        throw new Error(`Invalid unit: ${unit}`)
    }
    const diff = Math.abs(date2.getTime() - date1.getTime())
    return Math.floor(diff / units[unit])
}

const dataMap = [
    { id: 'matchcode', key: 'MATCHCODE', parser: String },
    { id: 'start', key: 'Veranstaltungsbeginn', parser: excelDateToJsDate },
    { id: 'end', key: 'Veranstaltungsende', parser: excelDateToJsDate },
    { id: 'status', key: 'Buchungsstatus', parser: String },
    { id: 'type', key: 'Veranstaltungstyp', parser: String },
    { id: 'kind', key: 'Veranstaltungsart', parser: String },
    { id: 'name', key: 'MATCHCODE', parser: String }
]

let ids = 0
const dataTransforms = [
    {
        id: 'myDuration',
        transformer: function (item) {
            return dateDiff(item.start, item.end)
        }
    },
    {
        id: 'id',
        transformer: function () {
            ids++
            return ids
        }
    },
    {
        id: 'progress',
        transformer: function (item) {
			const now = new Date()
			if (item.start.getTime() > now.getTime()) return 0
			if (item.end.getTime() <= now.getTime()) return 100
			const todayDiff = dateDiff(now, item.end)
			const progress = 100 - (todayDiff / item.duration) * 100
            return progress
        }
    }
]

const dataBlacklist = [
    function (item) {
        return item?.kind === 'Wartung'
    },
    function (item) {
        return item?.duration >= 364
    }
]

function parseData(data, { mappings = [], transforms = [], blacklist = [] } = {}) {
    const result = []
    for (const raw of data) {
        const item = {}
        for (const { id, key, parser } of mappings) {
            item[id] = parser(raw[key])
        }
        if (mappings.length < 1) Object.assign(item, raw)
        for (const { id, transformer } of transforms) {
            item[id] = transformer(item)
        }
        if (!blacklist.some((predicate) => predicate(item))) result.push(item)
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
        const parsed = parseData(json, { mappings: dataMap, transforms: dataTransforms, blacklist: dataBlacklist })
        console.log(parsed)
        const ganttChart = new Gantt('#gantt-chart', parsed, { auto_move_label: true, container_height: 500 })
    }
    reader.readAsArrayBuffer(e.target.files[0])
})
