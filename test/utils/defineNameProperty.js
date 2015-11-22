var defineNameProperty = require(src + '/utils/defineNameProperty.js')
describe('defineNameProperty', function() {
 it('should register name getter/setter', function() {
    function Task() {}

    defineNameProperty(Task) 

    var task = new Task()
    task.name = 'test'

    expect(task.name).to.equal('test')
 }) 

 it('should get default name', function() {
    function Task() {}

    defineNameProperty(Task) 

    var task = new Task()

    expect(task.name).not.to.be.undefined
 }) 

 it('should fail setting name twice', function() {
    function Task() {}

    defineNameProperty(Task) 

    var task = new Task()
    task.name = 'test'

    try {
      task.name = 'test'
    } catch(e) {
      expect(e).to.be.an.instanceof(TypeError)
    }
 }) 
})
