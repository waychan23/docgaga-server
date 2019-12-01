"use strict";

const crypto = require('crypto');

module.exports = function(msg){
	var hash = crypto.createHash('md5');

	hash.update(msg);

	return hash.digest('hex');
};

