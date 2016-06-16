'use strict'

/**
 * registers a readOnly property
 * @param {Function} Fn
 * @param {String} key
 * @param {Function} getter
 */
function readOnly(Fn, key, getter) {
  Object.defineProperty(Fn.prototype, key, {
    get: getter,
    set: function setName(name) {
      throw new ReferenceError('Property is read-only')
    }
  })
}

module.exports = readOnly
