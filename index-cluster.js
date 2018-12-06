/*
* Entry point for app.
*
*/


// Dependencies
const cluster = require('cluster');
const os = require('os');

const server = require('./lib/server');
const workers = require('./lib/workers');
const cli = require('./lib/cli');


// Application object
var app = {};


// Init function for app
app.init = function(){

	if(cluster.isMaster){
		// Init workers
		workers.init();

		// Init CLI
		setTimeout(function(){
			cli.init();
		}, 50);

		// Fork the process
		for(let i = 0; i < os.cpus().length; i++)
			cluster.fork();
	}	
	else{
		// Init server
		server.init();
	}
};


// Initializing app
app.init();
