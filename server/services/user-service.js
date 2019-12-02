"use strict";

const DocGagaUser = require('../model/user');
const secCrpt = require('../security/crypto');
const genAPITicket = require('../codegen/api-ticket');
const timeUtils = require('../utils/time-utils');
const store = {
	'user': require('../persist/user-store').newInstance()
};

const LOGIN_TYPE = {
	'NORMAL': 'NORMAL',
	'EXTENSION': 'EXTENSION',
	'OAUTH': 'OAUTH'
};

module.exports = UserService;

/**
 * @class
 */
function UserService(){
	if(!(this instanceof UserService)){
		return new UserService();
	}
	return this;
}

/**
 * 检查一个用户名是否已经存在, 三个参数使用第一个不为空的
 * @param {String} [query] 检查条件
 * @return {Promise} 值为 true|false，代表发送是否成功
 */
UserService.prototype.checkIfUserExists = async (query) => {
	if(!query){
		throw '必须指定查询条件';
	}

	var l = ['username', 'phone', 'email']
			.map(f => ({ field: f, value: query[f] }))
			.filter(i => i.value)
			.map(i => {
				var kv = {};
				kv[i.field] = i.value;
				return kv;
			}),
		q = { $or: [] };

	if(!l.length){
		throw "参数无效，必须指定 username, phone, email 中的一个";
	}

	l.forEach(i => q.$or.push(i));

	var count = await store.user.count(q);

	return count > 0;
};

/**
 * 注册一个新用户
 * @param {DocGagaUser} [user] 注册用户对象
 * @param {Object} [options]
 * @return {Promise} true | false
 */
UserService.prototype.signUp = async (user, options) => {
	var hash = await secCrpt.encodePassword(user),
		usr = DocGagaUser({
			username: user.username,
			password: hash,
			phone: user.phone,
			email: user.email,
			verification: {
				phone: { verified: true, time: new Date() },
				email: { verified: false }
			}
		});

	if(!usr.email){
		delete usr.email;
	}

	usr.createTime = new Date();

	usr = await store.user.save(usr);

	return usr;
};

UserService.prototype.userAuth = async (accountType, account, password, opts) => {
	var utv, user, filter, qOpts, update, ua,
		apiTicket, t, et, update2;

	opts = opts || {};

	opts.type = opts.type || LOGIN_TYPE.NORMAL;
	opts.ua = opts.ua || '';

	if(!opts.ip){
		return false;
	}

	if(!opts.ua){
		return false;
	}

	if(!LOGIN_TYPE[opts.type]){
		return false;
	}

	filter = {};
	qOpts = {};

	filter[accountType] = account;

	qOpts.project = {
		username: 1,
		password: 1,
		avartar: 1
	};

	user = await store.user.find(filter, qOpts, true);

	if(!user || !user.length){
		return false;
	}

	user = user[0];

	utv = {};
	utv[accountType] = account;
	utv.password = password;

	if(!await secCrpt.verifyPassword(utv, user)){
		return false;
	}

	return user;
};

UserService.prototype.login = async (accountType, account, password, opts) => {
	var utv, user, filter, qOpts, update, ua,
		apiTicket, t, et, update2;

	opts = opts || {};

	opts.type = opts.type || LOGIN_TYPE.NORMAL;
	opts.ua = opts.ua || '';

	if(!opts.ip){
		return false;
	}

	if(!opts.ua){
		return false;
	}

	if(!LOGIN_TYPE[opts.type]){
		return false;
	}

	filter = {};
	qOpts = {};

	filter[accountType] = account;

	qOpts.project = {
		username: 1,
		password: 1,
		avartar: 1
	};

	user = await store.user.find(filter, qOpts, true);

	if(!user || !user.length){
		return false;
	}

	user = user[0];

	utv = {};
	utv[accountType] = account;
	utv.password = Buffer.from(password, 'base64').toString('utf-8');

	if(!await secCrpt.verifyPassword(utv, user)){
		return false;
	}

	update = {
		$push: {}
	};

	update2 = {
		$pull: {}
	};

	if(opts.type == LOGIN_TYPE.EXTENSION){
		apiTicket = genAPITicket({ username: user.username });
		
		t = new Date();
		et = new Date(t.getTime() - timeUtils.MILLIS.ONE_MONTH);

		user.apiTickets = [ { apiTicket: apiTicket, ua: opts.ua, createTime: t, lastUseTime: t } ];

		update.$push.apiTickets = {
			$each: user.apiTickets
		};

		update2.$pull.apiTickets = {
			lastUseTime: { $lt: et }
		};
	}
	
	user.logins = [];

	user.logins.unshift({
		'ip': opts.ip,
		'ua': opts.ua,
		'type': opts.type,
		'time': t,
		'accountType': accountType,
		'apiTicket': opts.type == LOGIN_TYPE.EXTENSION? apiTicket: undefined
	});

	update.$push.logins = {
		$each: user.logins,
		$position: 0,
		$slice: 10
	};

	if(!await store.user.update({ _id: user._id }, update)){
		return false;
	}

	await store.user.update({ _id: user._id }, update2);

	delete user.password;

	return user;
};

UserService.prototype.logout = async (username, apiTicket, opts) => {
	var user, key, toDelete, rs;

	opts = opts || {};

	if(!username || !apiTicket){
		return true;
	}

	rs = await store.user.update({ username: username }, {
		$pull: {
			apiTickets: { 'apiTicket': apiTicket }
		}
	});

	return !!rs;
};

UserService.prototype.resetPassword = async (accountType, account, password) => {
	if(!accountType || !account || !password){
		return false;
	}

	var self = this,
		query = {},
		userExists, rs;

	query[accountType] = account;

	userExists = await store.user.count(query);

	if(!userExists){
		return false;
	}

	password = await secCrpt.encodePassword({ 'password': password });

	rs = await store.user.update(query, {
		$set: { 'password': password }
	}, !'batch');

	return rs;
};