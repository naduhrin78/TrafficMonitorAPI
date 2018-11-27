/*
* Helper function library
*
*/


// Dependencies
const crypto = require('crypto');
const config = require('./../config');


// Helper object
var helpers = {};


// Hash function
helpers.hash = function(passWord){
	if(typeof(passWord) == 'string' && passWord.length > 0){
		return crypto.createHmac('SHA256', config.hashSecret).update(passWord).digest('hex');
	}
	else{
		return false;
	}
}


// Convert JSON to object
helpers.jsonToObj = function(json){
	try{
		const obj = JSON.parse(json);
		return obj;
	}
	catch(err){
		return {};
	}
};

module.exports = helpers; 