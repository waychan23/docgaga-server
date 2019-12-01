"use strict";

const DocGagaUser = require('../model/user');
const Store = require('./store');
const mongoUtils = require('./utils/mongodb-utils');
const mongoConf = require('../config/mongodb-conf');

var singleton;

class UserStore extends Store{
	constructor(){
		super(DocGagaUser, mongoUtils, mongoConf);
	}

	/**
	 * @return {UserStore}
	 */
	static newInstance(){
		singleton = singleton || new UserStore();
		return singleton;
	}
}

module.exports = UserStore;
