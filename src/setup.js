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
 * @param userOption
 */
module.exports = function (userOption) {
    /**
     * ---- options ----
     * @prefix
     *  type : string
     *  default:'__'
     *  exp: '__myPrefix__'
     * all static data define as global variables and interference value may occur.
     * use postfix and prefix to fix this problem.
     * NOTICE: by default we just add '__' prefix to variable but in complex project
     * we recommend define complex prefix and postfix to ensure interference never occur.
     *
     *
     * @postfix
     *  type : string
     *  default:''
     *  exp: '__myPostfix__'
     * like prefix. read prefix description.
     *
     *
     * @validIP
     *  type: string || array[string,...] || null
     *  default: null (all users is valid)
     *  string exp: '192.168.1.1'
     *  array exp: ['192.168.1.1', '192.168.1.2']
     * with this param you can controll access to update APIs.
     * by default is null and mean all user can update static files
     * but when you set an valid IP or IPs then just this IPs can do update static data.
     *
     * @strict
     *  type: boolean
     *  default: false
     * when strict is true then module use promissAll to ensure
     * all data sucessfully fetched from API in first load time
     * else an error will not be excute when an item is not fetch succesfully.
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
        // extend user options with default options
        options = {
            ...{
                validIP: null,
                prefix: '__',
                postfix: '',
                strict: false,
                onUpdated: () => null,
                apiRoute: '/api/update', // default api route is '/api/update' and use look like this: localhost:8000/api/update/menu
            },
            ...userOption
        },
        // directly access to options parameter
        {express, validIP, list, apiRoute, strict, filePath} = options;


    //----------- utility functions -----------------//
    const
        /**
         * variable name provider
         *
         * @param item<object> : an item of options 'list' parameter
         * @returns {string} : built name of static data. exp: return '__title' for item name 'title'
         */
        sdName = (item) => options.prefix + item.name + options.postfix,

        /**
         * require option parameter validation Message
         *
         * @param paramName: name of option parameter.exp:'express'
         * @returns {string} : error message string
         */
        validationErrorMessage = (paramName) => "ssr-api-cache ERROR: please set '" + paramName + "' parameter in define staticDataBuilder() place, because this is a require parameter.",

        /**
         * file Context Builder
         * build context of js file. contain all static data as global variabels.
         *
         * /@param updatedItemName : name of updated item.
         * when user run an update api for update one item name of this item passed as updatedItemName.
         * if updayeItemName does not exist then value of client side global variabel is equal with
         * server global varibale at now.
         * /@param newValue : is require just when updatedItemName is exist and contain updated item data.
         * @returns {string} : an string contain all static data values. exp: window.__a='a';window.__b='b';
         */
        fileContextBuilder = function (updatedItemName, newValue) {
            let context = "";
            list.forEach(function (item) {
                // built name of item (name with prefix and postfix)
                const name = sdName(item);

                // define value of item.
                // if this item is updated item we insert newValue to value
                // else value is equal with his global variable
                let value;
                if (item.name !== updatedItemName) {
                    value = global[name];
                } else {
                    // set new value for client variable
                    value = newValue;

                    // update server variable
                    global[name] = newValue;
                }

                // join string of static data global varabels.
                // Convert value to string for write to file
                context += `window.${name}=${JSON.stringify(value)};`;
            });

            // retrun an string contain all static data values.
            return context;
        },

        /**
         *
         * /@param madeContext : use when context of file
         * avaiable and dont need run fileContextBuilder(). used in first load define value.
         * /@param updatedItemName : name of updated item.
         * /@param newValue : is require just when updatedItemName is exist and contain updated item data.
         * @returns {Promise<any>}
         */
        buildJsFile = function ({madeContext, updatedItem, newValue}) {
            // an string contain all static data values. exp: window.__a='a';window.__b='b';
            const fileContext = madeContext || fileContextBuilder(updatedItem.name, newValue);

            // write on file (and create if does not exist)
            const writeFilePromise = new Promise(function (resolve, reject) {
                fs.writeFile(filePath, fileContext, function (error) {
                    if (error) {
                        //ERROR
                        console.error(error);

                        // when occur an error during write on file
                        reject('can not build clientside js file.');
                    } else {
                        // succesfully write fileContext inside of clientside js file.
                        resolve();
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
         * @param updatedItem : an item of list (options.list)
         * @param newValue : new value of item (feched from api)
         */
        updateItem = function (updatedItem, newValue) {

            const writeFilePromise = buildJsFile({updatedItem: updatedItem, newValue: newValue});

            // update server global variable
            writeFilePromise
                .then(function () {
                    // // built name of item (name with prefix and postfix)
                    // const name = sdName(updatedItem);
                    //
                    // global[name] = newValue;

                    // trigger onUpdated event
                    options.onUpdated(updatedItem, newValue);
                });

            return writeFilePromise;
        },

        /**
         *
         * @param item
         */
        fetchDataFromApi = function (item) {
            const fetchPromise = new Promise(function (resolve, reject) {
                axios({url: item.api})
                    .then(function (response) {
                        updateItem(item, response.data)
                            .then(function () {
                                // when occur below. see buildJsFile() method.
                                // >> succesfully write fileContext inside of clientside js file.
                                resolve();
                            })
                            .catch(function (error) {
                                //when happen error. see buildJsFile() method.
                                reject(error);
                            })
                    })
                    .catch(function (error) {
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
                        reject("can not fetch data from " + item.api + " API.");
                    });
            });

            return fetchPromise;
        };


    //----------- define and build -----------------//

    /**
     * check require options parameter definded
     */
    if (typeof express === 'undefined')
        throw validationErrorMessage('express'); // express app object
    if (typeof list === 'undefined')
        throw validationErrorMessage('list'); // list of static data info



    /**
     * set default value (first load)
     *
     * define global variable in server and make static data js file with
     * default value set to list item (list is parameter of options)
     */
    let firstFileContext = "";
    list.forEach(function (item) {
        // built name of item (name with prefix and postfix)
        const name = sdName(item);

        // SSR var - global variabels used in server side render static data
        // exp: global.__title="hot page"
        global[name] = item.default || null;

        // join string of static data global varabels.
        firstFileContext += `window.${name}=${JSON.stringify(item.default)};`;
    });
    // create js file (if does not exist) and write firstFileContext in it.
    buildJsFile({madeContext: firstFileContext})
        .then(function () {
            console.info('ssr-api-cache SUCCESSFULL: static data defined with default value successfully.');

            // first fetch data from api
            list.forEach(function (item) {
                fetchDataFromApi(item)
                    .catch(function (error) {
                        console.error('ssr-api-cache ERROR: ', error, '(error in first load)');
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
    express.patch(apiRoute + '/:name', function (req, res) {
        const
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
        //
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
                    console.error('ssr-api-cache ERROR: ', error, `(error in update API - requested IP ${ip})`);
                    //
                    status = 500;
                    response = `have error during fetch data from api '${targetItem.api}' of '${targetItem.name}'.`;
                });
        } else {
            status = 404;
            response = `not found any item with name = ${name}. check inserted value.`;
        }

        res.status(status).send(response);
    });
}





// /**
//  * read value of one cache
//  * @type {{setup: setup, get}}
//  */
// const get = function (name) {
//     return (typeof window === 'undefined') ? global.__ssrApiCache__[name] : window.__ssrApiCache__[name];
// }
//
//


// /**
//  * export
//  * @type {{setup: setup, get: {setup: setup, get}}}
//  */
// module.exports = {
//     setup: setup,
//     get: get
// }
