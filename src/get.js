/**
 * read value of one cache
 * @type {{setup: setup, get}}
 */
module.exports = function (name) {
    return (typeof window === 'undefined') ? global['__' + name] : window['__' + name];
}
