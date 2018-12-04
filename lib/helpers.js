/*
* Helper function library
*
*/


// Dependencies
const crypto = require('crypto');
const config = require('./../config');
const querystring = require('querystring')
const https = require('https');


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


// Generate a "n" digit random string
helpers.randTokenGen = function(n){
	var str = "";
	const possibleChars = "abcdefghijkl0123456789";
	for(var i = 0; i < n; i++){
		var c = possibleChars[Math.floor(Math.random()*n)];
		str += c;
	}

	return str;
};


// Wrapper function to send SMS via twilio
helpers.sendSMS = function(phone, msg, callback){
	phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
	msg = typeof(msg) == 'string' && msg.length > 0 && msg.length <= 160? msg: false;
	
	if(msg&&phone){

		// Object for payload to send
		var payLoad = {
			'From': config.twilio.phone,
			'To': '+91'+phone,
			'Body': msg
		};

		// Convert payload to send as payload for https request
		const stringPayLoad = querystring.stringify(payLoad);

		// Request details for https request call
		const reqDetails = {
			'protocol': 'https:',
			'hostname': 'api.twilio.com',
			'method': 'POST',
			'path': '/2010-04-01/Accounts/' + config.twilio.accountSid+'/Messages.json',
			'auth': config.twilio.accountSid +':'+ config.twilio.authToken,
			'headers': {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(stringPayLoad)
			}
		};

		// Request object to handle requests
		const req = https.request(reqDetails, function(res){
			var status = res.statusCode;

			if(status == 200 || status == 201)
				callback(false);
			else
				callback("Status code returned:" + status);
		});

		req.on('error', function(e){
			callback(e);
		})

		req.write(stringPayLoad);

		req.end();
	}
	else{
		callback("Invalid msg or phone")
	}
};


module.exports = helpers; 