relieve-logger
==============

To use with [relieve](https://github.com/soyuka/relieve)

```
let logger = new Logger(`out.log`, `err.log`)

let t = new CallableTask('test.js', {
	interfaces: [logger]
})
```
