"use strict";

const session = require('koa-session');

const CONFIG = {
	key: 'DGGSESS',
	maxAge: 1000 * 60 * 30,
	overwrite: true,
	httpOnly: true,
	signed: true,
	rolling: false,
	path: '/docgaga'
};

module.exports = function(app){
	app.keys = [ 'j1k4xjf9w3nh5r12j4hbnzzdxj4h' ];
	return session(CONFIG, app);
};