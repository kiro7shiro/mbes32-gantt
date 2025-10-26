import { Control } from '/src/Control.js'

export class EventsGanttChart {
    static buildSync(eventsData, { template = '/views/EventsGanttChart.ejs', container = 'div', events = ['click'], options = {} } = {}) {
        const control = Control.buildSync(template, {}, container, events)
        return new EventsGanttChart(control, eventsData, { options })
    }
    constructor(control, eventsData, { options = {} } = {}) {
        this.control = control
        this.container = control.container
        this.eventsData = eventsData
        this.chart = new Gantt(control.container, eventsData, options)
        const { $container: ganttContainer, $header: header, $svg: svg, $side_header: sideHeader, $today_button: todayButton } = this.chart
        this.container = ganttContainer
        // insert gradients
        svg.style.display = 'none'
        for (const eventData of this.eventsData) {
            const gradient = eventData.createProgressGradient()
            const liteGradient = eventData.createGradient({ opacity: 0.33 })
            liteGradient.id = `${eventData.id}_lite_gradient`
            svg.insertAdjacentElement('afterbegin', gradient)
            svg.insertAdjacentElement('afterbegin', liteGradient)
        }
        // set progress style
        const now = new Date()
        for (const task of this.chart.tasks) {
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
            text.innerHTML = task.id.replaceAll('_', ' ').replaceAll('-bs-', '/')
        }
        svg.style.display = 'block'
        // set table style
        header.classList.add('w3-theme')
        todayButton.classList.add('w3-theme', 'w3-hover-white')
        sideHeader.classList.add('w3-theme')
        const upperTextLabels = header.querySelectorAll('.upper-text')
        for (const label of upperTextLabels) {
            label.classList.add('w3-theme')
        }
        // event handlers
        ganttContainer.addEventListener('click', this.handleGanttChartClick.bind(this))
    }
    handleGanttChartClick(event) {
        const task = event.target.closest('.bar-wrapper')
        if (!task) return
        this.container.dispatchEvent(new CustomEvent('eventBarClick', { detail: task.dataset.id }))
    }
    on(event, handler) {
        this.container.addEventListener(event, handler)
    }
    off(event, handler) {
        this.container.removeEventListener(event, handler)
    }
}
