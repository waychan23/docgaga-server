"use strict";

const validators = {};

validators.note = require('./validator/note');
validators.keyword = require('./validator/keyword');
validators.user = require('./validator/user');

module.exports = validators;