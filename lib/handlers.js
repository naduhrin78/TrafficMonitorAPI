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


// Store all token method responses
handlers._tokens = {};


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


// User-Post handler
// Required: firstName, lastName, passWord, phone, tosA
// Optional: None
handlers._users.post = function(data, callback){
	// Required
	const firstName = typeof(data.payLoad.firstName) == 'string' && data.payLoad.firstName.length > 0?data.payLoad.firstName.trim():false; 
	const lastName = typeof(data.payLoad.lastName) == 'string' && data.payLoad.lastName.length > 0?data.payLoad.lastName.trim():false; 
	var passWord = typeof(data.payLoad.passWord) == 'string' && data.payLoad.passWord.length > 0?data.payLoad.passWord.trim():false; 
	const phone = typeof(data.payLoad.phone) == 'string' && data.payLoad.phone.length == 10?data.payLoad.phone.trim():false; 
	const tosA = typeof(data.payLoad.tosA) == 'boolean' && data.payLoad.tosA == true?data.payLoad.tosA:false; 

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


// User-Get handler
// Required: phone
// Optional: None
handlers._users.get = function(data, callback){
	// Required
	const phone = typeof(data.query.phone) == 'string' && data.query.phone.length == 10?data.query.phone.trim():false; 
	const token = typeof(data.headers.id) == 'string' && data.headers.id.length == 20?data.headers.id.trim():false; 

	if(phone){
		handlers._tokens.verify(phone, token, function(valid){
			if(valid){
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
				callback(403, {"Error": "Unauthorized access"});
			}
		});
	}
	else{
		callback(400, {'Error': 'Missing required fields'});
	}
};


// User-Put handler
// Required: phone, one of optional field
// Optional: firstName, lastName, passWord
handlers._users.put = function(data, callback){
	// Required
	const phone = typeof(data.payLoad.phone) == 'string' && data.payLoad.phone.length == 10?data.payLoad.phone.trim():false; 
	const token = typeof(data.headers.id) == 'string' && data.headers.id.length == 20?data.headers.id.trim():false; 

	// Optional
	const firstName = typeof(data.payLoad.firstName) == 'string' && data.payLoad.firstName.length > 0?data.payLoad.firstName.trim():false; 
	const lastName = typeof(data.payLoad.lastName) == 'string' && data.payLoad.lastName.length > 0?data.payLoad.lastName.trim():false; 
	const passWord = typeof(data.payLoad.passWord) == 'string' && data.payLoad.passWord.length > 0?data.payLoad.passWord.trim():false; 

	if(phone){
		var userData = {
			'phone': phone
		};

		handlers._tokens.verify(phone, token, function(valid){
			if(valid){
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
				callback(403, {"Error": "Unauthorized access"});
			}
		});
	}
	else{
		callback(400, {"Error": "Missing required field"});
	}
};


// User-Delete handler
// Required: phone
// Optional: None
handlers._users.delete = function(data, callback){
	// Required
	const phone = typeof(data.payLoad.phone) == 'string' && data.payLoad.phone.length == 10?data.payLoad.phone.trim():false; 
	const token = typeof(data.headers.id) == 'string' && data.headers.id.length == 20?data.headers.id.trim():false; 

	if(phone){
		handlers._tokens.verify(phone, token, function(valid){

			if(valid){
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
				callback(403, {"Error": "Unauthorized access"});
			}
		});
	}
	else{
		callback(400, {"Error": "Missing required field"});
	}
};


// User handler
handlers.tokens = function(data, callback){
	const acceptableMethods = ['get', 'post', 'put', 'delete'];
	
	if(acceptableMethods.indexOf(data.method) > -1){
		handlers._tokens[data.method](data, callback);
	}
	else{
		callback(405, {"Error":"Method doesn't exist"});
	}
};


// Token-Post handler
// Required: phone, passWord
// Optional: None
handlers._tokens.post = function(data, callback){
	// Required
	var passWord = typeof(data.payLoad.passWord) == 'string' && data.payLoad.passWord.length > 0?data.payLoad.passWord.trim():false; 
	const phone = typeof(data.payLoad.phone) == 'string' && data.payLoad.phone.length == 10?data.payLoad.phone.trim():false; 

	if(passWord && phone){
		fileio.read('users', phone, function(err, data){
			if(!err){
				// Hash password
				passWord = helpers.hash(passWord);

				if(data.passWord == passWord){

					const token = helpers.randTokenGen(20);
					var expiry = Date.now()+ 60*60*100;

					const tokenData = {
						'token': token,
						'phone': phone,
						'passWord': passWord,
						'expiry': expiry
					};

					fileio.create('tokens', token, tokenData, function(err){
						if(!err){
							callback(200);
						}
						else{
							callback(500, {'Error': 'Internal server error'});
						}
					});
				}
				else{
					callback(400, {"Error": "Invalid password"});
				}
			}
			else{
				callback(400, {'Error': "Couldn't find user"});
			}
		});
	}
	else{
		callback(400, {'Error': 'Missing required fields'});
	}
};


// Token-Get handler
// Required: token
// Optional: None
handlers._tokens.get = function(data, callback){
	// Required
	const token = typeof(data.query.id) == 'string' && data.query.id.length == 20?data.query.id.trim():false; 
	
	if(token){
		fileio.read('tokens', token, function(err, data){
			if(!err && data){
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


// Token-Put handler
// Required: phone, extend
// Optional: none
handlers._tokens.put = function(data, callback){
	// Required
	const token = typeof(data.payLoad.id) == 'string' && data.payLoad.id.length == 20?data.payLoad.id.trim():false; 
	const extend = typeof(data.payLoad.extend) == 'boolean' && data.payLoad.extend == true?data.payLoad.extend:false; 
	if(token&&extend){

		fileio.read('tokens', token, function(err, data){
			if(!err&&data){

				if(data.expiry > Date.now()){
					data.expiry = Date.now() + 60*60*1000;

					fileio.update('tokens', token, data, function(err){
						if(!err){
							callback(200);
						}
						else{
							callback(500, {"Error": "Couldn't update token"});
						}
					});
				}
				else{
					callback(400, {"Error": "Token already expired"});
				}
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


// Token-Delete handler
// Required: token
// Optional: None
handlers._tokens.delete = function(data, callback){
	// Required
	const token = typeof(data.payLoad.id) == 'string' && data.payLoad.id.length == 20?data.payLoad.id.trim():false; 
	console.log(token);
	if(token){
		fileio.read('tokens', token, function(err, data){
				if(!err){
					fileio.delete('tokens', token, function(err){
						if(!err){
							callback(200);
						}
						else{
							callback(500, {"Error": "Couldn't delete token"});
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


// Verify phone with token
handlers._tokens.verify = function(phone, id, callback){
	fileio.read('tokens', id, function(err, data){
		if(!err&&data){
			if(phone == data.phone && data.expiry > Date.now())
				callback(true);
			else
				callback(false);
		}
		else{
			callback(false);
		}
	});
};


module.exports = handlers;