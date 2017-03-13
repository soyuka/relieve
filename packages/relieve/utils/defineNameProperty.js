'use strict'
const uuid = require('uuid')

/**
 * Registers getter and setter for `.name` property on the given prototype
 * The default name will be a generated uuid
 *
 * The setter sets the name once!
 * @param {Function} Fn The prototype where name will be added
 */
function defineNameProperty(Fn) {
  Object.defineProperty(Fn.prototype, 'name', {
    get: function getName() {
      if(this._name === undefined) {
        this._name = uuid.v4()
      }

      return this._name
    },
    set: function setName(name) {
      if(this._name !== undefined) {
        throw new TypeError('Name can be set only once')
      }

      this._name = name
      this._nameGenerated = false
    }
  })
}

module.exports = defineNameProperty
