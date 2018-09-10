/**
 * SSR API Cache
 *
 * define global variable in server for server side render
 * and create a file and write global variable on it for client side render
 *
 */
const axios = require("axios");
const fs = require('fs');




/**
 *  build cache stream
 * @param userConfig
 */
module.exports = function (userConfig) {
    /**
     * ---- config ----
     * @validation
     *  type: string || array[string,...] || null
     *  default: null (all users is valid)
     *  string exp: '192.168.1.1'
     *  array exp: ['192.168.1.1', '192.168.1.2']
     * with this param you can controll access to update APIs.
     * by default is null and mean all user can update static files
     * but when you set an valid IP or IPs then just this IPs can do update static data.
     *
     *
     * @list
     *  isRequire
     *  type : array[item, ...]
     *      @item
     *      type : object
     *      {
     *          @name
     *              isRequire
     *              type: string
     *              exp: 'menu'
     *          @api
     *              isRequire
     *              type: string
     *              exp: 'localhost:3000/api/menu'
     *          @default
     *              type: any
     *              default: null
     *      }
     *
     */


    // extend user config with default config
    const config = {
        ...{onUpdated: () => null},
        ...userConfig
    };

    // extend file parameter
    config.file = {
        hash: false,
        path: 'public/',
        name: 'cache',
        extension: 'js',
        ...userConfig.file
    }

    // extend api parameter
    config.api = {
        method: 'patch',
        route: '/api/update/', // default api route is '/api/update' and use look like this: localhost:8000/api/update/menu
        validation: null, // String: valid ip - Array: [ip1, ip2, ...] - Function: if return true valid else is invalid
        ...userConfig.api
    }

    /**
     *  ----- define constants ----
     */
        // directly access to config parameter
    const
        {list, api} = config,
        storeName = '__ssrApiCache__';


    /**
     * ----- config parameter validation ----
     */
    if (api.route.slice(-1) !== '/' || api.route.slice(0, 1) !== '/')
        console.error('ERROR ssr-api-cache: add slash character at start and end of "api.route" property in setup config.(exp: "/api/update/")');

    if (config.file.path.slice(-1) !== '/')
        console.error('ERROR ssr-api-cache: add slash character at end of "file.path" property in setup config.');

    if (typeof list === 'undefined')
        console.error('ERROR ssr-api-cache: please set "list" property in setup config, because this is a require parameter.');





    //----------- utility functions -----------------//
    const
        /**
         * use for generate unique verion for cache.js file when file.hash is true
         * @returns {string} : hash string like :"aAd12s"
         */
        versionHash = function () {
            const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            let text = "";
            for (var i = 0; i < 6; i++)
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            return text;
        },

        /**
         *
         * /@param madeContext : use when context of file
         * avaiable and dont need run fileContextBuilder(). used in first load define value.
         * /@param cacheItemName : name of updated item.
         * /@param newValue : is require just when cacheItemName is exist and contain updated item data.
         * @returns {Promise<any>}
         */
        buildJsFile = function () {
            // an string contain all static data values. exp: window.__a='a';window.__b='b';
            const fileContext = `window.${storeName}=${JSON.stringify(global[storeName])}`;

            // define file name
            const fileName = config.file.name + (config.file.hash ? versionHash() : '') + '.' + config.file.extension;

            // for access to fileName.js
            process.env['SSRAPICACHE_FILENAME'] = fileName;

            // file address. defaule is 'public/cache.js' or when hash is true  'public/cache1As74.js'
            const fileAddress = config.file.path + fileName;

            // write on file (and create if does not exist)
            const writeFilePromise = new Promise(function (resolve, reject) {
                fs.writeFile(fileAddress, fileContext, function (error) {
                    if (error) {
                        console.error(error);
                        reject('occur an error during write on clientside js file.');
                    } else {
                        resolve('succesfully write fileContext inside of clientside js file.');
                    }
                });
            });

            return writeFilePromise;
        },

        /**
         * update value of one list item
         *
         * we send an item of list with new value to updateItem
         * then this method call fileContextBuilder and buildJsFile at end update server global variables
         *
         * @param cacheItem : an item of list (config.list)
         * @param newValue : new value of item (feched from api)
         */
        updateItem = function (cacheItem, newValue) {
            // for coming back when can not write on file.
            const lastVlaue = global[storeName][cacheItem.name];

            // update cacheItem
            if (typeof cacheItem !== 'undefined')
                global[storeName][cacheItem.name] = newValue;

            // write cache item to js file
            const writeFilePromise = buildJsFile();

            writeFilePromise
                .then(function () {
                    // trigger onUpdated event
                    config.onUpdated(cacheItem, newValue);
                })
                .catch(function () {
                    // coming back to last value when can not write on file.
                    global[storeName][cacheItem.name] = lastVlaue;
                });

            return writeFilePromise;
        },

        /**
         *
         * @param item
         */
        fetchDataFromApi = function (item) {
            const fetchPromise = new Promise(function (resolve, reject) {
                axios({url: item.url})
                    .then(function (response) {
                        updateItem(item, response.data)
                            .then(function (value) {
                                // when occur below. see buildJsFile() method.
                                // >> succesfully write fileContext inside of clientside js file.
                                resolve(value);
                            })
                            .catch(function (error) {
                                //when happen error. see buildJsFile() method.
                                reject(error);
                            })
                    })
                    .catch(function (error) {
                        //axios error handling
                        if (error.response) {
                            // The request was made and the server responded with a status code
                            // that falls out of the range of 2xx
                            console.log(error.response.data);
                            console.log(error.response.status);
                            console.log(error.response.headers);
                        } else if (error.request) {
                            // The request was made but no response was received
                            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                            // http.ClientRequest in node.js
                            console.log(error.request);
                        } else {
                            // Something happened in setting up the request that triggered an Error
                            console.log(error.message);
                        }

                        // when server can not fetch data from api
                        reject("can not fetch data from " + item.url + " API.");
                    });
            });

            return fetchPromise;
        };


    /**
     * first load - set default value
     *
     * define global variable in server and make static data js file with
     * default value set to list item (list is parameter of config)
     */
    // define server cache store with storeName name
    global[storeName] = {};
    //build server cache store
    list.forEach(function (item) {
        // SSR var - global variabels used in server side render static data
        // exp: global.__title="hot page"
        global[storeName][item.name] = item.default || null;

        // set auto update
        if (typeof item.update !== 'undefined')
            setInterval(function () {
                fetchDataFromApi(item)
                    .catch(function (error) {
                        console.error('ERROR ssr-api-cache: ', error, '(error in item auto update)');
                    });
            }, item.update);
    });

    // create js file (if does not exist) and write firstFileContext in it.
    buildJsFile()
        .then(function () {
            console.info('SUCCESSFULL ssr-api-cache: cache items defined with default value successfully.');

            // first fetch data from api
            list.forEach(function (item) {
                fetchDataFromApi(item)
                    .catch(function (error) {
                        console.error('ERROR ssr-api-cache: ', error, '(error in first load)');
                    });
            });
        });





    /**
     *  define API
     *
     *  define express api
     * update staticdata.js
     * update mega menu data and footer link
     */
    if (typeof api.express !== 'undefined') {
        const apiRoute = api.route + ':name';
        //
        api.express.use(apiRoute, function (req, res, next) {

            if (req.method.toLowerCase() === api.method.toLowerCase()) {
                const
                    validation = api.validation,
                    name = req.params.name,
                    ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                // -------  validation -------
                let isInvalid = true;
                if (typeof validation === "string") {
                    isInvalid = (validation !== ip);
                }
                else if (typeof validation === "function") {
                    isInvalid = validation(req);
                }
                else if (Array.isArray(validation)) {
                    // list of IPs. exp : ['192.168.1.1','192.168.1.2', '192.168.1.3']
                    const detectList = validation.filter(function (item) {
                        return item === ip;
                    });
                    //
                    isInvalid = (detectList.length === 0);
                } else if (validation !== null) {
                    console.error('ERROR ssr-api-cache: value of api.validation is invalid and we banned all update request. read ssr-api-cache document.')
                    isInvalid = true;
                }
                // reject request for invalid user - when request ip not match to validation user is invalid
                // NOTICE: by default all ip is valid (validation === null)
                if (isInvalid) {
                    res.status(402).send("You have not access to run update cache api!");
                    return false;
                }

                // fetch data and update
                let targetItem = null
                list.forEach(function (item) {
                    if (item.name === name)
                        targetItem = item;
                });

                // fetch data from api
                if (targetItem !== null) {
                    fetchDataFromApi(targetItem)
                        .then(function () {
                            res.status(200).send(name + " successfully updated.");
                        })
                        .catch(function (error) {
                            console.error('ERROR ssr-api-cache: ', error, `(error in update API - requested IP ${ip})`);
                            //
                            res.status(500).send(`have error during fetch data from api '${targetItem.api}' of '${targetItem.name}'.`);
                        });
                } else {
                    res.status(404).send(`not found any item with name = ${name}. check inserted value.`);
                }
            } else {
                next();
            }
        });
    }
}
