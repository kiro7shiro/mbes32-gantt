#!/usr/bin/env node
const express = require('express')
const app = express()
const gantt = require('./app.js')

const PORT = 5500

app.use(express.json())
app.use(gantt)

const server = app.listen(PORT, function () {
    console.log(`server started on port ${PORT}`)
})

// process manager
function terminate() {
    server.close()
    console.log(`server stopped`)
    process.exit(0)
}
process.on('SIGINT', terminate)
process.on('SIGTERM', terminate)
process.on('SIGUSR2', terminate)
