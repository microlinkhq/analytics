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

const CF_HEADERS = {
  'x-auth-email': X_AUTH_EMAIL,
  'x-auth-key': X_AUTH_KEY
}

const parseZones = str =>
  str.split(';').map(entry => {
    const [name, id] = entry.split(',')
    return { name: name.trim(), id: id.trim() }
  })

const ZONES = parseZones(ZONE_ID)

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

const toReqs = ({ requests: reqs, cachedRequests: cached_reqs }) => {
  const uncached_reqs = reqs - cached_reqs

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

const toBytes = ({ bytes, cachedBytes: cached_bytes }) => {
  const uncached_bytes = bytes - cached_bytes

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

const processAnalytics = httpRequests1dGroups => {
  const byDay = httpRequests1dGroups.reduce((acc, item) => {
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

  return { byQuarter, byMonth, byDay }
}

module.exports = async ({ domain } = {}) => {
  let zones = ZONES

  if (domain) {
    zones = zones.filter(z => z.name === domain)
    if (zones.length === 0) throw new Error(`Zone not found: ${domain}`)
  }

  const now = new Date()
  const timestamp = subMonths(now, HISTORY_MONTHS)
  const date = format(timestamp, 'yyyy-MM-dd')
  const limit = differenceInDays(now, timestamp)

  const zoneQueries = zones
    .map(
      (z, i) => `zone_${i}: zones(filter: {zoneTag: "${z.id}"}) {
      httpRequests1dGroups(orderBy:[date_DESC] limit: ${limit}, filter: { date_gt: "${date}" }) {
        dimensions { date }
        sum { requests cachedRequests bytes cachedBytes }
      }
    }`
    )
    .join('\n    ')

  const query = `{ viewer { ${zoneQueries} } }`

  const body = await got('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers: CF_HEADERS
  }).json()

  const result = {}
  zones.forEach((z, i) => {
    const [zoneData] = body.data.viewer[`zone_${i}`]
    result[z.name] = processAnalytics(zoneData.httpRequests1dGroups)
  })

  if (domain) return result[domain]
  return result
}

module.exports.getMonthKey = getMonthKey
module.exports.getQuarterKey = getQuarterKey
module.exports.parseZones = parseZones
