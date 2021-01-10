'use strict'

const debug = require('debug-logfmt')('analytics')
const pReflect = require('p-reflect')
const pTimeout = require('p-timeout')
const { send } = require('micri')

const { MAX_CACHE = 43200000, REQ_TIMEOUT = 8000 } = process.env
const analytics = require('./analytics')

let CACHE = null

const isEmpty = (obj = {}) => Object.keys(obj).length === 0

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader(
    'cache-control',
    `public, must-revalidate, max-age=${MAX_CACHE}, s-maxage=${MAX_CACHE}, stale-while-revalidate=60`
  )
  const { isFulfilled, value, reason } = await pReflect(
    pTimeout(analytics(), REQ_TIMEOUT)
  )

  if (isFulfilled && !isEmpty(value)) CACHE = value

  if (!isEmpty(value)) return send(res, 200, CACHE)

  debug.error(reason.message || reason)
  return send(res, 400)
}
