
/**
 * read value of one cache
 * @param name <string> : name of cache item (name is equal with name property of option list item in setup() confing)
 * @returns {*} value of cache item
 */
const getCache = (name) => (typeof window === 'undefined') ? global.__ssrApiCache__[name] : window.__ssrApiCache__[name];


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
