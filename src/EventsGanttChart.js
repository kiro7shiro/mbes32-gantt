const isSelector = /^[#.]/

export class EventsGanttChart {
    constructor(eventsData, { element = 'svg', options = {} } = {}) {
        this.eventsData = eventsData
        if (!isSelector.test(element)) {
            element = document.createElement(element)
        }
        this.chart = new Gantt(element, eventsData, options)
        const { $container: container, $header: header, $svg: svg, $side_header: sideHeader, $today_button: todayButton } = this.chart
        this.container = container
        svg.style.display = 'none'
        for (const eventData of this.eventsData) {
            const gradient = eventData.createGradient()
            const liteGradient = eventData.createGradient({ opacity: 0.33 })
            liteGradient.id = `${eventData.id}_lite_gradient`
            svg.insertAdjacentElement('afterbegin', gradient)
            svg.insertAdjacentElement('afterbegin', liteGradient)
        }
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
        header.classList.add('w3-theme')
        todayButton.classList.add('w3-theme', 'w3-hover-white')
        sideHeader.classList.add('w3-theme')
        const upperTextLabels = header.querySelectorAll('.upper-text')
        for (const label of upperTextLabels) {
            label.classList.add('w3-theme')
        }
        container.addEventListener('click', this.handleGanttChartClick.bind(this))
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
