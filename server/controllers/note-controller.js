"use strict";

const noteService = require('../services/note-service')(),
	  errors = require('../error/error-def'),
	  messages = require('../message/message-def');

module.exports = NoteController;

var singleton;

function NoteController(){
	var self = this;

	if(!(self instanceof NoteController)){
		return new NoteController();
	}

	return self;
}

NoteController.getInstance = function(){
	if(!singleton){
		singleton = new NoteController();
	}

	return singleton;
};

NoteController.prototype.addNote = async (ctx, next) => {
	var note = ctx.request.body,
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs;

	rs = await noteService.addNote(note, loginUser);

	if(rs){
		ctx.body = { success: messages.add_note_success, result: rs };
	}else{
		ctx.body = { error: errors.add_note_error };
	}

	await next();
};

NoteController.prototype.updateNote = async (ctx, next) => {
	var note = ctx.request.body,
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs;

	rs = await noteService.updateNote(note, loginUser);

	if(rs){
		ctx.body = { success: messages.update_note_success, result: rs };
	}else{
		ctx.body = { error: errors.update_note_error };
	}
	
	await next();
};

NoteController.prototype.deleteNote = async (ctx, next) => {
	var _id = ctx.request.query._id,
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs;

	rs = await noteService.deleteNote(_id, loginUser);

	if(rs){
		ctx.body = { success: messages.delete_note_success, result: rs };
	}else{
		ctx.body = { error: errors.delete_note_error };
	}

	await next();
};

NoteController.prototype.listNotes = async (ctx, next) => {
	var conds = ctx.request.body.query || {},
		opts = ctx.request.body.opts || {},
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs;

	rs = await noteService.listNotes(conds, opts, loginUser);

	if(rs){
		ctx.body = { success: messages.find_note_success, result: rs };
	}else{
		ctx.body = { error: errors.find_note_error };
	}
	
	await next();
};

NoteController.prototype.findNoteById = async (ctx, next) => {
	var _id = ctx.request.query._id,
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs;

	rs = await noteService.findNoteById(_id, loginUser);

	if(rs !== false){
		ctx.body = { success: messages.find_note_success, result: rs || null};
	}else{
		ctx.body = { error: errors.find_note_error };
	}

	await next();
};

NoteController.prototype.searchNotes = async (ctx, next) => {
	var params = ctx.request.body,
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs, q;

	rs = await noteService.searchNotes(params, loginUser);

	if(rs !== false){
		ctx.body = Object.assign({ success: messages.find_note_success }, rs);
	}else{
		ctx.body = { error: errors.find_note_error };
	}

	await next();
};

NoteController.prototype.findByMark = async (ctx, next) => {
	var params = ctx.request.body,
		loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs;
		
	rs = await noteService.findByMark(params, loginUser);

	if(rs !== false){
		ctx.body = Object.assign({ success: messages.find_note_success }, rs);
	}else{
		ctx.body = Object.assign({ error: message.find_note_error });
	}

	await next();
};

NoteController.prototype.countNotes = async (ctx, next) => {
	var loginUser = ctx.session.loginUser || ctx.state.loginUser,
		rs;

	rs = await noteService.countNotes(null, loginUser);

	rs = parseInt(rs);

	if(!isNaN(rs)){
		ctx.body = { success: messages.count_note_success , result: rs };
	}else{
		ctx.body = { error: errors.count_note_error };
	}

	await next();
};