/*
* Library for Command Line Interface(CLI)
*
*/


// Dependencies
const readline = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');
const os = require('os');
const v8 = require('v8');
const child_process = require('child_process');

const fileio = require('./fileio');
const logs = require('./logs');
const helpers = require('./helpers');


// Inheriting event class (Standard)
class _events extends events{};


// Event object
const event = new _events();


// Object for cli
var cli = {};


event.on('man', function(str){
	cli.responder.help();
});


event.on('help', function(str){
	cli.responder.help();
});


event.on('status', function(str){
	cli.responder.status();
});


event.on('exit', function(str){
	cli.responder.exit();
});


event.on('list users', function(str){
	cli.responder.listUsers();
});


event.on('more user info', function(str){
	cli.responder.moreUserInfo(str);
});


event.on('list checks', function(str){
	cli.responder.listChecks(str);
});


event.on('more check info', function(str){
	cli.responder.moreCheckInfo(str);
});


event.on('list logs', function(str){
	cli.responder.listLogs();
});


event.on('more log info', function(str){
	cli.responder.moreLogInfo(str);
});


event.on('clear', function(str){
	cli.responder.clear();
});


// Response handler
cli.responder = {};


// help/man
cli.responder.help = function(){
	const cmds = {
		'exit': 'Kill the CLI (and application)',
		'man': 'Show help manual',
		'help': 'Alias of man',
		'status': 'Statistics of CPU and resource utilization',
		'listUsers': 'Shows list of all undeleted users',
		'moreUserInfo --{ userId }': 'Shows descriptive info of a particular user',
		'listChecks --{ up/down }': 'Shows list of all checks (up or down checks)',
		'moreCheckInfo --{ checkId }': 'Shows descriptive info of a particular check',
		'listLogs': 'Shows list of all logs (zipped)',
		'moreLogInfo --{ logId }': 'Shows descriptive info of a particular log',
		'clear': 'clears the screen'
	};


	// Design of CLI
	cli.horizontalLine();
	cli.centered("\x1b[32m"+ 'CLI manual'+ "\x1b[0m");
	cli.horizontalLine();
	cli.verticalSpace(2);

	for(var key in cmds){
		if(cmds.hasOwnProperty(key)){
			const val = cmds[key];
			var line = "\x1b[34m"+key+"\x1b[0m";
			const padding = 40 - line.length;
			for(let i = 0; i < padding; i++)
				line += ' '

			line += val;
			console.log(line);
			cli.verticalSpace();
		}
		else
			debug("Key not found in commands");
	}

	cli.verticalSpace();
	cli.horizontalLine();
}


// Create a centered text
cli.centered = function(str){
	const padding = (process.stdout.columns - str.length)/2;
	lines = '';
	for(let i = 0; i < padding; i++)
				lines += ' ';

	lines += str;
	console.log(lines);

};


// Draws a horizontal line spawning the terminal
cli.horizontalLine = function(){
	const ttyWidth = process.stdout.columns;

	var line = '';

	for(let i = 0; i < ttyWidth; i++)
		line += '-';

	console.log(line);
};


// Create a vertical space
cli.verticalSpace = function(lines){
	lines = typeof(lines) == 'number' && lines > 0 ? lines: 1;
	for(let i = 0; i < lines; i++)
		console.log('');
};


// exit
cli.responder.exit = function(){
	process.exit(0);
}


// status
cli.responder.status = function(){
	const stats = {
		'Load average': os.loadavg().join(' '),
		'CPU count': os.cpus().length,
		'Free memory': os.freemem(),
		'Current malloced memory': v8.getHeapStatistics().malloced_memory,
		'Peak malloced memory': v8.getHeapStatistics().peak_malloced_memory,
		'Allocated heap used (%)': Math.round((v8.getHeapStatistics().used_heap_size*100)/(v8.getHeapStatistics().total_heap_size)),
		'Available heap allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size*100)/(v8.getHeapStatistics().heap_size_limit)),
		'Uptime': os.uptime() + ' seconds',
	};


	// Design of CLI
	cli.horizontalLine();
	cli.centered("\x1b[32m"+ 'System statistics'+ "\x1b[0m");
	cli.horizontalLine();
	cli.verticalSpace(2);

	for(var key in stats){
		if(stats.hasOwnProperty(key)){
			const val = stats[key];
			var line = "\x1b[34m"+key+"\x1b[0m";
			const padding = 40 - line.length;
			for(let i = 0; i < padding; i++)
				line += ' '

			line += val;
			console.log(line);
			cli.verticalSpace();
		}
		else
			debug("Key not found in status")
	}

	cli.verticalSpace();
	cli.horizontalLine();
}


// list users
cli.responder.listUsers = function(){
	fileio.list('users', function(err, userList){
		if(!err && userList && userList.length > 0){
			cli.verticalSpace();
			userList.forEach(function(userId){
				fileio.read('users', userId, function(err, userData){
					if(!err && userData){
						var line = 'Name: ' + userData.firstName + ' ' + userData.lastName + ' Phone: ' + userData.phone + ' Checks: ';
						const numOfChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array && userData.checks.length > 0?userData.checks.length: 0;
						line += numOfChecks;
						console.log(line);
						cli.verticalSpace();
					}
				});
			});
		}
		else
			debug("No users are present");
	});
}


// more user info
cli.responder.moreUserInfo = function(arg){
	// Get user id
	var userId = arg.split('--')[1];

	// Validate user id
	userId = typeof(userId) == 'string' && userId.length > 0 ? userId : false;

	if(userId){
		// Read user data
		fileio.read('users', userId, function(err, userData){
			if(!err && userData){
				delete userData.passWord

				console.dir(userData, {'colors' : true});
				cli.verticalSpace();
			}
			else{
				debug("User data doesnt exist for given key");
			}
		});
	}
	else
		debug("Invalid userId");
}


// list checks
cli.responder.listChecks = function(arg){
	fileio.list('checks', function(err, checkList){
		if(!err && checkList && checkList.length > 0){
			cli.verticalSpace();
			checkList.forEach(function(checkId){
				fileio.read('checks', checkId, function(err, checkData){
					if(!err && checkData){
						const state = typeof(checkData.status) == 'string'? checkData.status: 'unknown';
						if(arg.toLowerCase().indexOf('--'+state) > -1 || (arg.toLowerCase().indexOf('--down') == -1 && arg.toLowerCase().indexOf('--up') == -1))
						{
							const line = 'ID: ' + checkData.checkId + ' ' + checkData.method.toUpperCase() + ' ' + checkData.protocol + '://' + checkData.url + ' State: ' + state; 
							console.log(line);
							cli.verticalSpace();
						}
					}
					else
						debug("Couldn't fetch check data");
				});
			});
		}
		else
			debug("No checks exist");
	});
}


// more check info
cli.responder.moreCheckInfo = function(arg){
	// Get check id
	var checkId = arg.split('--')[1];

	// Validate check id
	checkId = typeof(checkId) == 'string' && checkId.length > 0 ? checkId : false;

	if(checkId){
		// Read check data
		fileio.read('checks', checkId, function(err, checkData){
			if(!err && checkData){
				console.dir(checkData, {'colors' : true});
				cli.verticalSpace();
			}
			else
				debug("Check doesnt exist with given Id");
		});
	}
	else
		debug("Invalid checkId");
}


// list logs
cli.responder.listLogs = function(){

	const ls = child_process.spawn('ls', ['./.logs/']);

	ls.stdout.on('data', function(dataObj){
		const str = dataObj.toString();
		const logList = str.split('\n');
		logList.forEach(function(log){
			if(log.indexOf('-') > -1)
			{
				console.log(log.split('.')[0]);
				cli.verticalSpace();
			}
		});
	});
}


// more log info
cli.responder.moreLogInfo = function(arg){
	// Get log id
	var logId = arg.split('--')[1];

	// Validate log id
	logId = typeof(logId) == 'string' && logId.length > 0 ? logId : false;

	if(logId){
		logs.extract(logId, function(err, logData){
			if(!err && logData)
			{
				const logArr = logData.split('\n');
				logArr.forEach(function(log){
					const logObj = helpers.jsonToObj(log);
					if(logObj && JSON.stringify(logObj) != '{}'){
						console.dir(logObj, {'colors': true});
						cli.verticalSpace();
					}
				});
			}
			else
				debug("Couldn't fetch log data");
		});
	}
	else 
		debug("Invalid checkId");
}


// clear
cli.responder.clear = function(){
	process.stdout.write('\033c');
};


// Process the given input and pass to appropriate handler
cli.processInput = function(input){
	input = typeof(input) == 'string' && input.trim().length > 0 ? input.trim() : false;

	if(input){
		const validip = [
			'man', 'help', 'exit', 'status', 'list users', 'more user info',
			'list checks', 'more check info', 'list logs', 'more log info', 'clear'
		];

		var match = false;

		// Check if input has valid input
		validip.some(function(checkip){
			if(input.toLowerCase().indexOf(checkip) > -1)
			{
				match = true;
				event.emit(checkip, input);
				return true;
			}
		});


		if(!match)
			console.log("Sorry, try again");
	}
	else
		debug("Invalid input");
};


// Initializing function for cli
cli.init = function(){
	console.log("\x1b[34m%s\x1b[0m", "CLI is running");
	
	// Create interface object
	const interface = readline.createInterface({
		input: process.stdin, 
		output: process.stdout,
		prompt: '>'
	});

	// Start prompt
	interface.prompt();

	// Handle each line seperately
	interface.on('line', function(str){
		// Send input for further processing
		cli.processInput(str);

		// Restart the prompt
		interface.prompt();
	});	

	// Kill process if cli is stopped
	interface.on('close', function(){
		process.exit(0);
	})
}


// Export cli object
module.exports = cli;

