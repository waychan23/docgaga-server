"use strict";

module.exports = DocGagaUser;

function DocGagaUser(mx){
	if(!(this instanceof DocGagaUser)){
		return new DocGagaUser(mx);
	}

	var self = this;

	self = Object.assign(self, mx || {});

	return DocGagaUser.parse(self);
}

DocGagaUser.modelName = 'docgagauser';

DocGagaUser.parse = function(self){
	return self;
};

DocGagaUser.prototype = {
	// '_id': undefined,
	// 'username': undefined,
	// 'password': undefined,
	// 'email': undefined,
	// 'phone': undefined,
	// 'createTime': undefined,
	// 'logins': undefined,//array
	// 'verifyCode': undefined, //Object { signup: ['phone'|'email']: { code: String, 'genTime': '' }, login: [ 'phone'|'email' ], resetPhone: ['phone'], resetEmail: ['email'], resetPwd: ['phone'|'email'] }
	// 'blocked': undefined, //boolean
	// 'blockHistory': undefined, //array
	// 'verification': undefined, //Object { phone: { time: '' },  email: false },
	// 'oauth': { 'wechat': {/*infomation*/}, 'github': {/*information*/} }
};
