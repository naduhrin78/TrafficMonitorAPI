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
	    'accountSid' : '', // Enter testing account SId
	    'authToken' : '', // Enter testing authToken
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
		'accountSid': '', // Enter deployment account SId
		'authToken': '', // Enter deployment authToken
		'phone': '' // Enter phone number associated with twilio account
	}
};

env = typeof(process.env.NODE_ENV) == 'string'? process.env.NODE_ENV.toLowerCase(): '';
env_obj = typeof(config[env]) == 'object'? config[env]: config.staging;

module.exports = env_obj;
