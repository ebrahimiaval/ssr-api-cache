# ssr-api-cache
is a caching module for cache data of API and let to backend server to 
 update caches with update data API when occur some changes.
 
 useful for SSR (server side render) like React js SSR. ssr-api-cache build an JS file 
for Client-side render and use Memory for cache data in server side.

ssr-api-cache create update cache API for each api and use nodejs Express for this action.
 
 ## config
 ```js
const config = {
    // define update APIs.
    // default: (not required) by default module does not define update API.
    // with this api item server can update cached data in your server when data changed
    // or update cached data manually.
    api: {
        // your express app object.
        // defult: (IS REQUIRED) for have update API.
        // if express undefined then module do not define update API and mean
        // update jusr can be happend with auto update (cache item update property) or restart server.
        express: app,
        // method of update APIs.
        // default : (not required) 'patch'
        method: 'patch',
        // route of API (NOTICE: started and ended with slash)
        // default : (not required) '/api/update/'
        route: '/api/update/',
        // request validation
        // you can use string,array or function to define value.
        // default: (not required) null 
        // value:
        //      null (default) all request is valid.
        //      String: valid ip. exp:'192.168.1.1'
        //      Array [ip1, ip2, ...] list of valid ip. exp: ['192.168.1.1', '192.168.1.2']
        //      Function(req): 
        //              if return true value then valid else is invalid. 
        //              module pass express req object to function.
        validation: null,
    },
    // config client side js file
    // default: (not required) module use default config.
    file: {
        // use for generate unique verion for cache.js file.exp :"cache1Ad12s.js"
        // when set hash true you most define name of js file with 'global.__ssrApiCache__fileName__' in server side.
        // default: (not required) false
        hash: false,
        // file path. start from root of nodejs server.
        // (NOTICE: ended with slash and not exist slash at start)
        // default: (not required) false 'public/'
        path: 'public/',
        // name of file
        // default: (not required) 'cache'
        name: 'cache',
        // extenstion of file. exp: cache.js
        // default: (not required) 'js' 
        extension: 'js'
    },
    // triger when each item of list updated.
    // not trigger for define default value but trigger when his data fetched from API.
    // default: (not required)
    onUpdated: function (cacheItem, newVlaue) {
        console.log(cacheItem.name + " updated to " + JSON.stringify(newVlaue));
    },
    // list of cache items.
    // (IS REQUIRE) at least one item.
    list: [
        {
            // fetch data api
            // default: (IS REQUIRED) full path of api
            // exp: 'http://localhost:3030/api/menu'
            url: 'http://localhost:3030/api/menu',
            // name of cacheItem. 
            // used to access to value with getCache(name) method.
            // default: (IS REQUIRED) string and start with [A-Za-z_$]
            // exp: 'menu'
            name: 'menu',
            // default value of cache item.
            // default: (not required) null 
            // exp: 'default menu'
            default: 'default menu',
            // auto update cache item(milisecond)
            // by default is off.
            // default: (not required) undefined 
            // exp: 86400
            update: 86400 
        },
       // and more ....
    ]
}
```