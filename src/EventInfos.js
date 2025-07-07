// What do you want to do?
// render a template with data and get back a DOM element
// save the event handlers for the DOM element in a class
// the class instance should have a render function that rerenders the template and sets the outer html of the html element
// call one function to build the class instance

import { Control } from '../js-templates/index.js'

export class EventInfos {
    static defaults = {
        id: 'event-details-id',
        name: 'event-details-task-name',
        start: new Date(),
        end: new Date(),
        halls: []
    }
    static async build({ infos = EventInfos.defaults, template = '/views/EventInfos.ejs', container = 'div' } = {}) {
        const control = await Control.build(template, infos, container)
        return new EventInfos(control, infos)
    }
    static buildSync({ infos = EventInfos.defaults, template = '/views/EventInfos.ejs', container = 'div' } = {}) {
        const control = Control.buildSync(template, infos, container)
        return new EventInfos(control, infos)
    }
    constructor(control, infos) {
        this.control = control
        this.container = control.container
        this.infos = infos
    }
    async render(infos) {
        const data = Object.assign({}, EventInfos.defaults, this.infos, infos)
        const html = await this.control.render(data)
        return html
    }
    renderSync(infos) {
        const data = Object.assign({}, EventInfos.defaults, this.infos, infos)
        const html = this.control.renderSync(data)
        return html
    }
}
