/*
* Library for logging into files
*
*/


// Dependencies 
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');


// Logs object
var logs = {};


// Base dir for logs
logs.basedir = path.join(__dirname, '/../.logs/');


// Adds new logs to a log file
logs.append = function(fileName, logData, callback){
	fs.open(logs.basedir+fileName+'.log', 'a', function(err, fileDescriptor){
		if(!err&&fileDescriptor){
			fs.appendFile(fileDescriptor, logData+'\n', function(err){
				if(!err){
					fs.close(fileDescriptor, function(err){
						if(!err){
							callback(false);
						}
						else{
							callback("Failed to close file");
						}
					});
				}
				else{
					callback("Failed to add log to file");
				}
			});
		}
		else{
			callback("Couldn't find the log file" + err);
		}
	});
};


// List all logs in .log folder
logs.list = function(includeZips, callback){
	fs.readdir(logs.basedir, function(err, logs){

		// Store all logs without .log suffix
		var trimmedLogs = [];

		if(!err && logs && logs.length>0){
			
			// Loop through each file
			logs.forEach(function(log){
				// If it is a log
				if(log.indexOf('.log') > -1)
					trimmedLogs.push(log.replace(".log", ""));

				// If it is zip, and zip listing is allowed
				if(log.indexOf('.gz.b64') > -1 && includeZips)
					trimmedLogs.push(log.replace(".gz.b64", ""));
			});

			callback(false, trimmedLogs);
		}
		else{
			callback("Failed to read log directory", logs);
		}
	});
};


// Compress the logs
logs.compress = function(logid, saveid, callback){

	const src = logid+'.log';
	const dest = saveid + '.gz.b64';

	// Read source file
	fs.readFile(logs.basedir+src, 'utf8', function(err, logData){
		if(!err && logData){
			zlib.gzip(logData, function(err, zipData){
				if(!err && zipData){
					fs.open(logs.basedir+dest, 'wx', function(err, fileDescriptor){
						if(!err && fileDescriptor){
							fs.writeFile(fileDescriptor, zipData.toString('base64'), function(err){
								if(!err){
									fs.close(fileDescriptor, function(err){
										if(!err){
											callback(false);
										}
										else{
											callback("Error closing file");
										}
									});
								}
								else{
									callback("Error compressing log into zip file");
								}
							});
						}
						else{
							callback("Error creating zip file (or) already exists");
						}
					});
				}
				else{
					callback("Error compressing data to base 64");
				}
			});	
		}
		else{
			callback("Couldn't read log file");
		}
	});
};


// Extract a zip file
logs.extract = function(zipId, callback){
	const src = zipId + '.gz.b64';

	fs.readFile(logs.basedir + src, 'utf8', function(err, zipData){
		if(!err && zipData){
			// Transfer base64 data into ip
			const ip = Buffer.from(zipData, 'base64');

			// Unzip ip to get back original data
			zlib.unzip(ip, function(err, ogData){
				if(!err && ogData){
					callback(false, op.toString());
				}
				else{
					callback(err);
				}
			});
		}
		else{
			callback("Error reading zip file");
		}
	});
};


// Truncate logs
logs.truncate = function(logId, callback){
	fs.truncate(logs.basedir + logId + '.log', 0, function(err){
		if(!err)
			callback(false);
		else
			callback(err);
	});
};

// Exports logs
module.exports = logs;