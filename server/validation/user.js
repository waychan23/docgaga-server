"use strict";

var rules = {
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

module.exports.rules = rules;

module.exports.signup = function(data){
	data = data || {};

	var warns = [],
		required = [ 'username', 'password', 'phone' ],
		options = [ 'email' ],
		i, f;

	for(i=0;i<required.length;i++){
		f = required[i];
		if(!data[f]){
			warns.push({ field: f, msg: rules[f].msg.missing.signup });
			return warns;
		}else if(!data[f].match(rules[f].rule)){
			warns.push({ field: f, msg: rules[f].msg.mismatch.signup });
			return warns;
		}
	}

	for(i=0;i<options.length;i++){
		f = options[i];
		if(data[f] && !data[f].match(rules[f].rule)){
			warns.push({ field: f, msg: rules[f].msg.mismatch.signup });
			return warns;
		}
	}

	return true;
};
