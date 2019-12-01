"use strict";

var $ = require('jquery'),
	validate = require('./validation/user');

var availCache = {
	username: {},
	phone: {}//,
//	email: {}
};

var state = {
	editPwd: false,
	showPwd: false
};

var imgs = {
	happy: 'img/smiley.png',
	sad: 'img/smiley-sad.png',
	loading: 'img/loading-small.gif',
	warning: 'img/help-blue-button.png'
};

var apis = {
	checkUserAvail: '/docgaga/user/signup/checkUserAvail',
	sendPhoneVerifyCode: '/docgaga/user/signup/sendPhoneVerifyCode',
	signup: '/docgaga/user/signup/submit',
	loginPage: '/docgaga/login'
};

var config = {
	'resendInterval': 60 * 1000
};

var signupForm = $("form")
		.attr('action', apis.signup)
		.on('submit', submit),
	formRow = {
		'verifyCode': signupForm.find('dd[data-role=verify-code-row]')
	},
	input = {
		username: signupForm.find("input[name=username]")
			.attr('pattern', validate.rules.username.rule.source)
			.on('blur', checkAvail('username'))
			.on('blur', showInvalidMsg),
		password: signupForm.find("input[name=password]")
			.attr('pattern', validate.rules.password.rule.source)
			.on('focus', updateView(function(){ state.editPwd = true; }))
			.on('blur', updateView(function(){
				state.editPwd = false;
			}))
			.on('blur', showInvalidMsg),
		phone: signupForm.find("input[name=phone]")
			.attr('pattern', validate.rules.phone.rule.source)
			.on('keyup blur', checkAvail('phone'))
			.on('blur', showInvalidMsg),
		verifyCode: signupForm.find("input[name=verifyCode]")
			.attr('pattern', validate.rules.verifyCode.rule.source)
			.on('blur', showInvalidMsg)
	},
	checkbox = {
		terms: signupForm.find("input[name=terms]")
			.on('change', function(){
				btn.signup.attr('disabled', !$(this).is(':checked')?'disabled':null);
			})
	},
	btn = {
		signup: signupForm.find("button[data-role=sign-up]")
			.on('click', submit),
		login: signupForm.find("button[data-role=to-login]"),
		pwdToggleVisBtn: signupForm.find("a[data-role=toggle-vis-btn]")
			.on('click', updateView(function(event){ state.showPwd = !state.showPwd; })),
		sendVerifyCode: signupForm.find('button[data-role=send-verify-code-btn]').on('click', sendVerifyCode)
	},
	loading = {
		username: signupForm.find('img[name=username][data-role=loading]'),
		phone: signupForm.find('img[name=phone][data-role=loading]')
	};

function submit(event){
	var data = getFormData(),
		i, arr, vr, err, comp;

	if(!data.terms){
		alert('需要阅读并同意《服务条款及隐私政策》才能注册');
		return false;
	}

	if(!signupForm[0].checkValidity()){
		arr = [ 'username', 'password', 'phone', 'verifyCode'];
		for(i=0; i<arr.length; i++){
			if(showInvalidMsg.call(input[arr[i]])){
				break;
			}
		}
		return false;
	}

	$.ajax({
		url: apis.signup,
		type: 'post',
		dataType: 'json',
		data: getFormData(),
		success: function(rs){
			if(!rs || rs.error || !rs.success){
				alert(rs && rs.error.msg || '注册失败');
				updateAvailCache();
				return;
			}
			if(rs.success){
				alert(rs.success.msg || '注册成功, 正在跳转到登录页面...');
			}
			window.location.href = apis.loginPage;
		},
		error: function(a, b, c){
			console.error(a, b, c);
		}
	});

	event.preventDefault();
	return true;
}

function updateAvailCache(){
	var k;
	for(k in availCache){
		if(availCache.hasOwnProperty(k)){
			if(availCache[k]){
				delete availCache[k];
			}
		}
	}
}

function applyState(){
	var s = state,
		data = getFormData(),
		img;

	if(s.showPwd){
		input.password.attr('type', 'text');
		btn.pwdToggleVisBtn.text('隐')
			.attr('title', '隐藏密码');
	}else{
		input.password.attr('type', 'password');
		btn.pwdToggleVisBtn.text('显')
			.attr('title', '显示密码');
	}

	[{ f: 'username', n: '用户名' },
	 { f: 'phone', n: '手机号码' }
	].forEach(function(i){
		var f = i.f,
			n = i.n,
			cf = 'checking'+f;

		img = loading[f].attr('src');

		if(!data[f]){
			loading[f].attr('src', '').hide();
		}else if(s[cf]){
			img != imgs.loading && loading[f].attr('src', imgs.loading)
				.attr('title', '正在检查该'+n+'是否可用').show();
		}else if(availCache[f][data[f]] === true){
			img != imgs.happy && loading[f].attr('src', imgs.happy)
				.attr('title', '太棒了，该'+n+'还没被使用，赶紧注册吧！').show();
		}else if(availCache[f][data[f]] === false){
			img != imgs.sad && loading[f].attr('src', imgs.sad)
				.attr('title', '该'+n+'已被使用，请尝试其他名称').show();
		}else if(availCache[f][data[f]] == 'unknown'){
			img != imgs.warning && loading[f].attr('src', imgs.warning)
				.attr('title', '暂时无法检测该'+n+'是否可用').show();
		}else if(!data[f]){
			loading[f].attr('src', '').hide();
		}
	});

	if(availCache['phone'][data.phone] === true && !state.recoverSendBtnTimer){
		btn.sendVerifyCode.attr('disabled', null).attr('title', '');
		formRow.verifyCode.show();
	}else{
		btn.sendVerifyCode.attr('disabled', 'disbaled');
	}
}

function updateView(changeState){
	return function(){
		typeof changeState == 'function' && changeState();
		applyState();
	};
}

function showInvalidMsg(){
	if(!this){
		return false;
	}
	var i = $(this)[0],
		s = i.validity;
	if(!s){
		i.setCustomValidity('');
		return false;
	}
	if(s.valueMissing){
		$(this).parent().find('.error-tip').text('('+(validate.rules[i.name].msg.missing.signup || '')+')').show();
		i.setCustomValidity(validate.rules[i.name].msg.missing.signup || '');
	}else if(s.patternMismatch){
		$(this).parent().find('.error-tip').text('('+(validate.rules[i.name].msg.mismatch.signup || '')+')').show();
		i.setCustomValidity(validate.rules[i.name].msg.mismatch.signup || '');
	}else{
		$(this).parent().find('.error-tip').text('').hide();
		i.setCustomValidity('');
		return false;
	}

	return true;
}

function getFormData(){
	var eles = {}, data = {},
		name;

	$.extend(eles, input, checkbox);

	for(name in eles){
		if(eles.hasOwnProperty(name)){
			data[name] = checkbox[name]?eles[name].is(':checked'):''+eles[name].val().trim();
		}
	}

	return data;
}

function checkAvail(field, callback){
	return function(){
		var value = '' + input[field].val().trim(),
			dt = {};

		if(!value || !validate.rules[field].rule.test(value)){
			state['checking' + field] = false;
			updateView().call();
			return;
		}

		if(availCache[field][value] == true || availCache[field][value] == false){
			state['checking'+field] = false;
			updateView().call();

			if(availCache[field][value] && typeof callback == 'function'){
				callback.call();
			}
			return;
		}

		dt[field] = value;

		state['checking' + field] = true;
		updateView().call();

		$.ajax({
			'url': apis.checkUserAvail,
			'type': 'get',
			'data': dt,
			'success': function(result){
				availCache[field][value] = !!result;
				state['checking'+field] = false;
				updateView().call();
				if(result && typeof callback == 'function'){
					callback.call();
				}
			},
			'error': function(a, b, c){
				console.error(a, b, c);
				availCache[field][value] = 'unknown';
				state['checking'+field] = false;
				updateView().call();
			}
		});
	};
}

function sendVerifyCode(){
	var data = getFormData();
	checkAvail('phone', function(){
		$.ajax({
			'url': apis.sendPhoneVerifyCode,
			'type':'get',
			'data': { 'phone': data.phone },
			'dataType': 'json',
			'success': function(result){
				var cnt;
				if(result && result.error){
					alert(result.error.msg || '验证码发送失败，请重试');
				}else if(result && result.success){
					btn.sendVerifyCode.text('已发送')
						.attr('title', '隔60秒可重新获取')
						.attr('disabled', 'disabled');

					if(state.recoverSendBtnTimer){
						clearTimeout(state.recoverSendBtnTimer);
						delete state.recoverSendBtnTimer;
					}

					state.recoverSendBtnTimer = setTimeout(function(){
						btn.sendVerifyCode.text('获取验证码')
							.attr('disabled', null)
							.attr('title', '');
						delete state.recoverSendBtnTimer;
					}, config.resendInterval);
				}else{
					console.error('unknown status');
				}
			},
			'error': function(a, b, c){
				console.error(a, b, c);
				alert('验证码发送失败，请重试');
			}
		});
	}).call();

	return false;
}

updateView().call();
