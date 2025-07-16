import { compileOptions, preload, Control } from './js-templates/index.js'
import { excelDateToJsDate } from './src/helper.js'
import { EventData } from './src/EventData.js'
import { EventInfos } from './src/EventInfos.js'
import { EventTodo, EventTodos } from './src/EventTodos.js'
import { EventsGanttChart } from './src/EventsGanttChart.js'

const eventDataBlacklist = [
    function (item) {
        return item['Veranstaltungsart'] === 'Wartung'
    },
    function (item) {
        const start = excelDateToJsDate(item['Beginn Mantelzeit'])
        const end = excelDateToJsDate(item['Ende Mantelzeit'])
        const duration = end - start
        const days = Math.floor(duration / (1000 * 60 * 60 * 24))
        return days >= 364
    }
]

class App {
    constructor(eventsData, eventsTodos, { blacklist = [] } = {}) {
        // data
        this.blacklist = blacklist
        this.eventsData = EventData.fromArray(eventsData, { blacklist })
        this.eventsTodos = EventTodo.fromArray(eventsTodos)
        // ui controls
        this.menuBar = new Control(document.getElementById('menuBar'), '')
        this.menuBar.on('fileInput', this.handleFileInput.bind(this))
        this.ganttChartOptions = {
            container_height: 600,
            popup_on: 'hover'
        }
        this.eventInfos = EventInfos.buildSync({ container: '#eventInfos' })
        // TODO : implement build() and buildSync() for EventsGanntChart()
        this.ganttChart = new EventsGanttChart(this.eventsData, { element: '#gantt-chart', options: this.ganttChartOptions })
        this.eventTodos = EventTodos.buildSync(this.eventsTodos, { container: '#eventTodos', events: ['click', 'dblclick'] })
        // ui events
        const self = this
        this.ganttChart.on('eventBarClick', function (event) { 
            const { detail: id } = event
            const eventData = self.eventsData.find(function (data) {
                return data.id === id
            })
            self.eventInfos.renderSync(eventData)
            self.eventTodos.renderSync(id)
        })
    }
    handleFileInput(event) {
        const self = this
        const reader = new FileReader()
        reader.onload = function () {
            const data = new Uint8Array(reader.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            const json = XLSX.utils.sheet_to_json(sheet)
            const filtered = json.filter((eventData) => !self.blacklist.some((predicate) => predicate(eventData)))
            const eventsData = EventData.fromArray(filtered)
            this.eventsData = eventsData
            downloadJsonFile(filtered, 'eventsData.json')
        }
        reader.readAsArrayBuffer(event.detail.files[0])
    }
}

async function main() {
    // set render engine to sync mode and preload template renderers
    compileOptions.async = false
    await preload()
    // load events data
    const eventsDataUrl = new URL('/data/eventsData.json', window.location.origin)
    const eventsDataResp = await fetch(eventsDataUrl.pathname)
    if (!eventsDataResp.ok) {
        const errorText = await eventsDataResp.text()
        throw new Error(`Failed to fetch data: ${errorText}`)
    }
    const eventsDataJson = await eventsDataResp.json()
    // load todos data
    const eventsTodosUrl = new URL('/data/eventsTodos.json', window.location.origin)
    const eventsTodosResp = await fetch(eventsTodosUrl.pathname)
    if (!eventsTodosResp.ok) {
        const errorText = await eventsTodosResp.text()
        throw new Error(`Failed to fetch data: ${errorText}`)
    }
    const eventsTodosJson = await eventsTodosResp.json()
    // load app
    const app = new App(eventsDataJson, eventsTodosJson, { blacklist: eventDataBlacklist })
    window.app = app
}

main()

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
