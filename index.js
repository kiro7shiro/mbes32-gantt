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
	{ id: 'begin', key: 'Veranstaltungsbeginn', parser: excelDateToJsDate },
	{ id: 'end', key: 'Veranstaltungsende', parser: excelDateToJsDate }
]

const dataReducer = [
	{
		id: 'duration',
		reducer: function (event) {
			return dateDiff(event.end, event.begin)
		}
	}
]

function parseData(data) {
	const result = []
	for (let dIdx = 0; dIdx < data.length; dIdx++) {
		const raw = data[dIdx]
		const item = {}
		for (let mIdx = 0; mIdx < dataMap.length; mIdx++) {
			const { id, key, parser } = dataMap[mIdx]
			item[id] = parser(raw[key])
		}
		for (let rIdx = 0; rIdx < dataReducer.length; rIdx++) {
			const { id, reducer } = dataReducer[rIdx]
			item[id] = reducer(item)
		}
		result.push(item)
	}
	return result
}

upload.addEventListener('change', (e) => {
	const reader = new FileReader()
	reader.readAsArrayBuffer(e.target.files[0])
	reader.onload = function () {
		const data = new Uint8Array(reader.result)
		const workbook = XLSX.read(data, { type: 'array' })
		const sheet = workbook.Sheets[workbook.SheetNames[0]]
		const json = XLSX.utils.sheet_to_json(sheet)
		const parsed = parseData(json)
		console.log(parsed)
	}
})
