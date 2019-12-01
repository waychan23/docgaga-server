"use strict";
const appConfig = require('./app-conf');
const strUtils = require('string-utils');

const imps = [
    './validation/note',
    './validation/user',
    './validation/keyword'
];

const config = {};

imps.forEach((mod) => {
    var cf = require(mod);
    cf = cf(appConfig);
    if(cf){
        Object.assign(config, cf);
    }
});

module.exports = config;