'use strict';

const http = require('http');

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
    .option('port', {
        alias: 'p',
        type: 'number',
        description: 'Port on which to listen',
        default: '4000',
    })
    .option('serverName', {
        type: 'string',
        description: 'Hostname of the instance metadata server',
        default: '169.254.169.254',
    })
    .option('serverPort', {
        type: 'number',
        description: 'Port of the instance metadata server',
        default: '80',
    })
    .option('realRegion', {
        type: 'string',
        description: 'Real region that the instance is in',
        default: 'us-east-1',
    })
    .option('emulatedRegion', {
        type: 'string',
        description: 'Region in which the emulator has placed the instance',
        default: 'us-iso-east-1',
    })
    .argv;

const server = http.createServer().listen(argv.port);

const toReplace = new RegExp(argv.realRegion, 'g');

console.log("Listening on " + argv.port)

server.on('request', (req, res) => {
    var connector = http.request({
        host: argv.serverName,
        port: argv.serverPort,
        path: req.url,
        method: req.method,
        headers: req.headers
    }, (resp) => {
        console.log("Forwarding request for " + req.url)
        res.statusCode = resp.statusCode
        new Promise((resolve, reject) => {
            const chunks = []
            resp.on('data', chunk => chunks.push(chunk))
            resp.on('error', reject)
            resp.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
        }).then( (resp) => {
            res.end(resp.replace(toReplace, argv.emulatedRegion));
        }).catch( (error) => {
            console.error(error);
            res.statusCode = 500
            res.end(error);
        })
    });

    req.pipe(connector);
});