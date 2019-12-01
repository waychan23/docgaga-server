"use strict";

const URL_PATTERN = {
	regex: /^((https?|file|chrome-extension|ftp)?:\/\/)?([^:\/]+)(:([0-9]+))?(\/[^\?#]*)*(\?[^#]*)?(#.*)?/,
	fieldIndexes: [
		{ 'field': 'protocol', 'index': 2 },
		{ 'field': 'host', 'index': 3 },
		{ 'field': 'port', 'index': 5, 'format': function(s){
			s = parseInt(s);
			if(!isNaN(s)){
				return s;
			}else{
				return undefined;
			}
		} },
		{ 'field': 'path', 'index': 6 },
		{ 'field': 'search', 'index': 7 },
		{ 'field': 'hash', 'index': 8 }
	]
};

module.exports.getProtocolFromUrl = function(url){
	url = url || '';
	var m = url.match(/^([^:]+):/);
	if(m){
		return m[1];
	}
	return '';
};

function parseUrl(url){
	var m = url.match(URL_PATTERN.regex), o;
	if(!m){
		return null;
	}
	o = {};
	URL_PATTERN.fieldIndexes.forEach(f => o[f.field] = typeof f.format == 'function'? f.format(m[f.index]): m[f.index]);
	return o;
}

module.exports.parseUrl = parseUrl;

module.exports.getOriginFromUrl = function(url){
	const loc = parseUrl(url);
	if(!loc.port ||
		loc.protocol == 'https' && loc.port === 433 ||
		loc.protocol == 'http' && loc.port === 80){
		return loc.host;
	}
	return loc.host+':'+loc.port;
};

module.exports.normalizeUrl = function(url){
	url = url || '';
	return url.replace(/^(https?|chrome-extension|file):\/\/(www\.)?|(\/)?#.*$|\/$/g, '');
};
