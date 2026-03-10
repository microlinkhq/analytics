'use strict'

const NullObject = require('null-prototype-object')
const debug = require('debug-logfmt')('analytics')
const { URL } = require('url')
const pReflect = require('p-reflect')
const pTimeout = require('p-timeout')

const ONE_DAY_SECONDS = 86400
const { MAX_CACHE = ONE_DAY_SECONDS, REQ_TIMEOUT = 8000 } = process.env
const analytics = require('./analytics')

const CACHE = new NullObject()

const isEmpty = input => input == null || Object.keys(input).length === 0

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { searchParams } = new URL(req.url, 'http://localhost')
  const domain = searchParams.get('domain') || undefined
  const cacheKey = domain || '__all__'

  const { isFulfilled, value, reason } = await pReflect(
    pTimeout(analytics({ domain }), REQ_TIMEOUT)
  )

  if (isFulfilled && !isEmpty(value)) CACHE[cacheKey] = value

  if (!isEmpty(CACHE[cacheKey])) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader(
      'Cache-Control',
      `public, must-revalidate, max-age=${MAX_CACHE}`
    )
    const data = JSON.stringify(CACHE[cacheKey])
    res.setHeader('Content-Length', Buffer.byteLength(data))
    return res.end(data)
  }

  debug.error(reason.stack || reason)
  res.statusCode = 400
  res.end()
}
