/*
* Configuration file for API
*
*/


// Configuration object
var config = {};

// Configuration for running API locally
config.staging = {
	'httpPort': 3000,
	'httpsPort': 3001,
	'type': 'staging',
	'hashSecret': 'whocares',
	'maxChecks': 5,
	'twilio' : {
	    'accountSid' : 'AC01dacff55a6b11ff472ffbc751d0ed51',
	    'authToken' : 'a4fec82740f4dc259125b73d8e636bbb',
	    'phone' : '+15005550006'
  	}
};

// Configuration for running API on production
config.production = {
	'httpPort': 5000,
	'httpsPort': 5001,
	'type': 'production',
	'hashSecret': 'noonedoes',
	'maxChecks': 5,
	'twilio': {
		'accountSid': 'AC52626f41bd37c199a1264069019f07ec',
		'authToken': '920ebd6a253c103057b5090b4325bd84',
		'phone': '+12245041698'
	}
};

env = typeof(process.env.NODE_ENV) == 'string'? process.env.NODE_ENV.toLowerCase(): '';
env_obj = typeof(config[env]) == 'object'? config[env]: config.staging;

module.exports = env_obj;