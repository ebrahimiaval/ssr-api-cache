'use strict';var _extends=Object.assign||function(a){for(var b,c=1;c<arguments.length;c++)for(var d in b=arguments[c],b)Object.prototype.hasOwnProperty.call(b,d)&&(a[d]=b[d]);return a},axios=require('axios');try{var fs=require('fs')}catch(a){fs={}}module.exports=function(a){var b=_extends({validIP:null,prefix:'__',postfix:'',strict:!1,onUpdated:function a(){return null},apiRoute:'/api/update'},a),c=b.express,d=b.validIP,e=b.list,f=b.apiRoute,g=b.strict,h=b.filePath,i=function(a){return b.prefix+a.name+b.postfix},j=function(a){return'ssr-api-cache ERROR: please set \''+a+'\' parameter in define staticDataBuilder() place, because this is a require parameter.'},k=function(a,b){var c='';return e.forEach(function(d){var e=i(d),f=void 0;d.name===a?(f=b,global[e]=b):f=global[e],c+='window.'+e+'='+JSON.stringify(f)+';'}),c},l=function(a){var b=a.madeContext,c=a.updatedItem,d=a.newValue,e=b||k(c.name,d),f=new Promise(function(a,b){fs.writeFile(h,e,function(c){c?(console.error(c),b('can not build clientside js file.')):a()})});return f},m=function(a,c){var d=l({updatedItem:a,newValue:c});return d.then(function(){b.onUpdated(a,c)}),d},n=function(a){var b=new Promise(function(b,c){axios({url:a.api}).then(function(d){m(a,d.data).then(function(){b()}).catch(function(a){c(a)})}).catch(function(b){b.response?(console.log(b.response.data),console.log(b.response.status),console.log(b.response.headers)):b.request?console.log(b.request):console.log(b.message),c('can not fetch data from '+a.api+' API.')})});return b};if('undefined'==typeof c)throw j('express');if('undefined'==typeof e)throw j('list');var o='';e.forEach(function(a){var b=i(a);global[b]=a.default||null,o+='window.'+b+'='+JSON.stringify(a.default)+';'}),l({madeContext:o}).then(function(){console.info('ssr-api-cache SUCCESSFULL: static data defined with default value successfully.'),e.forEach(function(a){n(a).catch(function(a){console.error('ssr-api-cache ERROR: ',a,'(error in first load)')})})}),c.patch(f+'/:name',function(a,b){var c=a.params.name,f=a.headers['x-forwarded-for']||a.connection.remoteAddress,g=void 0,h=void 0,i=!1;if(Array.isArray(d)){var k=d.filter(function(a){return a===f});i=0===k.length}else'string'==typeof d&&(i=f!==d);i&&(g=402,h='You have not access to run update cache api!');var j=null;e.forEach(function(a){a.name===c&&(j=a)}),null===j?(g=404,h='not found any item with name = '+c+'. check inserted value.'):n(j).then(function(){g=200,h=c+' successfully updated.'}).catch(function(a){console.error('ssr-api-cache ERROR: ',a,'(error in update API - requested IP '+f+')'),g=500,h='have error during fetch data from api \''+j.api+'\' of \''+j.name+'\'.'}),b.status(g).send(h)})};