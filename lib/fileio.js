/*
* Library to handle File I/O (CRUD)
*
*/


// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');


// File I/0 object
var fileio = {};


// Data directory
fileio.basedir = path.join(__dirname, '/../.data/');


// Create a file
fileio.create = function(dir, file, data, callback){
	fs.open(fileio.basedir + dir +'/'+file+'.json', 'wx', function(err, fileDescriptor){
		if(!err && fileDescriptor)
		{
			const stringData = JSON.stringify(data);
			fs.writeFile(fileDescriptor, stringData, function(err){
				if(!err){
					fs.close(fileDescriptor, function(err){
						if(!err){
							callback(false);
						}
						else{
							callback("Couldn't close file")
						}
					});
				}
				else{
					callback("Can't write to file");
				}
			});
		}
		else
		{
			callback("File may already exist");
		}
	});
};


// Read a file
fileio.read = function(dir, file, callback){
	fs.readFile(fileio.basedir+ dir +'/'+file+'.json', 'utf8', function(err, data){
		if(!err && data){
			callback(false, helpers.jsonToObj(data));
		}
		else{
			callback(err, data);
		}

	});
};


// Update a file
fileio.update = function(dir, file, data, callback){
	fs.open(fileio.basedir + dir +'/'+file+'.json', 'r+', function(err, fileDescriptor){
		if(!err && fileDescriptor)
		{
			const stringData = JSON.stringify(data);

			fs.ftruncate(fileDescriptor, function(err){
				if(!err){
					fs.writeFile(fileDescriptor, stringData, function(err){
						if(!err){
							fs.close(fileDescriptor, function(err){
								if(!err){
									callback(false);
								}
								else{
									callback("Couldn't close file")
								}
							});
						}
						else{
							callback("Can't write to file");
						}
					});
				}
				else{
					callback("Error truncating file");
				}
			});
		}
		else{
			callback("Couldn't open the file, file mayn't exist");
		}

	});
}


// Delete a file
fileio.delete = function(dir, file, callback){
	fs.unlink(fileio.basedir + dir +'/'+file+'.json', function(err){
		if(!err){
			callback(false);
		}
		else{
			callback("Couldn't delete file");
		}
	});
};


// List a directory
fileio.list = function(dir, callback){
	var trimmedFiles = [];
	fs.readdir(fileio.basedir + dir +'/', function(err, files){
		if(!err&&files&&files.length>0){
			files.forEach(function(file){
				trimmedFiles.push(file.replace(".json", ""));
			});
			callback(false, trimmedFiles);
		}
		else{
			callback(err, files);
		}
	});
};

// Export the object
module.exports = fileio;