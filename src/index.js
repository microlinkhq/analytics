'use strict'

const debug = require('debug-logfmt')('analytics')
const pReflect = require('p-reflect')
const pTimeout = require('p-timeout')

const ONE_DAY_SECONDS = 86400
const { MAX_CACHE = ONE_DAY_SECONDS, REQ_TIMEOUT = 8000 } = process.env
const analytics = require('./analytics')

let CACHE = null

const isEmpty = (obj = {}) => Object.keys(obj).length === 0

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { isFulfilled, value, reason } = await pReflect(
    pTimeout(analytics(), REQ_TIMEOUT)
  )

  if (isFulfilled && !isEmpty(value)) CACHE = value

  if (!isEmpty(CACHE)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader(
      'Cache-Control',
      `public, must-revalidate, max-age=${MAX_CACHE}`
    )
    const data = JSON.stringify(CACHE)
    res.setHeader('Content-Length', Buffer.byteLength(data))
    return res.end(data)
  }

  debug.error(reason.message || reason)
  res.statusCode = 400
  res.end()
}
