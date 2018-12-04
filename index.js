/*
* Entry point for app.
*
*/


// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');


// Application object
var app = {};


// Init function for app
app.init = function(){
	// Init server
	server.init();

	// Init workers
	workers.init();
};


// Initializing app
app.init();
