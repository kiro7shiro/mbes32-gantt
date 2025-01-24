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
    return Math.floor(diff / units[unit]) + 1
}

let ids = 0
const dataTransforms = [
    {
        id: 'id',
        transformer: function () {
            ids++
            return ids
        }
    },
    {
        id: 'matchcode',
        transformer: function (item) {
            return item['MATCHCODE']
        }
    },
    {
        id: 'start',
        transformer: function (item) {
            return excelDateToJsDate(item['Veranstaltungsbeginn'])
        }
    },
    {
        id: 'end',
        transformer: function (item) {
            return excelDateToJsDate(item['Veranstaltungsende'])
        }
    },
    {
        id: 'myDuration',
        transformer: function (item) {
            const start = excelDateToJsDate(item['Veranstaltungsbeginn'])
            const end = excelDateToJsDate(item['Veranstaltungsende'])
            return dateDiff(start, end)
        }
    },
    {
        id: 'kind',
        transformer: function (item) {
            return item['Veranstaltungsart']
        }
    },
    {
        id: 'name',
        transformer: function (item) {
            return item['Name']
        }
    },
    {
        id: 'progress',
        transformer: function (item) {
            const now = new Date()
            const start = excelDateToJsDate(item['Veranstaltungsbeginn'])
            const end = excelDateToJsDate(item['Veranstaltungsende'])
            if (start.getTime() > now.getTime()) return 0
            if (end.getTime() <= now.getTime()) return 100
            const duration = dateDiff(start, end)
            const todayDiff = dateDiff(now, end)
            const progress = 100 - (todayDiff / duration) * 100
            return progress
        }
    }
]

const dataBlacklist = [
    function (item) {
        return item?.kind === 'Wartung'
    },
    function (item) {
        return item?.myDuration >= 364
    }
]

function parseData(data, { transforms = [], blacklist = [] } = {}) {
    let result = []
    for (const raw of data) {
        let item = {}
        for (const { id, transformer } of transforms) {
            item[id] = transformer(raw)
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
        const parsed = parseData(json, { transforms: dataTransforms, blacklist: dataBlacklist })
        console.log(parsed)
        const ganttChart = new Gantt('#gantt-chart', parsed, { auto_move_label: true, container_height: 500 })
    }
    reader.readAsArrayBuffer(e.target.files[0])
})
