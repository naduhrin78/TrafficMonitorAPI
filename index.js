/*
*Entry point for app.
*
*/


// Dependencies
const config = require('./config')
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const fileio = require('./lib/fileio');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers');

// Create a server
function _createServer(req, res)
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
		const handler = typeof(router[trimmedPath])!=='undefined'?router[trimmedPath]: handlers.defaultHandler;

		// Data for handler function
		var data = {
			'method': method,
			'URL': parsedUrl,
			'headers': headers,
			'query': query,
			'path': trimmedPath,
			'payLoad': helpers.jsonToObj(buffer)
		};

		// Call the handler
		handler(data, function(statusCode, payLoad){
			
			// Format data for response
			statusCode = typeof(statusCode)=='number'?statusCode: 200;
			payLoad = typeof(payLoad)=='object'?payLoad:{};
			payLoad = JSON.stringify(payLoad);


			// Send response
			res.setHeader('content-type', 'application/json');
			res.writeHead(statusCode);
			res.end(payLoad);

			// Log the response	
			console.log('Request payload:\n', buffer);
		});

	});
}


// Create a http server object
const httpServer = http.createServer(function(req, res){
	_createServer(req, res);	
});


// Add a http listener to designated port
httpServer.listen(config.httpPort, function(){
	console.log("Listening to port "+config.httpPort);
});


// SSL certificate configuration
const sslConfig = {
	'key': fs.readFileSync('./https/key.pem'),
	'cert': fs.readFileSync('./https/cert.pem')
}


// Create a https server object
const httpsServer = https.createServer(sslConfig, function(req, res){
	_createServer(req, res);
});


// Add a http listener to designated port
httpsServer.listen(config.httpsPort, function(){
	console.log("Listening to port "+config.httpsPort);
});


// Object to store all routes: handler pairs
const router = {
	'ping': handlers.pingHandler,
	'users': handlers.users
};


