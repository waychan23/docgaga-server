"use strict";

const crypto = require('../utils/crypto');

module.exports = (user) => {
	var t = new Date().getTime(),
		rand = Math.abs(Math.random() * 9876567879),
		str;

	str = '' + t + '&' + user.username + '&' + rand;

	return Buffer.from(crypto.md5(str), 'utf-8').toString('base64');
};
