/**
 * SSR API Cache
 *
 * define global variable in server for server side render
 * and create a file and write global variable on it for client side render
 *
 */
const axios = require("axios");
try {
    var fs = require('fs');
} catch (err) {
    fs = {};
}




/**
 *  build cache stream
 * @param userConfig
 */
module.exports = function (userConfig) {
    /**
     * ---- config ----
     * @validIP
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
    const
        storeName = '__ssrApiCache__';


    // extend user config with default config
    const config = {
        ...{
            filePath: 'public/',
            fileName: 'cache.js',
            strict: false,
            onUpdated: () => null
        },
        ...userConfig
    };

    // extend app
    config.api = {
        method: 'patch',
        route: '/api/update/', // default api route is '/api/update' and use look like this: localhost:8000/api/update/menu
        validIP: null,
        ...userConfig.api
    }

    // directly access to config parameter
    const {list, api} = config;


    /**
     * ----- config parameter validation ----
     */
    if (api.route.slice(-1) !== '/' || api.route.slice(0, 1) !== '/')
        console.error('ERROR ssr-api-cache: add slash character at start and end of "api.route" property in setup config.(exp: "/api/update/")');

    if (config.filePath.slice(-1) !== '/')
        console.error('ERROR ssr-api-cache: add slash character at end of "filePath" property in setup config.');

    if (typeof list === 'undefined')
        console.error('ERROR ssr-api-cache: please set "list" property in setup config, because this is a require parameter.');





    //----------- utility functions -----------------//
    const
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

            // file address. defaule is 'public/cache.js'
            const fileAddress = config.filePath + config.fileName;

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
     * set default value (first load)
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
            if (req.method === api.method.toLowerCase()) {
                const
                    validIP = config.app.validIP,
                    name = req.params.name,
                    ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

                let status, response;

                // -------  validation -------
                let isInvalid = false;
                if (Array.isArray(validIP)) {
                    const detectList = validIP.filter(function (item) {
                        return item === ip;
                    });
                    //
                    isInvalid = detectList.length === 0;
                }
                else if (typeof validIP === "string") {
                    isInvalid = ip !== validIP;
                }
                // reject request for invalid user - when request ip not match to validIP user is invalid
                // NOTICE: by default all ip is valid (validIP === null)
                if (isInvalid) {
                    status = 402;
                    response = "You have not access to run update cache api!";
                }

                // fetch data and update
                let targetItem = null
                list.forEach(function (item) {
                    if (item.name === name)
                        targetItem = item;
                });

                if (targetItem !== null) {
                    fetchDataFromApi(targetItem)
                        .then(function () {
                            status = 200;
                            response = name + " successfully updated.";
                        })
                        .catch(function (error) {
                            console.error('ERROR ssr-api-cache: ', error, `(error in update API - requested IP ${ip})`);
                            //
                            status = 500;
                            response = `have error during fetch data from api '${targetItem.api}' of '${targetItem.name}'.`;
                        });
                } else {
                    status = 404;
                    response = `not found any item with name = ${name}. check inserted value.`;
                }

                res.status(status).send(response);
            } else {
                next();
            }
        });
    }
}
