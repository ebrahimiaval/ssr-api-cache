/**
 * read value of one cache
 * @type {{setup: setup, get}}
 */

const getCache = function (name) {
    return (typeof window === 'undefined') ? global['__' + name] : window['__' + name];
}


if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = getCache
}
else if (typeof define === 'function' && define.amd) {
    define([], function () {
        return getCache;
    });
}
else {
    window['getCache'] = getCache;
}
