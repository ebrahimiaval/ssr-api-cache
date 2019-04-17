'use strict';var _extends=Object.assign||function(a){for(var b,c=1;c<arguments.length;c++)for(var d in b=arguments[c],b)Object.prototype.hasOwnProperty.call(b,d)&&(a[d]=b[d]);return a},axios=require('axios'),fs=require('fs');module.exports=function(a){var b=_extends({onUpdated:function a(){return null}},a);b.file=_extends({hash:!1,path:'public/',name:'cache',extension:'js'},a.file),b.api=_extends({method:'patch',route:'/api/update/',validation:null},a.api);var c=b.list,d=b.api;('/'!==d.route.slice(-1)||'/'!==d.route.slice(0,1))&&console.error('ERROR ssr-api-cache: add slash character at start and end of "api.route" property in setup config.(exp: "/api/update/")'),'/'!==b.file.path.slice(-1)&&console.error('ERROR ssr-api-cache: add slash character at end of "file.path" property in setup config.'),'undefined'==typeof c&&console.error('ERROR ssr-api-cache: please set "list" property in setup config, because this is a require parameter.');var e=function(){for(var a=!0===b.file.hash?6:b.file.hash,c='',d=0;d<a;d++)c+='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random()*62));return c},f=function(){var a='window.__ssrApiCache__='+JSON.stringify(global.__ssrApiCache__),c=b.file.hash?'?v='+e():'',d=b.file.name+'.'+b.file.extension;process.env.SSRAPICACHE_FILENAME=d+c;var f=b.file.path+d,g=new Promise(function(b,c){fs.writeFile(f,a,function(a){a?(console.error(a),c('occur an error during write on clientside js file.')):b('succesfully write fileContext inside of clientside js file.')})});return g},g=function(a,c){var d=global.__ssrApiCache__[a.name];'undefined'!=typeof a&&(global.__ssrApiCache__[a.name]=c);var e=f();return e.then(function(){b.onUpdated(a,c)}).catch(function(){global.__ssrApiCache__[a.name]=d}),e},h=function(a){var b=new Promise(function(b,c){axios({url:a.url}).then(function(d){g(a,d.data).then(function(a){b(a)}).catch(function(a){c(a)})}).catch(function(b){b.response?(console.log(b.response.data),console.log(b.response.status),console.log(b.response.headers)):b.request?console.log(b.request):console.log(b.message),c('can not fetch data from '+a.url+' API.')})});return b};if(global.__ssrApiCache__={},c.forEach(function(a){global.__ssrApiCache__[a.name]=a.default||null,'undefined'!=typeof a.update&&setInterval(function(){h(a).catch(function(a){console.error('ERROR ssr-api-cache: ',a,'(error in item auto update)')})},a.update)}),f().then(function(){console.info('SUCCESSFULL ssr-api-cache: cache items defined with default value successfully.'),c.forEach(function(a){h(a).catch(function(a){console.error('ERROR ssr-api-cache: ',a,'(error in first load)')})})}),'undefined'!=typeof d.express){var i=d.route+':name';d.express.use(i,function(a,b,e){if(a.method.toLowerCase()===d.method.toLowerCase()){var f=d.validation,g=a.params.name,i=a.headers['x-forwarded-for']||a.connection.remoteAddress,j=!1;if('string'==typeof f)j=f!==i;else if('function'==typeof f)j=!f(a);else if(Array.isArray(f)){var k=f.filter(function(a){return a===i});j=0===k.length}else null!==f&&(console.error('ERROR ssr-api-cache: value of api.validation is invalid and we banned all update request. read ssr-api-cache document.'),j=!0);if(j)return b.status(402).send('You have not access to run update cache api!'),!1;var l=null;c.forEach(function(a){a.name===g&&(l=a)}),null===l?b.status(404).send('not found any item with name = '+g+'. check inserted value.'):h(l).then(function(){b.status(200).send(g+' successfully updated.')}).catch(function(a){console.error('ERROR ssr-api-cache: ',a,'(error in update API - requested IP '+i+')'),b.status(500).send('have error during fetch data from api \''+l.url+'\' of \''+l.name+'\'.')})}else e()})}};