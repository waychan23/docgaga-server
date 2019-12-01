"use strict";

const DocGagaToken = require('../model/token');
const Store = require('./store');
const mongoUtils = require('./utils/mongodb-utils');
const mongoConf = require('../config/mongodb-conf');

var singleton;

class TokenStore extends Store{
	constructor(){
		super(DocGagaToken, mongoUtils, mongoConf);
	}

	/**
	 * @return {TokenStore}
	 */
	static newInstance(){
		singleton = singleton || new TokenStore();
		return singleton;
	}
}

module.exports = TokenStore;
