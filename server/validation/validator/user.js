"use strict";

const errors = require('../../error/error-def');

const LOGIN_TYPE = {
	'NORMAL': 'NORMAL',
	'EXTENSION': 'EXTENSION'
};

const rules = {
	username: {
		rule: /^(?![0-9]+$)[A-z0-9_\u4e00-\u9fa5]{4,16}$/,
		msg: {
			missing: {
				signup: '必须填写用户名',
				login: '请输入用户名'
			},
			mismatch: {
				signup: '用户名必须是4~16个中文字符、英文字母、数字或者下划线，并且不能全是数字',
				login: '用户名格式错误，请重新输入'
			}
		}
	},
	password: {
		rule: /^[A-z0-9@#\$%.,_=-]{6,20}$/,
		msg: {
			missing: {
				signup: '必须填写密码',
				login: '请输入密码'
			},
			mismatch: {
				signup: '密码必须由6~20位的英文字母、数字或者特殊符号(仅限于@#$%.,_=-)组成',
				login: '密码格式错误，请重新输入'
			}
		}
	},
	phone: {
		rule: /^1[3|4|5|7|8][0-9]\d{8}$/,
		msg: {
			missing: {
				signup: '必须填写手机号码',
				login: '请输入手机号码'
			},
			mismatch: {
				signup: '手机号码格式有误，请重新填写',
				login: '手机号码格式有误，请重新输入'
			}
		}
	},
	verifyCode: {
		rule: /^[0-9]{6}$/,
		msg: {
			missing: {
				signup: '请获取并填写手机验证码',
				login: '请填写手机验证码'
			},
			mismatch: {
				signup: '验证码有误，请检查后重新填写',
				login: '验证码有误，请检查后重新填写'
			}
		}
	},
	email: {
		rule: /^[A-Za-zd0-9]+([-_.][A-Za-zd0-9]+)*@([A-Za-zd0-9]+[-.])+[A-Za-zd]{2,5}$/,
		msg: {
			missing: {
				signup: '请填写邮箱',
				login: '倾输入邮箱'
			},
			mismatch: {
				signup: '邮箱格式有误，请重新填写',
				login: '邮箱格式有误，请重新输入'
			}
		}
	}
};

const services = {};

services.resetPassord = function(params){
	if(!params){
		return { 'error': errors.parameters_missing };
	}
	if(!params.phone || !params.password || !params.csrfToken){
		return { 'error': errors.parameters_missing };
	}

	if(!rules.password.rule.test(params.password)){
		return { 'error': errors.password_bad_format };
	}

	return true;
};

services.verifyCodeForResetPassword = function(params){
	if(!params){
		return { 'error': errors.parameters_missing };
	}
	if(!params.phone || !params.verifyCode){
		return { 'error': errors.parameters_missing };
	}

	return true;
};

services.sendPhoneVerifyCodeForResetPassword = function(params){
	if(!params){
		return { 'error': errors.parameters_missing };
	}

	if(!params.phone){
		return { 'error': errors.parameters_missing };
	}

	if(!rules.phone.rule.test(params.phone.trim())){
		return { 'error': errors.phone_bad_format };
	}

	return true;
};

services.checkUserAvail = function(params){
    if(!params){
        return { 'error': errors.parameters_missing };
    }
    
    if(!(params.username || !params.phone || !params.email)){
        return { 'error': errors.parameters_missing };
    }

    return true;
};

services.sendPhoneVerifyCode = function(params){

    if(!params){
        return { error: errors.parameters_missing };
    }

    var phone;

    phone = params.phone;

	if(!phone){
		return { 'error': errors.phone_unspecified, 'mal': true };
	}

    if(!rules.phone.rule.test(phone)){
		return { 'error': errors.phone_bad_format, 'mal': true };
	}

    return true;
};

services.signup = function(params){
    var user = params;

    if(!user){
		return { error: errors.signup_info_missing };
	}

    if(!user.username){
        return { error: errors.username_unspecified };
    }

    if(!user.phone){
        return { error: errors.phone_unspecified };
    }

    if(!rules.username.rule.test(user.username.trim())){
        return { error: errors.username_unspecified };
    }

    if(!rules.phone.rule.test(user.phone.trim())){
        return { error: errors.phone_bad_format };
    }

    if(user.email && !rules.email.test(user.email.trim())){
        return { error: errors.email_bad_format };
    }

    if(!user.verifyCode || !user.verifyCode.trim()){
		return { error: errors.verify_code_unspecified };
	}

    return true;
};

services.login = function(params){
    var q = params,
        account, password, type, farr, i, f;

    account = q.account && q.account.trim() || '';
	password = q.password && q.password.trim() || '';
	type = q.type && q.type.trim() || LOGIN_TYPE.NORMAL;

    if(!LOGIN_TYPE[type]){
        return { error: errors.invalid_login, mal: true };
    }

    if(!account){
        return { error: errors.invalid_account, mal: true };
    }

    if(!password){
        return { error: errors.invalid_password, mal: true };
    }

    farr = ['username', 'phone', 'email'];

	for(i=0; i<farr.length; i++){
		if(rules[farr[i]].rule.test(account)){
            f = farr[i];
			break;
		}
	}

	if(!f){
		return { error: errors.invalid_account, mal: true };
	}

    return true;
};

services.logout = function(params){
    return true;
};

module.exports = services;