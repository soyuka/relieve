let processArgv = process.argv.map(function(e, i) {
  if(i < 3)
    return e

  return JSON.parse(e)
})

if (!process.relieve) {
  process.relieve = {}
}

process.relieve.argv = [].slice.call(processArgv, 2)
process.relieve.containerArgs = process.relieve.argv.pop()
