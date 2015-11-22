'use strict';
function fibonacci(max) {
  let x = -1;
  let i = 0;
  let j = 1;
  let k = 0;

  for(; k < max; i = j, j = x, k++)  {
    
    if(x > Number.MAX_SAFE_INTEGER) {
      console.error('Fibonacci stopeed at iteration %d', k);
      return {number: x, iterations: k, error: 'Number exceed the limit ('+Number.MAX_SAFE_INTEGER+')'} 
    }

    x = i + j 
  }

  return {number: x, iterations: k}
}

var socks = []

module.exports = {
  setChannel: function(channel) {
    channel.on('socket', function(socket) {
      socks.push(socket)
    })
  },
  doHeavyStuff: function(num) {
    let sock = socks.shift()
    let f = fibonacci(num)
    if(f.error) {
      sock.write('Fibonnacci errored with message: \n') 
      sock.write(f.error + '\n') 
      sock.end()
      return
    }

    sock.write(`Fibonnacci result for ${num} is ${f.number}\n`)
    sock.write(`${f.iterations} iterations done\n`)
    sock.end()
  }
}
