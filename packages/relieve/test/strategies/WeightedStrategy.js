var strategy = require(src + '/strategies/WeightedStrategy.js')
var Promise = require('bluebird')
var t0, t1

describe('Strategy', function() {
  it('should add some values', function() {
    Promise.all([
      strategy.push('test1'),
      strategy.push('test2'),
      strategy.push('test3') 
    ])
  }) 

  it('should get the next value', function() {
   return strategy.next() 
   .then(function(v) {
      expect(v).not.to.be.undefined
      t0 = v
      return strategy.start(v)
   })
  })

  it('should get the next value', function() {
   return strategy.next() 
   .then(function(v) {
      expect(v).not.to.be.undefined
      expect(v).not.to.equal(t0)
      t1 = v

      return Promise.all([strategy.start(v), strategy.end(t0)])
   })
  })

  it('should get the next value', function() {
   return strategy.next() 
   .then(function(v) {
      expect(v).not.to.be.undefined
      expect(v).not.to.equal(t1)
      return strategy.start(v)
   })
  })

  it('should get test1', function() {
   expect(strategy.get('test1')).to.deep.equal({score: 0, name: 'test1'})
  })

  it('should get nothing', function() {
   expect(strategy.get('nothing')).to.be.undefined
  })

  it('should remove strategy', function() {
    strategy.remove('test1')

    expect(strategy.get('test1')).to.be.undefined
  })
})
