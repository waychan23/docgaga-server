"use strict";

/* /(([A-Z]{1}|[A-Z][a-z]+|[0-9]+))/g */
/* /(([A-Z]{1}|[A-Z][a-z0-9]+))/g */

module.exports.camel2underscore = function(str, cap, numberAlone){
	//对不正确的驼峰式先纠正, 例如数字后面直接跟小写字母，应该更为大写
	str = (str || '').replace(/[0-9][a-z]/g, g => g.replace(/[a-z]$/, l => l.toUpperCase()));
	cap = cap?'Upper':'Lower';
	if(numberAlone){
		str = str.replace(/^[0-9]+|^[a-z]+|[A-Z]{1}|[A-Z][a-z]+|[0-9]+/g,
					g => '_'+g['to'+cap+'Case']());
	}else{
		str = str.replace(/^[0-9]+|^[a-z]|[A-Z]{1}|[A-Z][a-z0-9]+/g,
					g => '_'+g['to'+cap+'Case']());
	}
	return str.replace(/^_/, '');
};

module.exports.makePrefixer = function(prefix){
	if(typeof prefix != 'string'){
		prefix = '';
	}
	return function(suffix){
		return prefix + suffix;
	};
};