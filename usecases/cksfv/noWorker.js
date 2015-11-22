'use strict';
var Promise = require('bluebird')
var fs = Promise.promisifyAll(require('fs'))
var p = require('path')
var eol = require('os').EOL
var assert = require('assert')
var readLine = require('./readLine.js')

assert.ok(
  typeof process.argv[2] == 'string' && p.extname(process.argv[2]) == '.sfv',
  'Sfv file must be provided'
);

var path = process.argv[2]

console.time('cksfv')

fs.readFileAsync(path)
.then(function(data) {
  data = data.toString()
    .split(eol)
    .map(e => e.trim())
    .filter(e => e.length)

  return Promise.map(data, function(line) {
    return readLine(path, line)
  }, {concurrency: 20})
  .then(function(res) {
    console.log(res); 
    console.timeEnd('cksfv')
  })
})
