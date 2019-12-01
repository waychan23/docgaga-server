"use strict";

const v = require('../../validation/validators');

const strUtils = require('string-utils');

var add = { 'targets': [ { validator: v.note.add, target: theObject } ] },
    del = { 'targets': [ { validator: v.note.delete, target: theObject } ] },
    search = { 'targets': [ { validator: v.note.search, target: theObject } ] },
    findById = { 'targets': [ { validator: v.note.findById, target: theObject } ] },
    update = { 'targets': [ { validator: v.note.update, target: theObject } ] },
    findByMark = { 'targets': [ { validator: v.note.findByMark , target: theObject } ] },
    count = { 'targets': [ { validator: v.note.count, target: theObject } ] };

function theObject(params){
    return params;
}

function getField(fieldName){
    return function(params){
        if(typeof params == 'object'){
            return params[fieldName];
        };
        return null;
    };
}

function genConfig(appConfig){
    const config = {};

    const p = strUtils.makePrefixer(appConfig.contextPath + '/api/note');

    config[p('/add')] = add;
    config[p('/delete')] = del;
    config[p('/search')] = search;
    config[p('/findById')] = findById;
    config[p('/update')] = update;
    config[p('/findByMark')] = findByMark;
    config[p('/count')] = count;

    return config;
}

module.exports = genConfig;

