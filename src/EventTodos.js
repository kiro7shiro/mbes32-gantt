import { parseObject } from './parse.js'
import { render, renderSync } from '/src/templates.js'
import { Control } from '/src/Control.js'

export class EventTodo {
    static defaults = {
        id: null,
        eventId: null,
        text: 'event-todo-text',
        done: false
    }
    static fromArray(array, { mapping = {} } = {}) {
        const result = new Array(array.length)
        for (let index = 0; index < array.length; index++) {
            const json = array[index]
            result[index] = new EventTodo(json, { mapping })
        }
        return result
    }
    constructor(json, { mapping = {} } = {}) {
        const { eventId, text, done } = parseObject(json, { mapping })
        this.id = crypto.randomUUID()
        this.eventId = eventId
        this.text = text
        this.done = done
    }
}

export class EventTodos {
    static async build(eventsTodos, { template = '/views/EventTodos.ejs', container = 'div', events = ['click', 'dblclick'] } = {}) {
        const control = await Control.build(template, { todos: [] }, container, events)
        return new EventTodos(control, eventsTodos)
    }
    static buildSync(eventsTodos, { template = '/views/EventTodos.ejs', container = 'div', events = ['click', 'dblclick'] } = {}) {
        const control = Control.buildSync(template, { todos: [] }, container, events)
        return new EventTodos(control, eventsTodos)
    }
    constructor(control, todos) {
        this.control = control
        this.container = control.container
        this.eventId = null
        this.todos = todos
        this.selectedTodo = null
        this.todoEditor = null
        this.container.addEventListener('selectEventTodo', this.selectTodo.bind(this))
        this.container.addEventListener('createEventTodo', this.createTodo.bind(this))
        this.container.addEventListener('deleteEventTodo', this.deleteTodo.bind(this))
        this.container.addEventListener('toggleEventTodo', this.toggleTodo.bind(this))
        this.container.addEventListener('editEventTodo', this.editTodo.bind(this))
    }
    addTodo({ text, done } = EventTodo.defaults) {
        const json = { eventId: this.eventId, text, done }
        const todo = new EventTodo(json)
        this.todos.push(todo)
        return todo
    }
    createTodo() {
        const todo = this.addTodo()
        const html = this.renderTodoSync(todo)
        const listContainer = this.container.querySelector('ul')
        listContainer.insertAdjacentHTML('beforeend', html)
        return todo
    }
    deleteTodo() {
        if (this.selectedTodo) {
            const { todoId: id } = this.selectedTodo.dataset
            const index = this.todos.findIndex((todo) => todo.id === id)
            if (index !== -1) {
                this.todos.splice(index, 1)
                this.selectedTodo.remove()
                this.selectedTodo = null
                return true
            }
            return false
        }
    }
    editTodo(event) {
        const { detail: target } = event
        const parent = target.parentElement
        const { todoId: id } = parent.dataset
        const todo = this.todos.find((todo) => todo.id === id)
        const self = this
        const todoEditor = document.createElement('input')
        const targetRect = parent.getBoundingClientRect()
        todoEditor.style.top = `${targetRect.top}px`
        todoEditor.style.left = `${targetRect.left}px`
        todoEditor.style.width = `${targetRect.width - 16}px`
        todoEditor.style.height = `${targetRect.height}px`
        todoEditor.placeholder = target.textContent
        todoEditor.style.position = 'absolute'
        todoEditor.style.display = 'block'
        this.container.insertAdjacentElement('beforeend', todoEditor)
        todoEditor.focus()
        todoEditor.addEventListener('change', function (e) {
            todoEditor.style.display = 'none'
            todo.text = e.target.value
            const html = self.renderTodoSync(todo)
            parent.insertAdjacentHTML('afterend', html)
            parent.remove()
            todoEditor.remove()
        })
    }
    selectTodo(event) {
        const { detail: target } = event
        if (this.selectedTodo) this.selectedTodo.classList.remove('w3-theme-l2')
        target.classList.add('w3-theme-l2')
        this.selectedTodo = target
    }
    toggleTodo(event) {
        const { detail: target } = event
        const { todoId: id } = target.parentElement.dataset
        const index = this.todos.findIndex((todo) => todo.id === id)
        if (index !== -1) {
            this.todos[index].done = !this.todos[index].done
            return true
        }
        return false
    }
    async render(eventId) {
        this.eventId = eventId
        const eventTodos = this.todos.filter(function (todo) {
            return todo.eventId === eventId
        })
        const html = await this.control.render({ todos: eventTodos })
        return html
    }
    renderSync(eventId) {
        this.eventId = eventId
        const eventTodos = this.todos.filter(function (todo) {
            return todo.eventId === eventId
        })
        const html = this.control.renderSync({ todos: eventTodos })
        return html
    }
    async renderTodo(todo, { template = '/views/EventTodo.ejs' } = {}) {
        const html = await render(template, { todo })
        return html
    }
    renderTodoSync(todo, { template = '/views/EventTodo.ejs' } = {}) {
        const html = renderSync(template, { todo })
        return html
    }
    on(event, handler) {
        this.container.addEventListener(event, handler)
    }
    off(event, handler) {
        this.container.removeEventListener(event, handler)
    }
}
