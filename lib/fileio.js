/*
* Library to handle File I/O (CRUD)
*
*/


// Dependencies
const fs = require('fs');
const path = require('path');


// File I/0 object
fileio = {};



// Data directory
fileio.basedir = path.join(__dirname, '/../.data/');


// Create a file
fileio.create = function(dir, file, data, callback){
	fs.open(fileio.basedir+'/'+file+'.json', 'wx', function(err, fileDescriptor){
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
	fs.readFile(fileio.basedir+'/'+file+'.json', 'utf8', function(err, data){
		callback(err, data);
	});
};


// Update a file
fileio.update = function(dir, file, data, callback){
	fs.open(fileio.basedir+'/'+file+'.json', 'r+', function(err, fileDescriptor){
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
			callback("Couldn't open file, file mayn't exist");
		}

	});
}


// Delete a file
fileio.delete = function(dir, file, callback){
	fs.unlink(fileio.basedir+'/'+file+'.json', function(err){
		if(!err){
			callback(false);
		}
		else{
			callback("Couldn't delete file");
		}
	});
};

// Export the object
module.exports = fileio;