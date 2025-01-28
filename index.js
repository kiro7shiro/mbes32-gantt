// TODO :
// [x] create app
//      [ ] save app data
//      [ ] load app data
// [x] events gantt chart
//     [x] load file data into gantt tasks
//      [x] build gantt chart
//      [x] show gantt chart
// [ ] events todos
//      [ ] create, update, delete todos
//      [ ] show todo status

import { render } from './src/templates.js'
import { EventTask } from './src/EventTask.js'
import { excelDateToJsDate } from './src/helper.js'

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
    constructor(fileInput, { blacklist = [] } = {}) {
        if (!fileInput) throw new Error('fileInput is required')
        this.fileInput = document.getElementById(fileInput)
        this.blacklist = blacklist
        this.eventTasks = []
        this.ganttChartOptions = {
            container_height: 600,
            popup_on: 'hover'
        }
        this.ganttChart = null
        this.fileInput.addEventListener('change', this.handleFileInput.bind(this))
    }
    createGanttChart(ganttContainer, eventTasks, options = {}) {
        this.eventTasks = eventTasks
        this.ganttChart = new Gantt(ganttContainer, eventTasks, options)
        const { $container: container, $svg: svg } = this.ganttChart
        svg.style.display = 'none'
        for (const eventTask of this.eventTasks) {
            const gradient = eventTask.createGradient()
            const liteGradient = eventTask.createGradient({ opacity: 0.33 })
            liteGradient.id = `${eventTask.id}_lite_gradient`
            svg.insertAdjacentElement('afterbegin', gradient)
            svg.insertAdjacentElement('afterbegin', liteGradient)
        }
        for (const task of this.ganttChart.tasks) {
            const bar = document.querySelector('.bar-wrapper[data-id="' + task.id + '"] .bar')
            const barProgress = document.querySelector('.bar-wrapper[data-id="' + task.id + '"] .bar-progress')
            const text = document.querySelector('.bar-wrapper[data-id="' + task.id + '"] .bar-label')
            bar.style.fill = `url(#${task.id}_lite_gradient)`
            barProgress.style.fill = `url(#${task.id}_gradient)`
            text.innerHTML = task.id.replace('_', ' ')
        }
        svg.style.display = 'block'
        container.addEventListener('click', this.handleGanttChartClick.bind(this))
    }
    async handleGanttChartClick(event) {
        const task = event.target.closest('.bar-wrapper')
        if (!task) return
        const eventTask = this.eventTasks.find((eventTask) => eventTask.id === task.dataset.id)
        if (!eventTask) return
        const html = await render('/views/EventDetails.ejs', eventTask)
        document.getElementById('event-details').innerHTML = html
    }
    handleFileInput(event) {
        const self = this
        const reader = new FileReader()
        reader.onload = function () {
            const data = new Uint8Array(reader.result)
            const workbook = XLSX.read(data, { type: 'array' })
            const sheet = workbook.Sheets[workbook.SheetNames[0]]
            const json = XLSX.utils.sheet_to_json(sheet)
            const filtered = json.filter((eventTask) => !self.blacklist.some((predicate) => predicate(eventTask)))
            const eventTasks = EventTask.fromArray(filtered)
            self.createGanttChart('#gantt-chart', eventTasks, self.ganttChartOptions)
        }
        reader.readAsArrayBuffer(event.target.files[0])
    }
}

const app = new App('file-input', { blacklist: eventDataBlacklist })
console.log(app)

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
