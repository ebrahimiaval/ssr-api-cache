'use strict';var getCache=function(a){return'undefined'==typeof window?global['__'+a]:window['__'+a]};'undefined'!=typeof module&&'undefined'!=typeof module.exports?module.exports=getCache:'function'==typeof define&&define.amd?define([],function(){return getCache}):window.getCache=getCache;