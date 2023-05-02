'use strict'

const debug = require('debug-logfmt')('analytics')

const server = require('http').createServer(require('.'))

const port = process.env.PORT || process.env.port || 3000

server.on('error', error => {
  debug({ status: 'error', message: error.message, trace: error.stack })
  process.exit(1)
})

server.listen(port, async () => {
  const { address, port } = server.address()
  debug({
    status: 'listening',
    pid: process.pid,
    address: `${address}:${port}`
  })
})
