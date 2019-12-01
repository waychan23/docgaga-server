"use strict";

const DocGagaNote = require('../model/note');
const Store = require('./store');
const mongoUtils = require('./utils/mongodb-utils');
const mongoConf = require('../config/mongodb-conf');

var singleton;

class NoteStore extends Store{
	constructor(){
		super(DocGagaNote, mongoUtils, mongoConf);
	}

	static newInstance(){
		singleton = singleton || new NoteStore();
		return singleton;
	}
}

module.exports = NoteStore;
