"use strict";

const v = require('../../validation/validators');

const strUtils = require('string-utils');

var add = { 'targets': [ { validator: v.keyword.add, target: theObject } ] },
    list = { 'targets': [ { validator: v.keyword.list, target: theObject } ] },
    findById = { 'targets': [ { validator: v.keyword.findById, target: theObject } ] },
    search = { 'targets': [ { validator: v.keyword.search, target: theObject } ] },
    getSuggestions = { 'targets': [ { validator: v.keyword.getSuggestions, target: theObject } ] };

function theObject(params){
    return params;
}

function genConfig(appConfig){
    const config = {};

    const p = strUtils.makePrefixer(appConfig.contextPath + '/api/keyword');

    config[p('/add')] = add;
    config[p('/list')] = list;
    config[p('/findById')] = findById;
    config[p('/search')] = search;
    config[p('/getSuggestions')] = getSuggestions;

    return config;
}

module.exports = genConfig;
