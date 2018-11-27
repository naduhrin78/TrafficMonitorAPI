/*
* Request handler library
*
*/


// Dependencies
const helpers = require('./helpers');
const fileio = require('./fileio');


// Stores all handlers
var handlers = {};


// Store all user method responses
handlers._users ={};


// Ping handler 
handlers.pingHandler = function(data, callback){
	callback(200);
}


// Handler for non existent route
handlers.defaultHandler = function(data, callback){
	callback(404);
}


// User handler
handlers.users = function(data, callback){
	const acceptableMethods = ['get', 'post', 'put', 'delete'];
	
	if(acceptableMethods.indexOf(data.method) > -1){
		handlers._users[data.method](data, callback);
	}
	else{
		callback(405, {"Error":"Method doesn't exist"});
	}
};


// Post handler
// Required: firstName, lastName, passWord, phone, tosA
// Optional: None
// @TODO Allow only authorized users
handlers._users.post = function(data, callback){
	// Required
	const firstName = typeof(data.payLoad.firstName) == 'string' && data.payLoad.firstName.length > 0?data.payLoad.firstName.trim():false; 
	const lastName = typeof(data.payLoad.lastName) == 'string' && data.payLoad.lastName.length > 0?data.payLoad.lastName.trim():false; 
	var passWord = typeof(data.payLoad.passWord) == 'string' && data.payLoad.passWord.length > 0?data.payLoad.passWord.trim():false; 
	const phone = typeof(data.payLoad.phone) == 'string' && data.payLoad.phone.length == 10?data.payLoad.phone.trim():false; 
	const tosA = typeof(data.payLoad.tosA) == 'boolean' && data.payLoad.tosA.length == true?data.payLoad.tosA.trim():false; 

	if(firstName || lastName || passWord || phone || tosA){
		fileio.read('users', phone, function(err, data){
			if(err){
				// Hash password
				passWord = helpers.hash(passWord);

				const userData = {
					'firstName': firstName,
					'lastName': lastName, 
					'passWord': passWord,
					'phone': phone
				};

				fileio.create('users', phone, userData, function(err){
					if(!err){
						callback(200);
					}
					else{
						callback(500, {'Error': 'Internal server error'});
					}
				});
			}
			else{
				callback(400, {'Error': 'User already exists'});
			}
		});
	}
	else{
		callback(400, {'Error': 'Missing required fields'});
	}
};


// Get handler
// Required: phone
// Optional: None
// @TODO Allow only authorized users
handlers._users.get = function(data, callback){
	// Required
	const phone = typeof(data.query.phone) == 'string' && data.query.phone.length == 10?data.query.phone.trim():false; 
	
	if(phone){
		fileio.read('users', phone, function(err, data){
			if(!err && data){
				delete data.passWord;
				callback(200, data);
			}
			else{
				callback(404);
			}
		});
	}
	else{
		callback(400, {'Error': 'Missing required fields'});
	}
};


// Put handler
// Required: phone, one of optional field
// Optional: firstName, lastName, passWord
// @TODO Allow only authorized users
handlers._users.put = function(data, callback){
	// Required
	const phone = typeof(data.payLoad.phone) == 'string' && data.payLoad.phone.length == 10?data.payLoad.phone.trim():false; 

	// Optional
	const firstName = typeof(data.payLoad.firstName) == 'string' && data.payLoad.firstName.length > 0?data.payLoad.firstName.trim():false; 
	const lastName = typeof(data.payLoad.lastName) == 'string' && data.payLoad.lastName.length > 0?data.payLoad.lastName.trim():false; 
	const passWord = typeof(data.payLoad.passWord) == 'string' && data.payLoad.passWord.length > 0?data.payLoad.passWord.trim():false; 

	if(phone){
		var userData = {
			'phone': phone
		};

		if(firstName || lastName || passWord){

			if(firstName){
				userData.firstName = firstName;
			}	

			if(lastName){
				userData.lastName = lastName;
			}	

			if(passWord){
				userData.passWord = helpers.hash(passWord);
			}

			fileio.read('users', phone, function(err, data){
				if(!err){
					fileio.update('users', phone, userData, function(err){
						if(!err){
							callback(200);
						}
						else{
							callback(500, {"Error": "Couldn't update user"});
						}
					});
				}
				else{
					callback(404);
				}
			});
		}
		else{
			callback(400, {"Error": "Missing atleast one optional field"});
		}
	}
	else{
		callback(400, {"Error": "Missing required field"});
	}
};


// Delete handler
// Required: phone
// Optional: None
// @TODO Allow only authorized users
handlers._users.delete = function(data, callback){
	// Required
	const phone = typeof(data.payLoad.phone) == 'string' && data.payLoad.phone.length == 10?data.payLoad.phone.trim():false; 

	if(phone){
		fileio.read('users', phone, function(err, data){
				if(!err){
					fileio.delete('users', phone, function(err){
						if(!err){
							callback(200);
						}
						else{
							callback(500, {"Error": "Couldn't delete user"});
						}
					});
				}
				else{
					callback(404);
				}
			});
	}
	else{
		callback(400, {"Error": "Missing required field"});
	}
};


module.exports = handlers;