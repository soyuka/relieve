const IPCEE = require('ipcee')

require('./ArgumentsContainer.js')

process.relieve.ipc = IPCEE(process, process.relieve.containerArgs.eventemitter)
