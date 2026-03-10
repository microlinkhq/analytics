'use strict'

const test = require('ava')

const { getMonthKey, getQuarterKey, parseZones } = require('../src/analytics')

test('.parseZones', t => {
  t.deepEqual(parseZones('microlink.io,abc123;unavatar.io,def456'), [
    { name: 'microlink.io', id: 'abc123' },
    { name: 'unavatar.io', id: 'def456' }
  ])
  t.deepEqual(parseZones('example.com,xyz'), [
    { name: 'example.com', id: 'xyz' }
  ])
})

test('.getMonthKey', t => {
  t.is(getMonthKey('2023-06-09'), '2023-06')
})

test('.getQuarterKey', t => {
  t.is(getQuarterKey('2023-01-09'), 'Q1-2023')
  t.is(getQuarterKey('2023-02-09'), 'Q1-2023')
  t.is(getQuarterKey('2023-03-09'), 'Q1-2023')
  t.is(getQuarterKey('2023-04-09'), 'Q2-2023')
  t.is(getQuarterKey('2023-05-09'), 'Q2-2023')
  t.is(getQuarterKey('2023-06-09'), 'Q2-2023')
  t.is(getQuarterKey('2023-07-09'), 'Q3-2023')
  t.is(getQuarterKey('2023-08-09'), 'Q3-2023')
  t.is(getQuarterKey('2023-09-09'), 'Q3-2023')
  t.is(getQuarterKey('2023-10-09'), 'Q4-2023')
  t.is(getQuarterKey('2023-11-09'), 'Q4-2023')
  t.is(getQuarterKey('2023-12-09'), 'Q4-2023')
})
