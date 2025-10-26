#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const express = require('express')
const templates = require('js-templates/app.js')()

const app = express()
app.use(templates)
app.use('/bin', express.static(path.join(__dirname, 'bin')))
app.use('/src', express.static(path.join(__dirname, 'src')))
app.use('/data', express.static(path.join(__dirname, 'data')))
app.use('/', express.static(path.join(__dirname, 'public')))

module.exports = app
