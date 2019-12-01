"use strict";

module.exports = DocGagaNote;

function DocGagaNote(mx){
	if(!(this instanceof DocGagaNote)){
		return new DocGagaNote(mx);
	}

	var self = this;

	self = Object.assign(self, mx || {});

	return DocGagaNote.parse(self);
}

DocGagaNote.modelName = "docgaganote";

DocGagaNote.parse = function(self){

	self.keywords = self.keywords || [];

	for(let f in self){
		if(self.hasOwnProperty(f) && (self[f] === undefined || self[f] === null)){
			delete self[f];
		}
	}

	return self;
};

DocGagaNote.prototype = {
	// 'username': undefined,
	// 'keywords': undefined,
	// 'text': undefined,
	// 'note': undefined,
	// 'url': undefined,
	// 'pageTitle': undefined,
	// 'noteType': undefined,
	// 'startOffset': undefined,
	// 'endOffset': undefined,
	// 'startPath': undefined,
	// 'endPath': undefined,
	// 'createTime': undefined,
	// 'lastUpdateTime': undefined
};

const NOTE_TYPE_ID = {
	'MARK': 'c_m',
	'NOTE': 'c_n',
	'QUESTION': 'c_q',
	'TRANSLATION': 'c_t',
	'DISAGREE': 'c_d',
	'ANCHOR': 'c_a',
	'BOOKMARK': 'c_b'
};

const NOTE_TYPE = (function(){
	var i = NOTE_TYPE_ID,
		map = {};

	map[i.MARK] = { 'id': i.MARK, 'name': '标注' };
	map[i.NOTE] = { 'id': i.NOTE, 'name': '笔记' };
	map[i.QUESTION] = { 'id': i.QUESTION, 'name': '疑问' };
	map[i.TRANSLATION] = { 'id': i.TRANSLATION, 'name': '翻译' };
	map[i.DISAGREE] = { 'id': i.DISAGREE, 'name': '质疑' };
	map[i.ANCHOR] = { 'id': i.ANCHOR, 'name': '位置' };
	map[i.BOOKMARK] = { 'id': i.BOOKMARK, 'name': '书签' };

	return map;
}());

DocGagaNote.NOTE_TYPE_ID = NOTE_TYPE_ID;

DocGagaNote.NOTE_TYPE = NOTE_TYPE;
