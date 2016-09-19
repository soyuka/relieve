A [Script Task]{@link module:tasks/ScriptTask~ScriptTask} handles the fork and only takes a nodejs script path.

This script will then run in a [ScriptContainer]{@link module:tasks/ScriptContainer~ScriptContainer}. The container is used to pre-register some events and fires:
- `start` when the container is ready
- `error` when `uncaughtException` occurs

For example using a small http server:

```javascript
//server.js
var http = require('http')

http.createServer(function(req, res) {
  res.writeHead(200)
  res.end("hello world\n")
}).listen(8020)
```

The worker:
```javascript
//worker.js
var ScriptTask = require('relieve/tasks/ScriptTask')

var task = new ScriptTask('server.js', {restart: true})

task.start()
```

The [Callable Task]{@tutorial 3-CallableTask} enables advance interactions. It extends the [Script Task]{@link module:tasks/ScriptTask~ScriptTask}.
