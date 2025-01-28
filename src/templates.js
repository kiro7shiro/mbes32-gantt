const templates = {}
const names = {}
const nameMatcher = /.*\/([^/.]+)\.[^.]+$/

export async function preload({ path = 'views' } = {}) {
    const url = new URL(`${path}`, window.location.origin)
    const resp = await fetch(`${url.pathname}`)
    const text = await resp.text()
    const html = document.createElement('div')
    html.insertAdjacentHTML('afterbegin', text)
    const icons = Array.from(html.querySelectorAll('.icon'))
    if (icons.length === 0) return text
    const files = icons.filter(function (icon) {
        return icon.classList.contains('icon-ejs') && icon.title !== '..'
    })
    for (const file of files) {
        const fileHtml = await preload({ path: file.href })
        const renderer = ejs.compile(fileHtml, { client: true, async: true })
        templates[file.pathname] = renderer
        names[file.pathname.replace(nameMatcher, '$1')] = file.pathname
    }
    const directories = icons.filter(function (icon) {
        return icon.classList.contains('icon-directory') && icon.title !== '..'
    })
    for (const directory of directories) {
        await preload({ path: directory.href })
    }
}

/**
 * Request and render template files from the server.
 * @param {String} path of the template file to render
 * @param {Object} [options]
 * @param {Object} [options.locals] locals to pass to the template
 * @returns {String}
 */
export async function render(path, locals = {}) {
    let renderer = null
    if (templates[path] !== undefined) {
        renderer = templates[path]
    } else {
        const url = new URL(`${path}`, window.location.origin)
        const resp = await fetch(`${url.pathname}`)
        const text = await resp.text()
        if (resp.status !== 200) throw new Error(text)
        renderer = ejs.compile(text, { client: true, async: true })
        templates[path] = renderer
        names[path.replace(nameMatcher, '$1')] = path
    }    
    const html = await renderer(locals, null, async function (p, l) {
        return await render(p, l)
    })
    return html
}
