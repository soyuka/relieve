relieve-logger
==============

## Install

```
npm install relieve-logger --save
```

## Usage

To use with [relieve](https://github.com/soyuka/relieve)

```javascript
var Logger = require('relieve-logger')
var CallableTask = require('relieve/tasks/CallableTask')

var logger = new Logger(`out.log`, `err.log`)

var t = new CallableTask('test.js', {
	interfaces: [logger]
})
```

## API

```
/**
 * @param {string} out - the out file path or a writable stream
 * @param {string} err - the out file path or a writable stream
 * @param {Object} options
 *        options.delay - the delay you want to rotate for example `1d`, `1h`(moment format http://momentjs.com/docs/#/manipulating/add/)
 *        options.size - the max size in bytes before rotation
 *        Default has no rotation
 */
new Logger(out, err, options)
```

## Licence

MIT
