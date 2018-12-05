/*
* Entry point for app.
*
*/


// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');


// Application object
var app = {};


// Init function for app
app.init = function(){
	// Init server
	server.init();

	// Init workers
	workers.init();

	// Init CLI
	setTimeout(function(){
		cli.init();
	}, 50);
};


// Initializing app
app.init();
