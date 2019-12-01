"use strict";

const crypto = require('../utils/crypto');

const SALT_ROUNDS = 10;

module.exports.encodePassword = encodePassword;

module.exports.verifyPassword = verifyPassword;

async function encodePassword(user){
	return await crypto.bcrypt_hash(user.password, SALT_ROUNDS);
};

async function verifyPassword(userToVerify, theUser){
	var equal = crypto.bcrypt_compare(userToVerify.password, theUser.password);
	return equal;
};
