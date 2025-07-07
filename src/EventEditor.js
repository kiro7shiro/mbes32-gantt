import { Control } from './templates/Control.js'
import { EventInfos } from './EventInfos.js'
import { EventTodos } from './EventTodos.js'

export class EventEditor {
    static async build({ template = '/views/EventEditor.ejs', infos = EventInfos.defaults, todos = [] } = {}) {
        const control = await Control.build(template)
        const eventInfos = await EventInfos.build({ infos })
        const eventTodos = await EventTodos.build(infos.id, { todos })
        return new EventEditor(control, eventInfos, eventTodos)
    }
    constructor(control, eventInfos, eventTodos) {
        this.control = control
        this.element = control.element
        this.eventInfos = eventInfos
        this.eventTodos = eventTodos
        this.element.insertAdjacentElement('beforeend', eventInfos.element)
        this.element.insertAdjacentElement('beforeend', eventTodos.element)
    }
    async render(infos, todos) {
        await this.eventInfos.render(infos)
        await this.eventTodos.render(todos)
    }
}
