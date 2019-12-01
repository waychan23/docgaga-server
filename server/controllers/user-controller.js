"use strict";

const userService = require('../services/user-service')(),
	  VerifyCodeService = require('../services/verify-code-service'),
	  errors = require('../error/error-def'),
	  messages = require('../message/message-def'),
	  validation = require('../validation/user');

const verifyCodeService = new VerifyCodeService();

const LOGIN_TYPE = {
	'NORMAL': 'NORMAL',
	'EXTENSION': 'EXTENSION'
};

const RESET_PASSWORD_VERIFY_CODE_EXPIRES_IN = 1000 * 60 * 5;

module.exports = UserController;

function UserController(){
	if(!(this instanceof UserController)){
		return new UserController();
	}
	return this;
};

UserController.prototype.resetPassword = async (ctx, next) => {
	var phone = ctx.request.body.phone,
		password = ctx.request.body.password,
		csrfToken = ctx.request.body.csrfToken,
		info = ctx.session.resetPassword,
		rs;
	try{
		if(!info || csrfToken != info.csrfToken || Date.now() > info.expiresAt){
			ctx.request.malRequest = true;
			ctx.body = { error: errors.verify_info_expired };
		}else if(info.phone != phone){
			ctx.request.malRequest = true;
			ctx.body = { error: errors.verify_info_error };
		}else{
			rs = await userService.resetPassword('phone', phone, password);
			if(rs){
				ctx.body = { success: messages.reset_password_success };
			}else{
				throw new Error('error when reseting password');
			}
		}
	}catch(e){
		console.error(e);
		ctx.body = { error: errors.reset_password_error };
	}

	await next();
};

UserController.prototype.verifyPhoneVerifyCodeForResetPassword = async (ctx, next) => {
	var phone = ctx.query.phone,
		code = ctx.query.verifyCode,
		csrfToken = ctx.query.csrfToken,
		info = ctx.session.verifyCodeForResetPassword,
		csrf, success;

	if(!info || !info.csrfToken || Date.now() > info.expiresAt){
		ctx.request.malRequest = true;
		ctx.body = { error: errors.verify_info_expired };
	}else if(info.phone != phone){
		ctx.request.malRequest = true;
		ctx.body = { error: errors.verify_info_error };
	}else{
		try{
			success = await verifyCodeService.doVerifyCode(phone, VerifyCodeService.PURPOSE.RESET_PASSWORD, VerifyCodeService.VIA.CONSOLE, code, !'encrypted');
		}catch(e){
			console.error(e);
		}

		if(!success){
			ctx.body = {
				'error': errors.verify_code_mismatch
			};
		}else{
			csrf = Math.floor(Math.random() * 10000000);

			ctx.session.resetPassword = {
				'phone': phone,
				'expiresAt': Date.now() + RESET_PASSWORD_VERIFY_CODE_EXPIRES_IN,
				'csrfToken': csrf
			};
			
			ctx.body = {
				success: messages.verify_code_success,
				csrfToken: csrf
			};
		}
	}

	await next();
};

UserController.prototype.sendPhoneVerifyCodeForResetPassword = async (ctx, next) => {
	var phoneExists, phone, rs, info;

	phone = ctx.request.query.phone;

	phoneExists = await userService.checkIfUserExists({ 'phone': phone });

	if(!phoneExists){
		ctx.body = {
			'error': errors.phone_not_exists
		};
		ctx.request.skipCounting = true;
		ctx.request.malRequest = true;
		return await next();
	}

	try{
		ctx.session.verifyCodeForResetPassword = info = {
			phone: phone,
			csrfToken: Math.floor(Math.random() * 10000000),
			expiresAt: Date.now() + RESET_PASSWORD_VERIFY_CODE_EXPIRES_IN
		};

		rs = await verifyCodeService.send(VerifyCodeService.PURPOSE.RESET_PASSWORD, VerifyCodeService.VIA.CONSOLE, phone);

		ctx.body = {
			'success': messages.verify_code_sent,
			'csrfToken': info.csrfToken
		};

	}catch(e){
		console.error(e);

		ctx.body = {
			'error': errors.verify_code_send_error
		};
	}

	return await next();
};

UserController.prototype.sendPhoneVerifyCode = async(ctx, next) => {
	var phoneExists,
		phone, rs;

	phone = ctx.request.query.phone;

	phoneExists = await userService.checkIfUserExists({ phone: phone });

	if(phoneExists){
		ctx.body = {
			'error': errors.phone_already_signup
		};
		ctx.request.skipCounting = true;
		ctx.request.malRequest = true;
		return await next();
	}

	try{
		rs = await verifyCodeService.send(VerifyCodeService.PURPOSE.VERIFY_PHONE, VerifyCodeService.VIA.CONSOLE, phone);
		//ignore failure
		ctx.body = {
			'success': messages.verify_code_sent
		};
	}catch(e){
		console.error(e);

		ctx.body = {
			'error': errors.verify_code_send_error
		};
	}

	return await next();
};

UserController.prototype.checkUserAvail = async (ctx, next) => {
	try{
		var query = ctx.request.query,
			result;

		result = await userService.checkIfUserExists(query);

		ctx.body = !result;

		await next();
	}catch(e){
		console.error(e);
		ctx.throw('error', 500);
	}
};

UserController.prototype.signUp = async (ctx, next) => {
	var self = this,
		appCtx = ctx.appCtx,
		user = ctx.request.body,
		t = new Date().getTime(),
		key, theVcode, code, check, farr,
		exists, rs, err;

	user.phone = user.phone.trim();
	user.username = user.username.trim();
	user.email = user.email && user.email.trim();

	code = user.verifyCode.trim();

	exists = await userService.checkIfUserExists({
		'username': user.username,
		'phone': user.phone
	});

	if(exists){
		ctx.body = {
			'error': errors.user_already_signup
		};
		return await next();
	}

	rs = await verifyCodeService.doVerifyCode(user.phone, VerifyCodeService.PURPOSE.VERIFY_PHONE, VerifyCodeService.VIA.CONSOLE, code, !'encrypted');
	
	if(!rs){
		ctx.body = {
			error: errors.verify_code_mismatch
		};
		return await next();
	}

	try{
		rs = await userService.signUp(user);
	}catch(e){
		console.error(e);
		err = true;
	}

	if(!rs){
		ctx.body = {
			'error': errors.signup_error
		};
		return await next();
	}

	ctx.body = {
		'success': messages.signup_success_no_email
	};

	return await next();
};


UserController.prototype.login = async function(ctx, next){
	var q = ctx.request.body,
		account, password, type,
		f, user, ua, ip, resp;

	account = q.account && q.account.trim() || '';
	password = q.password && q.password.trim() || '';
	type = q.type && q.type.trim() || LOGIN_TYPE.NORMAL;

	ua = ctx.request.header['user-agent'];
	ip = ctx.request.ip;

	if(!ua){
		ctx.body = { error: errors.insecure_user_agent };
		ctx.request.malRequest = true;
		return await next();
	}

	f = getAccountType(account);

	try{
		user = await userService.login(f, account, password, {
			'type': type,
			'ua': ua,
			'ip': ip
		});
	}catch(e){
		console.error(e);
		ctx.body = { error: errors.login_error };
		return await next();
	}

	if(!user){
		ctx.body = { error: errors.wrong_account_or_password };
		ctx.request.malRequest = true;
		return await next();
	}

	if(type != LOGIN_TYPE.EXTENSION){
		ctx.session.loginUser = {
			username: user.username
		};
	}

	resp = {
		username: user.username,
		avartar: user.avartar,
		apiTicket: user.apiTickets.length? user.apiTickets[0].apiTicket: undefined
	};

	ctx.body = {
		success: messages.login_success,
		result: resp
	};

	return await next();
};


UserController.prototype.logout = async (ctx, next) => {
	var h = ctx.request.headers,
		sess = ctx.session,
		username, apiTicket, ua, rs;

	if(sess.loginUser){
		username = sess.loginUser.username;
		sess.loginUser = null;
	}

	username = h['x-username'] || username;
	ua = h['user-agent'];
	apiTicket = h['x-api-ticket'];

	if(!username){
		ctx.body = {
			'success': messages.logout_success
		};
		return await next();
	}

	try{
		rs = await userService.logout(username, apiTicket, { ua: ua });
	}catch(err){
		console.error(err);
		ctx.body = {
			error: errors.logout_error
		};
		return await next();
	}

	if(rs){
		ctx.body = {
			success: messages.logout_success
		};
	}else{
		ctx.body = {
			error: errors.logout_error
		};
	}
	
	return await next();
};

function getAccountType(account){
	var farr = ['username', 'phone', 'email'],
		f, i;

	for(i=0; i<farr.length; i++){
		if(validation.rules[farr[i]].rule.test(account)){
			f = farr[i];
			break;
		}
	}

	return f || null;
}