'use strict'

/* eslint camelcase: "off" */

const { differenceInDays } = require('date-fns/differenceInDays')
const { getQuarter } = require('date-fns/getQuarter')
const { subMonths } = require('date-fns/subMonths')
const { parseISO } = require('date-fns/parseISO')
const { getYear } = require('date-fns/getYear')
const { format } = require('date-fns/format')
const calcPercent = require('calc-percent')
const humanNumber = require('human-number')
const prettyBytes = require('pretty-bytes')
const got = require('got')

const { ZONE_ID, X_AUTH_EMAIL, X_AUTH_KEY, HISTORY_MONTHS = 3 } = process.env

const prettyReq = value =>
  humanNumber(value, n => Number.parseFloat(n).toFixed(0))

const addReqs = (item1, item2) => {
  if (!item1) return item2
  if (!item2) return item1

  return toReqs({
    cachedRequests: item1.cached_reqs + item2.cached_reqs,
    requests: item1.reqs + item2.reqs
  })
}

const toReqs = ({ requests: uncached_reqs, cachedRequests: cached_reqs }) => {
  const reqs = cached_reqs + uncached_reqs

  return {
    reqs,
    reqs_pretty: prettyReq(reqs),
    cached_reqs,
    cached_reqs_pretty: prettyReq(cached_reqs),
    uncached_reqs,
    uncached_reqs_pretty: prettyReq(uncached_reqs),
    cached_reqs_percentage: calcPercent(cached_reqs, reqs, { suffix: '%' })
  }
}

const addBytes = (item1, item2) => {
  if (!item1) return item2
  if (!item2) return item1

  return toBytes({
    cachedBytes: item1.cached_bytes + item2.cached_bytes,
    bytes: item1.bytes + item2.bytes
  })
}

const toBytes = ({ cachedBytes: cached_bytes, bytes: uncached_bytes }) => {
  const bytes = cached_bytes + uncached_bytes

  return {
    bytes,
    bytes_pretty: prettyBytes(bytes),
    cached_bytes,
    cached_bytes_pretty: prettyBytes(cached_bytes),
    uncached_bytes,
    uncached_bytes_pretty: prettyBytes(uncached_bytes),
    cached_bytes_percentage: calcPercent(cached_bytes, bytes, { suffix: '%' })
  }
}

const getMonthKey = rawKey => {
  const key = rawKey.split('-')
  key.pop()
  return key.join('-')
}

const getQuarterKey = key =>
  `Q${getQuarter(parseISO(key))}-${getYear(parseISO(key))}`

module.exports = async () => {
  const now = new Date()
  const timestamp = subMonths(now, HISTORY_MONTHS)
  const date = format(timestamp, 'yyyy-MM-dd')
  const limit = differenceInDays(now, timestamp)

  const query = `{
    viewer {
      zones(filter: {zoneTag: "${ZONE_ID}"}) {
        httpRequests1dGroups(orderBy:[date_DESC] limit: ${limit}, filter: { date_gt: "${date}" }) {
          dimensions {
            date
          }
          sum {
            requests
            cachedRequests
            bytes
            cachedBytes
          }
        }
      }
    }
  }`

  const body = await got('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers: {
      'x-auth-email': X_AUTH_EMAIL,
      'x-auth-key': X_AUTH_KEY
    }
  }).json()

  const [{ httpRequests1dGroups }] = body.data.viewer.zones

  const byDay = httpRequests1dGroups.reduce((acc, item, index) => {
    const key = item.dimensions.date
    return { ...acc, [key]: { ...toReqs(item.sum), ...toBytes(item.sum) } }
  }, {})

  const byMonth = Object.keys(byDay).reduce((acc, key) => {
    const monthKey = getMonthKey(key)
    acc[monthKey] = {
      ...addReqs(acc[monthKey], byDay[key]),
      ...addBytes(acc[monthKey], byDay[key])
    }
    return acc
  }, {})

  const byQuarter = Object.keys(byDay).reduce((acc, key) => {
    const quarterKey = getQuarterKey(key)

    acc[quarterKey] = {
      ...addReqs(acc[quarterKey], byDay[key]),
      ...addBytes(acc[quarterKey], byDay[key])
    }

    return acc
  }, {})

  return {
    byQuarter,
    byMonth,
    byDay
  }
}

module.exports.getMonthKey = getMonthKey
module.exports.getQuarterKey = getQuarterKey
