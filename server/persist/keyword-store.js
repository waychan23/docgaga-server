"use strict";

const DocGagaNote = require('../model/keyword');
const Store = require('./store');
const mongoUtils = require('./utils/mongodb-utils');
const mongoConf = require('../config/mongodb-conf');

var singleton;

class KeywordStore extends Store{
	constructor(){
		super(DocGagaNote, mongoUtils, mongoConf);
	}

	static newInstance(){
		singleton = singleton || new KeywordStore();
		return singleton;
	}
}

module.exports = KeywordStore;
