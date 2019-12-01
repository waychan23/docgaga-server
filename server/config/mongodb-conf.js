"use strict";

const mongoConfig = require('./runtime-conf').mongoConfig;

module.exports = {
	'url': mongoConfig.url,
	'connectOptions': {
		'autoReconnect': true,
		'reconnectTries': 3,
		'poolSize': 10
	},
	'utils': '/persist/utils/mongodb-utils',
	'models': [
		{ 'name': 'docgagauser', 'model': '/init/model/user' },
		{ 'name': 'docgaganote', 'model': '/init/model/note' },
		{ 'name': 'docgagakeyword', 'model': '/init/model/keyword' },
		{ 'name': 'docgagaoauth', 'model': '/init/model/token' }
	]
};
