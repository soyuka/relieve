'use strict'

/**
 * The Weighted Strategy for the CloudWorker
 * Increments a number when each task gets called,
 * the next task will get the one with the lowest score
 *
 * This strategy resides in memory and resolves promises to be used with
 * redis or another Queue/Set score provider
 * @module strategies/WeightedStrategy
 */

module.exports = {
  /** @property {Array} Queue */
  queue: [],
  /**
   * Get the queue element by name
   * @param {String} name
   * @return {Object} the task
   */
  get: function(name) {
    return this.queue.find(e => e.name === name)
  },
  /**
   * Adds a task to the queue
   * @param {String} name
   * @return {Promise}
   */
  push: function(name) {
    this.queue.push({score: 0, name: name})
    return Promise.resolve()
  },
  /**
   * Removes a task from the queue by name
   * @param {String} Name
   */
  remove: function(name) {
    let i = this.queue.findIndex(e => e.name === name)

    if(~i)
      this.queue.splice(i, 1)
  },
  /**
   * Starts a task, increments the score
   * @param {String} name
   * @return {Promise}
   */
  start: function(name) {
    this.get(name).score++
    return Promise.resolve()
  },
  /**
   * Ends a task, decrements the score
   * @param {String} name
   * @return {Promise}
   */
  end: function(name) {
    this.get(name).score--
    return Promise.resolve()
  },
  /**
   * Returns the next available task
   * @return {Promise} Resolves the task name
   */
  next: function() {
   this.queue.sort((a, b) => a.score - b.score)

   return Promise.resolve(this.queue[0].name)
  }
}
