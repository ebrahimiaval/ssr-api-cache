const
    // import ssr-api-cache module
    cacheSetup = require('../setup'),
    getCache = require('../getCache'),
    // create an express app
    express = require('express'),
    app = express();


// load static file
app.use(express.static(__dirname + '/public'));


/**
 * fake api for test staticDataBuilder
 * generate dynamic response
 */
app.get('/api/:name', function (req, res) {
    const
        time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        data = [req.params.name, time];

    res.status(200).send(data);
});


/**
 * see server side value
 */
app.use('/server', function (req, res) {
    const data = `
    menu = ${JSON.stringify(getCache("menu"))} <br/>
    theme = ${JSON.stringify(getCache("theme"))} <br/>
    help = ${JSON.stringify(getCache("help"))}<br/>
    -----------------------------<br/>
    fileName = ${process.env.SSRAPICACHE_FILENAME} <br/>
    `;

    res.status(200).send(data);
});





//>>>>>>>>>>> defne ssr-api-cache demo >>>>>>>>>>>>>>>>>
cacheSetup({
    api: {
        express: app,
        // method : 'patch',
        // route :  '/api/update/',
        // validation: null,
    },
    file: {
        hash: 15,
        path: "demo/public/",
        // name: 'cache',
        // extension : 'js'
    },
    onUpdated: function (cacheItem, newVlaue) {
        console.log(cacheItem.name + " updated to " + JSON.stringify(newVlaue));
        // console.log(item.name + " update to ", global['__' + item.name]);
    },
    list: [
        {
            url: 'http://localhost:3030/api/menu',
            name: 'menu',
            default: "default menu",
            // update: 5000 // auto update as second (24h = 86400s)
        },
        {
            url: 'http://localhost:3030/api/theme',
            name: 'theme',
        },
        {
            url: 'http://localhost:3030/api/help',
            name: 'help',
            default: "default help"
        }
    ]
});
// <<<<<<<<< END - staticDataBuilder demo <<<<<<<<<<<<<<<


app.listen(3030, error => {
    if (error)
        return console.error('Express Error', error);
    else
        console.log(`~~~~~~~~~~~ ssr-api-cache demo available at http://localhost:3030 ~~~~~~~~~~~`);
});
