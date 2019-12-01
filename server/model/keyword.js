"use strict";

module.exports = DocGagaKeyword;

function DocGagaKeyword(mx){
	if(!(this instanceof DocGagaKeyword)){
		return new DocGagaKeyword(mx);
	}

	var self = this;

	self = Object.assign(self, mx || {});

	return DocGagaKeyword.parse(self);
}

DocGagaKeyword.modelName = "docgagakeyword";

DocGagaKeyword.parse = function(self){
	return self;
};

DocGagaKeyword.prototype = {
//	'username': undefined,
//	'keyword':undefined,
//	'relatedKeywords': undefined,
//	'noteIds': [],
//	'url': undefined,
//	'createTime': undefined,
//	'lastUpdateTime': undefined
};
