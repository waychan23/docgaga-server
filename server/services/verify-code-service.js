"use strict";

const genCode = require('../codegen/verify-code');
const crypto = require('../utils/crypto');
const MemoryStorage = require('simple-memory-storage');

const assert = require('assert');

const PURPOSE = {
	VERIFY_PHONE: 'verifyPhone',
	RESET_PASSWORD: 'resetPassword'
};

const VIA = {
	PHONE: 'phone',
	CONSOLE: 'console'
};

const config = (function(){
	var conf = {};

	conf[PURPOSE.VERIFY_PHONE] = {};
	conf[PURPOSE.VERIFY_PHONE][VIA.CONSOLE] = {
		opName: '完成验证',
		purpose: PURPOSE.VERIFY_PHONE,
		via: VIA.CONSOLE,
		updateInterval: 5 * 60 * 1000
	};

	conf[PURPOSE.RESET_PASSWORD] = {};
	conf[PURPOSE.RESET_PASSWORD][VIA.CONSOLE] = {
		opName: '完成验证',
		purpose: PURPOSE.RESET_PASSWORD,
		via: VIA.CONSOLE,
		updateInterval: 5 * 60 * 1000
	};

	return conf;
}());

module.exports = VerifyCodeService;

module.exports.PURPOSE = PURPOSE;

module.exports.VIA = VIA;

function VerifyCodeService(opts){
	if(!(this instanceof VerifyCodeService)){
		return new VerifyCodeService;
	}

	opts = opts || {};

	var self = this;

	self.store = opts.store || new MemoryStorage();

	return self;
}

VerifyCodeService.prototype.send = async function(forWhat, via, dest){
	if(!forWhat){
		throw "must specify what (purpose) you send the verify code for";
	}
	if(!via){
		throw "must specify how to send the verify code, via 'email' or 'phone'";
	}

	if(!config[forWhat] || !config[forWhat][via]){
		throw `unsupported operation '${forWhat}' via '${via}' `;
	}

	var self = this,
		ret;

	switch(via){
		case VIA.CONSOLE:
			ret = sendConsoleMessage(self, dest, config[forWhat][via]);
			break;
		default:
			throw `unsupported value '${via}' for argument 'via'`;
	}

	return ret;
};

VerifyCodeService.prototype.encryptVerifyCode = encryptVerifyCode;

VerifyCodeService.prototype.doVerifyCode = async function(dest, forWhat, via, code, encrypted){
	if(!forWhat || !via || !dest || !code){
		return false;
	}

	if(!config[forWhat] || !config[forWhat][via]){
		return false;
	}

	var self = this,
		t = new Date().getTime(),
		conf = config[forWhat][via],
		key = `vcode|${via}|${forWhat}|${dest}`,
		vcode = await self.store.get(key),
		enc;

	if(!vcode || (t - vcode.createTime) > conf.updateInterval){
		return false;
	}

	enc = encrypted?encryptVerifyCode(dest, vcode.code, via): vcode.code;

	if(enc != code){
		return false;
	}

	await self.store.remove(key);

	return true;
};

VerifyCodeService.prototype.getVerifyCode = async function(forWhat, via, dest){
	var self = this,
		key = `vcode|${via}|${forWhat}|${dest}`;
	return await self.store.get(key);
};

async function sendConsoleMessage(ctx, dest, conf){
	var key = `vcode|console|${conf.purpose}|${dest}`,
		s = ctx.store,
		t = new Date().getTime(),
		vcode = await s.get(key),
		rt = conf.updateInterval,
		rs;

	if(!vcode || t - vcode.createTime > conf.updateInterval){
		vcode = {
			code: genCode.phone(),
			createTime: t
		};
		rt = conf.updateInterval / 1000;
	}else{
		vcode = {
			code: vcode.code,
			createTime: t
		};
		rt = Math.floor((vcode.createTime + conf.updateInterval - t) / 1000);
	}

	rs = await s.setTTL(key, vcode, rt);

	assert.equal(true, rs);

	console.log(`请将该验证码告知注册的人：${JSON.stringify(vcode)}`);

	return true;
}

function encryptVerifyCode(dest, code, via){
	return crypto.sha256(`${code}&via${via}to&${dest}`);
}
