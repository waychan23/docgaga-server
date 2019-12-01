"use strict";

var $ = require('jquery');
var validation = require('./validation/user');

var SEND_VERIFY_CODE_INTERVAL = 30 * 1000;

var apis = {
    'sendVerifyCode': '/docgaga/user/reset-password/sendPhoneVerifyCode',
    'submitVerifyCode': '/docgaga/user/reset-password/verifyCode',
    'submitPassword': '/docgaga/user/reset-password/resetPassword',
    'loginPage': '/docgaga/login'
};

var state = {
    'action': 'sendVerifyCode',
    'lastGetVerifyCodeTime': 0
};

var domMap = {};

function initDom(){
    domMap.form = $("form");

    domMap.phoneInput = $("input[name=phone]");
    domMap.verifyCodeInput = $("input[name=verifyCode]");
    domMap.passwordInput = $("input[name=password]");
    domMap.confirmPasswordInput = $("input[name=confirmPassword]");

    domMap.modifyPhoneBtn = $("a[data-role=modify-phone-btn]");
    domMap.sendVerifyCodeBtn = $("button[data-role=send-verify-code-btn]");
    domMap.submitVerifyCodeBtn = $("button[data-role=submit-verify-code-btn]");
    domMap.submitPasswordBtn = $("button[data-role=submit-password-btn]");

    domMap.sendVerifyCodeTip = $(".tip-text[data-role=send-verify-code-tip]");
    domMap.errorTip = $('<div class="tip-text text-left text-danger" style="padding: .3em 0;"><div>');
}

function initEvents(){
    domMap.form.on('submit', function(){
        return false;
    });

    domMap.modifyPhoneBtn.on('click', function(){
        state.action = 'sendVerifyCode';
        state.errorField = state.errorMsg = null;
        domMap.verifyCodeInput.val('');
        domMap.passwordInput.val('');
        domMap.confirmPasswordInput.val('');
        render();
    });
    domMap.sendVerifyCodeBtn.on('click', function(){
        var phone = domMap.phoneInput.val(),
            v;

        v = validatePhone(phone);

        state.errorField = 'phone';

        if(v === true){
            state.errorField = state.errorMsg = null;            
            $.ajax({
                url: apis.sendVerifyCode,
                type: 'get',
                data: { 'phone': phone },
                success: function(rs){
                    if(!rs || rs.error || !rs.success){
                        state.errorField = 'phone';
                        state.errorMsg = '验证码发送失败，请稍候重试';
                        render();
                        return;
                    }
                    state.phone = phone;
                    state.errorField = state.errorMsg = null;
                    state.csrfToken = rs.csrfToken;                    
                    state.action = 'submitVerifyCode';        
                    state.lastGetVerifyCodeTime = new Date().getTime();
                    render();
                },
                error: function(e){
                    state.errorField = 'phone';
                    state.errorMsg = '验证码发送失败，请稍候重试';
                    render();
                    console.error(e);
                }
            });
        }else if(v && v.error){
            state.errorMsg = v.error;
        }else{
            state.errorMsg = '手机号码有误';
        }

        render();
    });

    domMap.submitVerifyCodeBtn.on('click', function(){
        var verifyCode = domMap.verifyCodeInput.val(),
            v;
        
        v = validateVerifyCode(verifyCode);

        state.errorField = 'verifyCode';

        if(v === true){
            state.errorField = state.errorMsg = null;
            $.ajax({
                url: apis.submitVerifyCode,
                type: 'get',
                data: {
                    phone: state.phone,
                    csrfToken: state.csrfToken,
                    verifyCode: verifyCode
                },
                success: function(rs){
                    if(!rs || rs.error || !rs.success){
                        state.errorField = 'verifyCode';
                        state.errorMsg = '验证码有误';
                        render();
                        return;
                    }
                    state.csrfToken = rs.csrfToken;  
                    state.errorField = state.errorMsg = null;
                    state.action = 'submitPassword';
                    render();
                },
                error: function(e){
                    console.error(e);
                    state.errorField = 'verifyCode';
                    state.errorMsg = '验证码有误';
                    render();
                }
            });
            
            render();
            return;
        }else if(v && v.error){
            state.errorMsg = v.error;
        }else{
            state.errorMsg = '验证码有误';
        }
        
        render();
    });
    domMap.submitPasswordBtn.on('click', function(){
        var pwd = domMap.passwordInput.val().trim(),
            cpwd = domMap.confirmPasswordInput.val().trim(),
            v;

        state.errorField = 'password';

        v = validatePassword(pwd);

        if(v === true){
            if(pwd == cpwd){
                state.errorField = state.errorMsg = null;
                $.ajax({
                    url: apis.submitPassword,
                    type: 'post',
                    data: {
                        phone: state.phone,
                        csrfToken: state.csrfToken,
                        password: pwd.trim()
                    },
                    success: function(rs){
                        if(!rs || rs.error || !rs.success){
                            state.errorField = 'password';
                            state.errorMsg = '密码重置失败，请稍候再试';
                            render();
                            return;
                        }
                        state.errorField = state.errorMsg = null;
                        render();
                        alert('密码重置成功');
                        window.location.href = apis.loginPage;
                    },
                    error: function(e){
                        console.error(e);
                        state.errorField = 'password';
                        state.errorMsg = '密码重置失败，请稍候再试';
                        render();
                    }
                });
            }else if(cpwd){
                state.errorMsg = '两次输入不一致';
            }else{
                state.errorMsg = '请再次输入密码';
            }
        }else if(v && v.error){
            state.errorMsg = v.error;
        }else{
            state.errorMsg = '密码格式有误';
        }

        render();

        if(state.errorField){
            return;
        }
    });

    setInterval(function(){
        if(state.action == 'submitPassword'){
            return;
        }

        var t = new Date().getTime();

        if(t - state.lastGetVerifyCodeTime > SEND_VERIFY_CODE_INTERVAL){
            domMap.sendVerifyCodeTip.text('');
        }else{
            domMap.sendVerifyCodeTip.text(Math.floor((SEND_VERIFY_CODE_INTERVAL - (t - state.lastGetVerifyCodeTime)) / 1000)+'秒后可重新获取');
        }
        render();
    }, 1000);
}

function init(){
    initDom();
    initEvents();
    render();
}

function render(){
    var t = new Date().getTime(),
        canSend = (t - state.lastGetVerifyCodeTime > SEND_VERIFY_CODE_INTERVAL),
        e;

    $("form dl dd").find("a,input,button,.tip-text").hide();
    switch(state.action){
        case 'sendVerifyCode': 
            domMap.phoneInput.removeClass('disabled').show();
            domMap.sendVerifyCodeBtn
                .text('获取手机验证码')
                .toggleClass('disabled', !canSend)
                .show();
            if(canSend){
                domMap.sendVerifyCodeTip.hide();
            }else{
                domMap.sendVerifyCodeTip.insertAfter(domMap.sendVerifyCodeBtn).show();
            }
            break;
        case 'submitVerifyCode':
            domMap.phoneInput.addClass('disabled').show();
            domMap.verifyCodeInput.removeClass('disabled').show();
            domMap.modifyPhoneBtn.show();
            domMap.sendVerifyCodeBtn
                .text('没收到?重新获取')
                .toggleClass('disabled', !canSend)
                .show();
            if(canSend){
                domMap.sendVerifyCodeBtn.text('重新获取验证码').removeClass('disabled').show();
                domMap.sendVerifyCodeTip.hide();
            }else{
                domMap.sendVerifyCodeBtn.text('重新获取验证码').addClass('disabled').hide();
                domMap.sendVerifyCodeTip.insertAfter(domMap.verifyCodeInput).show();
            }
            domMap.submitVerifyCodeBtn
                .removeClass('disabled')
                .show();
            break;
        case 'submitPassword':
            domMap.phoneInput.addClass('disabled').show();
            domMap.verifyCodeInput.addClass('disabled').hide();
            domMap.passwordInput.show();
            domMap.confirmPasswordInput.show();
            domMap.modifyPhoneBtn.show();
            domMap.submitPasswordBtn.show();
            break;
        default:
            console.error('unknown action:',state.action);
            alert('程序出错');
            return;
    }

    if(state.errorField && state.errorMsg){
        e = $("form input[name="+state.errorField+"]");
        if(e.length){
            domMap.errorTip.text(state.errorMsg).show().insertBefore(e);
        }
    }else{
        domMap.errorTip.remove();
    }

    $("input,button").filter(function(index, e){
        $(e).prop('disabled', $(e).hasClass('disabled')? true: false);
    });
}

function validatePhone(phone){
    phone = (phone || '').trim();

    if(!phone){
        return { error: '必须填写手机号码' };
    }else if(!validation.rules.phone.rule.test(phone)){
        return { error: '手机号码格式有误' };
    }

    return true;
}

function validateVerifyCode(code){
    code = (code || '').trim();

    if(!code){
        return { error: '必须填写验证码' };
    }else if(!validation.rules.verifyCode.rule.test(code)){
        return { error: '验证码有误' };
    }

    return true;
}

function validatePassword(password){
    password = (password || '').trim();

    if(!password){
        return { error: '必须填写密码' };
    }else if(!validation.rules.password.rule.test(password)){
        return { error: validation.rules.password.msg.mismatch.signup };
    }

    return true;
}

init();