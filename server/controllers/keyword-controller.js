"use strict";

const keywordService = require('../services/keyword-service')(),
	  errors = require('../error/error-def'),
	  messages = require('../message/message-def');

module.exports = KeywordController;

var singleton;

function KeywordController(){
	var self = this;

	if(!(self instanceof KeywordController)){
		return new KeywordController();
	}

	return self;
}

KeywordController.getInstance = function(){
	if(!singleton){
		singleton = new KeywordController();
	}
	return singleton;
};

KeywordController.prototype.addKeyword = async (ctx, next) => {
	var keyword = ctx.request.body,
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		exist, rs;

	exist = await keywordService.checkExist(keyword.keyword.trim());

	if(exist){
		ctx.body = { error: errors.keyword_already_exists };
		return await next();
	}

	rs = await keywordService.addKeyword(keyword, loginUser);
	
	if(rs){
		ctx.body = { success: messages.add_keyword_success, result: rs };
	}else{
		ctx.body = { error: errors.add_keyword_error };
	}

	await next();
};

KeywordController.prototype.updateKeyword = async (ctx, next) => {
	var keyword = ctx.request.body,
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs;

	rs = await keywordService.updateKeyword(keyword, loginUser);

	if(rs){
		ctx.body = { success: messages.update_keyword_success, result: rs };
	}else{
		ctx.body = { error: errors.update_keyword_error };
	}

	await next();
};

KeywordController.prototype.deleteKeyword = async (ctx, next) => {
	var _id = ctx.request.query._id,
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs;

	rs = await keywordService.deleteKeyword(_id, loginUser);

	if(rs){
		ctx.body = { success: messages.delete_keyword_success, result: rs };
	}else{
		ctx.body = { error: errors.delete_keyword_error };
	}
	
	await next();
};

KeywordController.prototype.listKeywords = async (ctx, next) => {
	var conds = ctx.request.body.query || {},
		opts = ctx.request.body.opts || {},
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs;

	rs = await keywordService.listKeywords(conds, opts, loginUser);

	if(rs){
		ctx.body = { success: messages.find_keyword_success, result: rs };
	}else{
		ctx.body = { error: errors.find_keyword_error };
	}
	
	await next();
};

KeywordController.prototype.findKeywordById = async (ctx, next) => {
	var _id = ctx.request.query._id,
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs;

	rs = await keywordService.findKeywordById(_id, loginUser);
	
	if(rs !== false){
		ctx.body = { success: messages.find_keyword_success, result: rs || null };
	}else{
		ctx.body = { error: errors.find_keyword_error };
	}

	await next();
};

KeywordController.prototype.searchKeywords = async (ctx, next) => {
	var params = ctx.request.body,
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs;

	rs = await keywordService.searchKeywords(params, loginUser);

	if(rs !== false){
		ctx.body = Object.assign({ success: messages.find_keyword_success }, rs);
	}else{
		ctx.body = { error: errors.find_note_error };
	}

	await next();
};

KeywordController.prototype.getSuggestions = async (ctx, next) => {
	var params = ctx.request.body,
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs;

	rs = await keywordService.getSuggestions(params, loginUser);

	if(rs !== false){
		ctx.body = Object.assign({ success: messages.find_keyword_success }, rs);
	}else{
		ctx.body = { error: errors.find_keyword_error };
	}

	await next();
};