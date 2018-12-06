/*
* Request handler library
*
*/


// Dependencies
const _url = require('url');
const dns = require('dns');

const helpers = require('./helpers');
const fileio = require('./fileio');
const config = require('./../config');


// Stores all handlers
var handlers = {};


// Store all user method responses
handlers._users ={};


// Store all token method responses
handlers._tokens = {};


// Stores all check method responses
handlers._checks = {};


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
	const token = typeof(data.headers.token) == 'string' && data.headers.token.length == 20?data.headers.token.trim():false; 

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
	const token = typeof(data.headers.token) == 'string' && data.headers.token.length == 20?data.headers.token.trim():false; 

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
	const token = typeof(data.headers.token) == 'string' && data.headers.token.length == 20?data.headers.token.trim():false; 

	if(phone){
		handlers._tokens.verify(phone, token, function(valid){

			if(valid){
				fileio.read('users', phone, function(err, userData){
					if(!err){
						fileio.delete('users', phone, function(err){
							if(!err){
								var checks = typeof(userData.checks) == 'object' && userData.checks instanceof Array && userData.checks.length > 0?userData.checks:false; 
								var checksDeleted = 0;
								const checksToDelete = checks.length;
								
								var error = false;

								if(checksToDelete < 1)
									callback(200);
								else{
									checks.forEach(function(check){
										fileio.delete('checks', check, function(err){
											if(err)
												error = true;
											
											checksDeleted++;

											if(checksDeleted == checksToDelete){
												if(!error)
													callback(200);
												else
													callback(400, {"Error": "Error while deleting checks(Not all may be deleted)"});
											}
										});
									});
								}
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
					var expiry = Date.now()+ 60*60*1000;

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
					fileio.delete('tokens', token, function(err){
						callback(400, {"Error": "Token already expired"});
					});
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
			else{
				fileio.delete('tokens', id, function(err){
					callback(false);
				});
			}
		}
		else{
			callback(false);
		}
	});
};


// Checks handler
handlers.checks = function(data, callback){
	const acceptableMethods = ['get', 'post', 'put', 'delete'];
	
	if(acceptableMethods.indexOf(data.method) > -1){
		handlers._checks[data.method](data, callback);
	}
	else{
		callback(405, {"Error":"Method doesn't exist"});
	}
};


// Checks-Post handler
// Required: protocol, method, url, successCodes, timeoutSeconds
// Optional: None
handlers._checks.post = function(data, callback){
	// Required
	const protocol = typeof(data.payLoad.protocol) == 'string' && ['http', 'https'].indexOf(data.payLoad.protocol) > -1 ?data.payLoad.protocol.trim():false; 
	const method = typeof(data.payLoad.protocol) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payLoad.method) > -1 ?data.payLoad.method.trim():false; 
	const url = typeof(data.payLoad.url) == 'string' && data.payLoad.url.length > 0?data.payLoad.url.trim():false; 
	const successCodes = typeof(data.payLoad.successCodes) == 'object' && data.payLoad.successCodes instanceof Array && data.payLoad.successCodes.length > 0?data.payLoad.successCodes:false; 
	const timeoutSeconds = typeof(data.payLoad.timeoutSeconds) == 'number' && data.payLoad.timeoutSeconds >= 1 && data.payLoad.timeoutSeconds <= 5?data.payLoad.timeoutSeconds:false; 

	const token = typeof(data.headers.token) == 'string' && data.headers.token.length == '20'?data.headers.token.trim():false; 

	if(protocol && method && url && successCodes && timeoutSeconds){
		fileio.read('tokens', token, function(err, tokenData){
	
			if(!err && tokenData){

				// Fetch phone number to update that users checks
				const phone = typeof(tokenData.phone) == 'string' && tokenData.phone.length == '10'?tokenData.phone.trim():false; 

				if(phone){
			
					fileio.read('users', phone, function(err, userData){
						if(!err && userData){
							const checks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ?userData.checks:[]; 

							// Verify maximum number of tokens isnt reached
							if(checks.length < config.maxChecks){

								// Verify if url has DNS entry
								const parsedUrl = _url.parse(protocol+"://"+url, true);
								const hostname = parsedUrl.hostname;
								dns.resolve(hostname, function(err, records){
									if(!err && records)
									{
										// Create check id
										const checkId = helpers.randTokenGen(20);

										// Check data object
										const checkData = {
											'phone': phone,
											'checkId': checkId,
											'protocol': protocol,
											'method': method, 
											'url': url,
											'successCodes': successCodes,
											'timeoutSeconds': timeoutSeconds

										};

										fileio.create('checks', checkId, checkData, function(err){
											
											// Add check to user object
											checks.push(checkId);
											userData.checks = checks;

											fileio.update('users', phone, userData, function(err){
												if(!err){
													callback(200);
												}
												else{
													callback(500, {"Error": "Couldn't update user"});
												}
											});								
										});
									}
									else
										callback(400, {"Error": "Hostname of url didnt resolve to any DNS entry"});
								});
							}	
							else{
								callback(400, {"Error": "Reached maximum number of checks: "+config.maxChecks});
							}
						}
						else{
							callback(404);
						}	
					});
				}
				else{
					callback(400, {'Error': "User doesn't exist"});
				}
			}
			else{
				callback(403);
			}
		});
	}
	else{
		callback(400, {'Error': 'Missing required fields'});
	}
};


// Checks-Get handler
// Required: check
// Optional: None
handlers._checks.get = function(data, callback){
	// Required
	const check = typeof(data.query.check) == 'string' && data.query.check.length == 20?data.query.check.trim():false; 
	
	if(check){

		fileio.read('checks', check, function(err, checkData){

			if(!err && checkData){
				const token = typeof(data.headers.token) == 'string' && data.headers.token.length == 20?data.headers.token.trim():false; 

				handlers._tokens.verify(checkData.phone, token, function(valid){
					if(valid){
						callback(200, checkData);
					}
					else{
						callback(403, {"Error": "Unauthorized access"});
					}
				});
			}
			else{
				callback(400, {"Error": "Check doesn't exist"});
			}
		});		
	}
	else{
		callback(400, {'Error': 'Missing required fields'});
	}
};


// Checks-Put handler
// Required: check, one of optional
// Optional: protocol, method, url, successCodes, timeoutSeconds
handlers._checks.put = function(data, callback){
	// Required
	const check = typeof(data.query.check) == 'string' && data.query.check.length == 20?data.query.check.trim():false; 
	
	// Optional
	const protocol = typeof(data.payLoad.protocol) == 'string' && ['http', 'https'].indexOf(data.payLoad.protocol) > -1 ?data.payLoad.protocol.trim():false; 
	const method = typeof(data.payLoad.protocol) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payLoad.method) > -1 ?data.payLoad.method.trim():false; 
	const url = typeof(data.payLoad.url) == 'string' && data.payLoad.url.length > 0?data.payLoad.url.trim():false; 
	const successCodes = typeof(data.payLoad.successCodes) == 'object' && data.payLoad.successCodes instanceof Array && data.payLoad.successCodes.length > 0?data.payLoad.successCodes:false; 
	const timeoutSeconds = typeof(data.payLoad.timeoutSeconds) == 'number' && data.payLoad.timeoutSeconds >= 1 && data.payLoad.timeoutSeconds <= 5?data.payLoad.timeoutSeconds:false; 

	const token = typeof(data.headers.token) == 'string' && data.headers.token.length == '20'?data.headers.token.trim():false; 

	if(check){
		if(protocol || method || url || successCodes || timeoutSeconds){
			fileio.read('checks', check, function(err, checkData){
				if(!err&&checkData){
					handlers._tokens.verify(checkData.phone, token, function(valid){
						if(valid){
							if(protocol)
								checkData.protocol = protocol;
							if(method)
								checkData.method = method;
							if(url)
								checkData.url = url;
							if(successCodes)
								checkData.successCodes = successCodes;
							if(timeoutSeconds)
								checkData.timeoutSeconds = timeoutSeconds;

							fileio.update('checks', check, checkData, function(err){
								if(!err){
									callback(200);
								}
								else{
									callback(400, {"Error": "Could'nt update check fields"});
								}
							});
						}
						else{
							callback(403, {"Error": "Unauthorized access"});
						}
					});
				}
				else{
					callback(400, {"Error": "Check data not found"});
				}		
			});
		}
		else{
			callback(400, {'Error': 'Missing required fields for update'});
		}
	}
	else{
		callback(400, {"Error": "Missing required field(check header)"});
	}
};


// Checks-Delete handler
// Required: check
// Optional: None
handlers._checks.delete = function(data, callback){
	// Required
	const check = typeof(data.query.check) == 'string' && data.query.check.length == 20?data.query.check.trim():false; 

	const token = typeof(data.headers.token) == 'string' && data.headers.token.length == '20'?data.headers.token.trim():false; 
	
	if(check){
		fileio.read('checks', check, function(err, checkData){

			if(!err && checkData){

				handlers._tokens.verify(checkData.phone, token, function(valid){
					if(valid){
							fileio.delete('checks', check, function(err){
								if(!err){
									fileio.read('users', checkData.phone, function(err, userData){
										if(!err&&userData){
											var checks = typeof(userData.checks) == 'object' && userData.checks instanceof Array && userData.checks.length > 0?userData.checks:false; 
											var index = checks.indexOf(check);
											if(index > -1){
												checks.splice(index, 1);

												fileio.update('users', checkData.phone, userData, function(err){
													if(!err){
														callback(200);
													}
													else{
														callback(500, {"Error": "Couldn't update user"});
													}
												});
											}
											else{
												callback(400, {"Error":"Couldn't find check to delete"});
											}
										}
										else{
											callback(400, {"Error": "User doesn't exist"});
										}
									});
								}
								else{
									callback(400, {"Error": "Could'nt delete check"});
								}
							});
					}
					else{
						callback(403, {"Error": "Unauthorized access"});
					}
				});
			}
			else{
				callback(400, {"Error": "Check doesn't exist"});
			}
		});		
	}
	else{
		callback(400, {"Error": "Missing required field"});
	}
};


module.exports = handlers;