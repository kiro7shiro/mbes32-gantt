import { build, render } from './templates.js'

export class Control {
    static async build(template, data, { events = ['click'] } = {}) {
        const element = await build(template, data)
        return new Control(element, template, events)
    }
    constructor(element, template, events) {
        this.element = element
        this.template = template
        for (const event of events) {
            this.element.addEventListener(event, function (event) {
                const { target } = event
                if (target.hasAttribute('data-event') && target.hasAttribute('data-action')) {
                    const eventType = target.getAttribute('data-event')
                    if (eventType !== event.type) return
                    const action = target.getAttribute('data-action')
                    this.dispatchEvent(new CustomEvent(action, { detail: target }))
                }
            })
        }
    }
    async render(data) {
        /* const html = await render(this.template, data)
        this.element.setHTMLUnsafe(html) */
        const element = await build(this.template, data)
        const html = element.innerHTML
        this.element.innerHTML = html
        return html
    }
}
