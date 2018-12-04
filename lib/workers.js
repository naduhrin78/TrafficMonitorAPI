/*
* Background workers for app.
*
*/


// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const fileio = require('./fileio');
const helpers = require('./helpers');
const logs = require('./logs');
const util = require('util');
const debug = util.debuglog('workers');

// Workers object
var workers = {};


// Read all checks and validate them
workers.getAllChecks = function(){
	fileio.list('checks', function(err, checkList){
		if(!err&&checkList&&checkList.length>0){
			checkList.forEach(function(check){
				fileio.read('checks', check, function(err, checkData){
					if(!err&&checkData){
						workers.validateCheck(checkData);
					}
					else{
						debug("Couldn't read check");
					}
				});
			});
		}	
		else{
			debug("Couldn't fetch checks");
		}
	})
};	


// Validate a given check
workers.validateCheck = function(checkData){
	checkData = typeof(checkData) == 'object' && checkData !== null ? checkData: {};

	checkData.checkId = typeof(checkData.checkId) == 'string' && checkData.checkId.length == 20?checkData.checkId.trim():false; 
	checkData.phone = typeof(checkData.phone) == 'string' && checkData.phone.length == 10?checkData.phone.trim():false; 
	checkData.protocol = typeof(checkData.protocol) == 'string' && ['http', 'https'].indexOf(checkData.protocol) > -1 ?checkData.protocol.trim():false; 
	checkData.method = typeof(checkData.protocol) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(checkData.method) > -1 ?checkData.method.trim():false; 
	checkData.url = typeof(checkData.url) == 'string' && checkData.url.length > 0?checkData.url.trim():false; 
	checkData.successCodes = typeof(checkData.successCodes) == 'object' && checkData.successCodes instanceof Array && checkData.successCodes.length > 0?checkData.successCodes:false; 
	checkData.timeoutSeconds = typeof(checkData.timeoutSeconds) == 'number' && checkData.timeoutSeconds >= 1 && checkData.timeoutSeconds <= 5?checkData.timeoutSeconds:false; 

	checkData.status = typeof(checkData.status) == 'string' && ['up', 'down'].indexOf(checkData.status) > -1 ?checkData.status.trim():'down'; 
	checkData.lastChecked = typeof(checkData.timeoutSeconds) == 'number' && checkData.timeoutSeconds > 0?checkData.timeoutSeconds:false; 

	if(!
		Object.keys(checkData).some(function(k) {
    		return checkData[k] === false;
		})
	){
		workers.performCheck(checkData);
	}
	else{
		debug("Invalid check data: ", checkData);
	}
};


// Update check
workers.performCheck = function(checkData){
	var checkOutcome = {
		'error': false,
		'responseCode': false,
	};

	// Flag to check if outcome is sent
	var outComeSent = false;

	// Parse url embedded in checkData
	const parsedUrl = url.parse(checkData.protocol + '://' + checkData.url, true)

	// Obtaining hostname and path along with query string
	const hostname = parsedUrl.hostname;
	const path = parsedUrl.path;

	// Request object
	const reqDetails = {
		'protocol': checkData.protocol+":",
		'hostname': hostname,
		'method': checkData.method.toUpperCase(),
		'path': path,
		'timeout': checkData.timeoutSeconds*1000
	};

	// Choose http(s) handler
	const moduleToUse = checkData.protocol == 'http'? http: https;

	const req = moduleToUse.request(reqDetails, function(res){
		const status = res.statusCode;

		// Update checkOutcome
		checkOutcome.responseCode = status;

		if(!outComeSent){
			workers.processCheck(checkOutcome, checkData);
			outComeSent = true;
		}
	});

	// Error listener for our request
	req.on('error', function(e){
		checkOutcome.error = {
			'error': true,
			'value': e
		};

		if(!outComeSent){
			workers.processCheck(checkOutcome, checkData);
			outComeSent = true;
		}
	});

	// Timeout listener for our request
	req.on('timeout', function(e){
		checkOutcome.error = {
			'error': true,
			'value': 'timeout'
		};

		if(!outComeSent){
			workers.processCheck(checkOutcome, checkData);
			outComeSent = true;
		}
	});

	// End the request
	req.end();
};


// Process a given check
workers.processCheck = function(checkOutcome, checkData){
	// Check if server is up
	const state = !checkOutcome.error && checkData.successCodes.indexOf(checkOutcome.responseCode) > -1? 'up': 'down';

	// Check if alert is needed, incase up->down or down->up
	const alertNeeded = checkData.lastChecked && checkData.status != state ? true:false;

	const timeOfCheck = Date.now();

	// Log the outcome
	workers.log(checkData, checkOutcome, state, alertNeeded, timeOfCheck);

	// Update check data
	var newCheckData = checkData;
	newCheckData.status = state;
	newCheckData.lastChecked = timeOfCheck;

	fileio.update('checks', newCheckData.checkId, newCheckData, function(err){
		if(!err){
			if(alertNeeded){
				workers.alertUser(newCheckData);
			}
			else{
				debug("Alert not needed");
			}
		}
		else{
			debug("Could'nt update one of checks");
		}
	});
};

// Alerts the user via sms
workers.alertUser = function(newCheckData){
	const msg = 'Your check ' + newCheckData.method + ' ' + newCheckData.protocol + '://' + newCheckData.url + ' is ' + newCheckData.status;
	helpers.sendSMS(newCheckData.phone, msg, function(err){
		if(!err){
			debug("Successfully alerted user");
		}
		else{
			debug("Failed to alert user");
		}
	});
};


// Execute getAllChecks once every minute
workers.periodicCheck = function(){
	setInterval(function(){
		workers.getAllChecks()
	}, 1000*60);
};

// Rotate the logs i.e save existing logs and zip them away and start fresh
workers.rotateLogs = function(){
	logs.list(false, function(err, logsList){
		if(!err && logsList && logsList.length>0){
			logsList.forEach(function(log){
				const logid = log.replace(".log", "");
				const newid = logid + '-' + Date.now();

				// Compress old logs into a zip
				logs.compress(logid, newid, function(err){
					if(!err){
						// Clear log files to read new logs
						logs.truncate(logid, function(err){
							if(!err){
								debug("Successfully zipped old logs");
							}
							else{
								debug("Failed to truncate old logs");
							}
						});
					}
					else{
						debug("Error compressing one of file");
					}
				});
			});
		}
		else{
			debug("Couldn't find logs to rotate")
		}
	});	
};


// Execute log rotation once every day
workers.periodicRotateLogs = function(){
	setInterval(function(){
		workers.rotateLogs()
	}, 1000*60*60*24);
};


// Init function for workers
workers.init = function(){
	debug("\x1b[33m%s\x1b[0m", "Background workers have started");

	// Rotate logs during boot
	workers.rotateLogs();

	// Execute all checks during boot
	workers.getAllChecks();

	// Periodically execute checks
	workers.periodicCheck();

	// Rotate logs once per day
	workers.periodicRotateLogs();
};


// Log data into files
workers.log = function(checkData, checkOutcome, state, alertNeeded, timeOfCheck){
	
	// Log object
	const logData = {
		'checkData': checkData,
		'outcome': checkOutcome,
		'state': state, 
		'alertNeeded': alertNeeded,
		'time': timeOfCheck
	};

	// String log
	const stringLog = JSON.stringify(logData);

	// Name of file to which we will log
	const logFile = checkData.checkId;

	logs.append(logFile, stringLog, function(err){
		if(!err)
			debug("Successfully logged");
		else
			debug("Failed to log", err);
	});


};


// Export workers object
module.exports = workers;