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

import { compileOptions, preload, render, renderSync, Control } from './js-templates/index.js'

import { excelDateToJsDate } from './src/helper.js'
import { EventTask } from './src/EventTask.js'
import { EventTodos } from './src/EventTodos.js'
import { EventEditor } from './src/EventEditor.js'

import { EventInfos } from './src/EventInfos.js'

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
    constructor({ blacklist = [] } = {}) {
        this.menuBar = new Control(document.getElementById('menuBar'), '')
        this.menuBar.on('fileInput', this.handleFileInput.bind(this))
        this.eventInfos = EventInfos.buildSync({ container: '#eventInfos' })
        this.blacklist = blacklist
        this.eventTasks = []
        this.ganttChartOptions = {
            container_height: 600,
            popup_on: 'hover'
        }
        this.ganttChart = null
        this.eventTodos = []
    }
    createEventTodo(id, text, { done = false } = {}) {
        const todo = {
            id,
            text,
            done
        }
        this.eventTodos.push(todo)
        return todo
    }
    deleteEventTodo(id, text) {
        const index = this.eventTodos.findIndex((todo) => todo.id === id && todo.text === text)
        this.eventTodos.splice(index, 1)
    }
    toggleEventTodo(id, text) {
        const todo = this.eventTodos.find((todo) => todo.id === id && todo.text === text)
        todo.done = !todo.done
    }
    createGanttChart(ganttContainer, eventTasks, options = {}) {
        this.eventTasks = eventTasks
        this.ganttChart = new Gantt(ganttContainer, eventTasks, options)
        const { $container: container, $header: header, $svg: svg, $side_header: sideHeader, $today_button: todayButton } = this.ganttChart
        svg.style.display = 'none'
        for (const eventTask of this.eventTasks) {
            const gradient = eventTask.createGradient()
            const liteGradient = eventTask.createGradient({ opacity: 0.33 })
            liteGradient.id = `${eventTask.id}_lite_gradient`
            svg.insertAdjacentElement('afterbegin', gradient)
            svg.insertAdjacentElement('afterbegin', liteGradient)
        }
        const now = new Date()
        for (const task of this.ganttChart.tasks) {
            const bar = document.querySelector('.bar-wrapper[data-id="' + task.id + '"] .bar')
            const barProgress = document.querySelector('.bar-wrapper[data-id="' + task.id + '"] .bar-progress')
            const text = document.querySelector('.bar-wrapper[data-id="' + task.id + '"] .bar-label')
            if (task.end.getTime() < now.getTime()) {
                bar.style.fill = `url(#${task.id}_lite_gradient)`
                barProgress.style.fill = `none`
            } else {
                bar.style.fill = `url(#${task.id}_lite_gradient)`
                barProgress.style.fill = `url(#${task.id}_gradient)`
            }
            text.innerHTML = task.id.replaceAll('_', ' ')
        }
        svg.style.display = 'block'
        header.classList.add('w3-theme')
        todayButton.classList.add('w3-theme', 'w3-hover-white')
        sideHeader.classList.add('w3-theme')
        const upperTextLabels = header.querySelectorAll('.upper-text')
        for (const label of upperTextLabels) {
            label.classList.add('w3-theme')
        }
        container.addEventListener('click', this.handleGanttChartClick.bind(this))
    }
    async handleEventDetailsClick(event) {
        const { id } = event.target
        if (!id) return
        if (id === 'createEventTodo') {
            let text = prompt('Enter todo text:')
            if (text === '') return
            const todoId = event.target.closest('.event-details').id
            console.log({ todoId, text })
            this.createEventTodo(todoId, text)
        } else if (id === 'deleteEventTodo') {
            const todoId = event.target.closest('.event-details').id
            const todo = this.eventTodos.find((todo) => todo.id === todoId)
            this.deleteEventTodo(todo.id, todo.text)
        }
    }
    handleGanttChartClick(event) {
        const task = event.target.closest('.bar-wrapper')
        if (!task) return
        const eventTask = this.eventTasks.find((eventTask) => eventTask.id === task.dataset.id)
        if (!eventTask) return
        console.log(eventTask)
        const eventTodos = this.eventTodos.filter((todo) => todo.id === eventTask.id)
        console.log(eventTodos)
        this.eventInfos.renderSync({ ...eventTask })
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
        reader.readAsArrayBuffer(event.detail.files[0])
    }
}

async function main() {
    compileOptions.async = false
    await preload()
    const app = new App({ blacklist: eventDataBlacklist })
    console.log(app)
}

main()

async function test() {
    const eventEditor = await EventEditor.build(/* {
        infos: { id: 'test-id', taskName: 'test-task', start: new Date(), end: new Date(), halls: ['2.2', '1.2'] },
        todos: [
            { id: 'test-id', text: 'test-todo', done: false },
            { id: 'test-id-2', text: 'test-todo-2', done: true }
        ]
    } */)
    await eventEditor.render({ id: 'test-id', taskName: 'test-task', start: new Date(), end: new Date(), halls: ['2.2', '1.2'] }, [
        { text: 'test-todo', done: false },
        { text: 'test-todo-2', done: true }
    ])
    document.body.insertAdjacentElement('beforeend', eventEditor.element)
    console.log(eventEditor)
}

//test()

// make it sync

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
