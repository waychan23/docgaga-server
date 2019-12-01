var $ = require('jquery');

var domMap = {};
var state = {
    someError: false
};

function initForm(){
    domMap.form = $("form");

    domMap.input = function(name){
        return domMap.form.find("input[name="+name+"]");
    };
    
    domMap.form.on('submit', function(event){
        if(!validateForm()){
            return false;
        }
        domMap.form.submit();
        return false;
    });

    domMap.form.find("input").on("blur", function(){
        if(state.someError){
            validateForm();
        }
    });
}

function validateForm(){
    var data = getFormData();

    if(!data.client_id || !data.callback_uri || !data.scope || !data._csrf){
        alert("页面状态异常，无法登录，请刷新页面重试");
        return false;
    }

    showErrorTip($("input"), "");

    state.someError = true;

    if(isEmpty(data.account)){
        showErrorTip(domMap.input("account"), "帐号不能为空");
        return false;
    }

    if(isEmpty(data.password)){
        showErrorTip(domMap.input("password"), "密码不能为空");
        return false;
    }

    if(data.account.length > 60){
        showErrorTip(domMap.input("account"), "帐号格式有误");
        return false;
    }

    if(data.password.length > 20){
        showErrorTip(domMap.input("password"), "密码格式有误");
        return false;
    }

    state.someError = false;

    return true;
}

function isEmpty(str){
    return str === undefined || str === null || !str.trim().length;
}

function getFormData(){
    var data = {};

    data.account = domMap.input("account").val();
    data.password = domMap.input("password").val();
    data.client_id = domMap.input("client_id").val();
    data.callback_uri = domMap.input("callback_uri").val();
    data.scope = domMap.input("scope").val();
    data._csrf = domMap.input("_csrf").val();

    return data;
}

function showErrorTip(target, msg){
	target.parent().find('.error-tip').text(msg && '('+msg+')' || '').show();
}

initForm();