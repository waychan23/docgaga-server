"use strict";

const v = require('../../validation/validators');

const strUtils = require('string-utils');

var checkUserAvail = { 'targets': [ { validator: v.user.checkUserAvail, target: theObject } ] },
    sendPhoneVerifyCode = { 'targets': [ { validator: v.user.sendPhoneVerifyCode, target: theObject } ] },
    signup = { 'targets': [ { validator: v.user.signup, target: theObject } ] },
    login = { 'targets': [ { validator: v.user.login, target: theObject } ] },
    logout = { 'targets': [ { validator: v.user.logout, target: theObject } ] },
    sendPhoneVerifyCodeForResetPassword = { 'targets': [ { validator: v.user.sendPhoneVerifyCodeForResetPassword, target: theObject } ] },
    verifyCodeForResetPassword = { 'targets': [ { validator: v.user.verifyCodeForResetPassword, target: theObject } ] },
    resetPassword = { 'targets': [ { validator: v.user.resetPassword, target: theObject } ] };

function theObject(params){
    return params;
}

function genConfig(appConfig){
    const config = {};

    const p = strUtils.makePrefixer(appConfig.contextPath + '/user');

    config[p('/signup/checkUserAvail')] = checkUserAvail;
    config[p('/signup/sendPhoneVerifyCode')] = sendPhoneVerifyCode;
    config[p('/signup/submit')] = signup;
    config[p('/login')] = login;
    config[p('/logout')] = logout;
    config[p('/reset-password/sendPhoneVerifyCode')] = sendPhoneVerifyCodeForResetPassword;
    config[p('/reset-password/verifyCode')] = verifyCodeForResetPassword;
    config[p('/reset-password/resetPassword')] = resetPassword;

    return config;
}

module.exports = genConfig;
