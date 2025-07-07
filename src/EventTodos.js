import { Control } from './templates/Control.js'

export class EventTodo {
    static defaults = {
        id: -1,
        text: 'event-todo-text',
        done: false
    }
    constructor(id, { text, done } = EventTodo.defaults) {
        this.id = id
        this.text = text
        this.done = done
    }
}

export class EventTodos {
    static async build(eventId, { todos = [], template = '/views/EventTodos.ejs' } = {}) {
        const control = await Control.build(template, { todos }, { events: ['click', 'dblclick'] })
        return new EventTodos(control, eventId, todos)
    }
    constructor(control, eventId, todos) {
        this.control = control
        this.element = control.element
        this.eventId = eventId
        this.todos = []
        this.addTodos(todos)
        this.selectedTodo = null
        this.todoEditor = null
        this.element.addEventListener('selectEventTodo', this.selectTodo.bind(this))
        this.element.addEventListener('deleteEventTodo', this.deleteTodo.bind(this))
        this.element.addEventListener('toggleEventTodo', this.toggleTodo.bind(this))
        this.element.addEventListener('createEventTodo', this.createTodo.bind(this))
        this.element.addEventListener('editEventTodo', this.editTodo.bind(this))
    }
    addTodo({ text, done } = EventTodo.defaults) {
        const id = `${this.todos.length + 1}`
        const todo = new EventTodo(id, { text, done })
        this.todos.push(todo)
        return todo
    }
    addTodos(todos) {
        for (const todo of todos) {
            this.addTodo({ ...todo })
        }
    }
    async createTodo() {
        const todo = this.addTodo()
        await this.render(this.todos)
        return todo
    }
    deleteTodo() {
        if (this.selectedTodo) {
            const { eventTodo: id } = this.selectedTodo.dataset
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
        const todoId = target.parentElement.dataset.eventTodo
        const self = this
        console.log(target, todoId)
        if (this.todoEditor === null) {
            this.todoEditor = document.createElement('input')
            this.todoEditor.style.display = 'none'
            this.todoEditor.addEventListener('change', function (e) {
                self.updateTodo(todoId, e.target.value)
                self.todoEditor.style.display = 'none'
            })
            this.element.insertAdjacentElement('beforeend', this.todoEditor)
        }
        const targetRect = target.getBoundingClientRect()
        this.todoEditor.style.top = `${targetRect.top}px`
        this.todoEditor.style.left = `${targetRect.left}px`
        this.todoEditor.style.width = `${targetRect.width}px`
        this.todoEditor.style.height = `${targetRect.height}px`
        this.todoEditor.placeholder = target.textContent
        this.todoEditor.style.position = 'absolute'
        this.todoEditor.style.display = 'block'
    }
    selectTodo(event) {
        const { detail: target } = event
        if (this.selectedTodo) this.selectedTodo.classList.remove('w3-theme-l2')
        target.classList.add('w3-theme-l2')
        this.selectedTodo = target
    }
    toggleTodo(event) {
        const { detail: target } = event
        const { eventTodo: id } = target.dataset
        const index = this.todos.findIndex((todo) => todo.id === id)
        if (index !== -1) {
            this.todos[index].done = !this.todos[index].done
            return true
        }
        return false
    }
    async render(todos) {
        const newTodos = todos.filter((todo) => !this.todos.find((existingTodo) => existingTodo.id === todo.id))
        const updatedTodos = this.todos.map((existingTodo) => {
            const updatedTodo = todos.find((todo) => todo.id === existingTodo.id)
            return updatedTodo ? { ...existingTodo, ...updatedTodo } : existingTodo
        })
        this.addTodos(newTodos)
        this.updateTodos(updatedTodos)
        const html = await this.control.render({ todos: this.todos })
        return html
    }
    updateTodo(id, text, done) {
        const todo = this.todos.find((todo) => todo.id === id)
        if (!todo) return false
        todo.text = text
        todo.done = done
        return true
    }
    updateTodos(todos) {
        for (const todo of todos) {
            this.updateTodo(todo.id, todo.text, todo.done)
        }
    }
}
