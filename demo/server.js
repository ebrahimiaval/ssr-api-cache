const
    // import ssr-api-cache module
    ssrApiCache = require('../dist/ssr-api-cache'),
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





//>>>>>>>>>>> defne ssr-api-cache demo >>>>>>>>>>>>>>>>>
ssrApiCache({
    // apiRoute: '/api/update',
    express: app,
    // validIP: '192.168.6.23',
    // strict: true,
    filePath: "demo/public/staticdata.js",
    onUpdated: function (item, newVlaue) {
        // console.log(item.name + " update to ", global['__' + item.name]);
    },
    list: [
        {
            api: 'http://localhost:3030/api/menu',
            name: 'menu',
            default: "default menu",
            // update : 86400 // auto update as second (24h = 86400s)
            // expire: 86400 // auto update as second (24h = 86400s)
        },
        {
            api: 'http://localhost:3030/api/theme',
            name: 'theme',
        },
        {
            api: 'http://localhost:3030/api/help',
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
