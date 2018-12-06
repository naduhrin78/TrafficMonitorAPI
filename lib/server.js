/*
* Primary file for app.
*
*/

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const path = require('path');
const util = require('util');
const debug = util.debuglog('server');

const config = require('./../config')
const fileio = require('./fileio');
const handlers = require('./handlers');
const helpers = require('./helpers');


// Server object to export
var server = {};


// Create a server
server._createServer = function(req, res)
{
	// Obtain parsed URL
	const parsedUrl = url.parse(req.url, true);

	// Obtain request method
	const method = req.method.toLowerCase();

	// Obtain request headers
	const headers = req.headers;

	// Obtain query parameters
	const query = parsedUrl.query;

	// Obtain path and parse it
	const path = parsedUrl.pathname;

	// Trim the path of trailing or leading slashes
	const trimmedPath = path.replace(/^\/\/?|\/\/?$/g, '');

	// Obtain payload
	const decoder = new StringDecoder('utf-8');
	var buffer = '';
	req.on('data', function(data){
		buffer += decoder.write(data);
	});

	// End of request 
	req.on('end', function(){

		// Append data from stream
		buffer += decoder.end();

		// Choose a handler
		const handler = typeof(server.router[trimmedPath])!=='undefined'?server.router[trimmedPath]: handlers.defaultHandler;

		// Data for handler function
		var data = {
			'method': method,
			'URL': parsedUrl,
			'headers': headers,
			'query': query,
			'path': trimmedPath,
			'payLoad': helpers.jsonToObj(buffer)
		};

		try{
			// Call the handler wrapper
			handler(data, function(statusCode, payLoad, contentType){
				server.coreHandler(res, method, trimmedPath, statusCode, payLoad,contentType);
			});
		}
		catch(err){
			debug(err);
			server.coreHandler(res, method, trimmedPath, 400, {"Error":"An unknown error occured"}, 'application/json');
		}
	});
};


// Core handler
server.coreHandler = function(res, method, trimmedPath, statusCode, payLoad, contentType){
	// Format data for response
	statusCode = typeof(statusCode)=='number'?statusCode: 200;
	payLoad = typeof(payLoad)=='object'?payLoad:{};
	payLoad = JSON.stringify(payLoad);
	contentType = typeof(contentType)=='string'?contentType: 'application/json';


	// Send response
	res.setHeader('content-type', contentType);
	res.writeHead(statusCode);
	res.end(payLoad);


	// If response is green, print green otherwise red
	if(statusCode == 200)
		debug("\x1b[32m%s\x1b[0m", method.toUpperCase() + '/' + trimmedPath + ' ' + statusCode);
	else
		debug("\x1b[31m%s\x1b[0m", method.toUpperCase() + '/' + trimmedPath + ' ' + statusCode);
};


// Create a http server object
server.httpServer = http.createServer(function(req, res){
	server._createServer(req, res);	
});


// SSL certificate configuration
server.sslConfig = {
	'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
	'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
}


// Create a https server object
server.httpsServer = https.createServer(server.sslConfig, function(req, res){
	server._createServer(req, res);
});


// Object to store all routes: handler pairs
server.router = {
	'ping': handlers.pingHandler,
	'users': handlers.users,
	'tokens': handlers.tokens,
	'checks': handlers.checks
};


// Init the server
server.init = function(){
	// Add a http listener to designated port
	server.httpServer.listen(config.httpPort, function(){
		console.log("\x1b[36m%s\x1b[0m", "Listening to port "+config.httpPort);
	});

	// Add a https listener to designated port
	server.httpsServer.listen(config.httpsPort, function(){
		console.log("\x1b[35m%s\x1b[0m", "Listening to port "+config.httpsPort);
});
};


// Export server object
module.exports = server;