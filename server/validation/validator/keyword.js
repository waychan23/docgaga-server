"use strict";

const errors = require('../../error/error-def');

const config = {
	MAX_KEYWORD_LENGTH: 20
};

const rules = {
    keyword: {
        rule: /^\s*[^,，]{1,20}\s*$/
    }
};

const services = {};

services.add = function(params){
    var keyword = params;

    if(keyword._id){
        return { error: errors.invalid_parameters };
    }

    if(!keyword || keyword.keyword === undefined || keyword.keyword === null){
		return { error: errors.parameters_missing };
	}

	if(typeof keyword.keyword != 'string'){
		return { error: errors.keyword_bad_format };
	}

	keyword.keyword = keyword.keyword.trim();

	if(!keyword.keyword.length){
		return { error: errors.keyword_unspecified };
	}

	if(!rules.keyword.rule.test(keyword.keyword.trim())){
		return { error: errors.keyword_bad_format };
	}

    return true;
};

services.list = function(params){
    return true;
};

services.findById = function(params){
    if(!params || !params._id){
        return { error: errors.id_unspecified };
    }

    if(typeof params._id != "string"){
        return { error: errors.id_bad_format };
    }

    return true;
};

services.search = function(params){
    var q;

    if((q = params.query)){
        if(q._id !== undefined && q._id !== null){
            if(typeof q._id == 'string'){
            }else if(Array.isArray(q._id)){
                if(q._id.some(i => typeof i != 'string')){
                    return { 'error': errors.id_bad_format };
                }
            }else{
                return { 'error': errors.id_bad_format };
            }
        }
        if(q.keyword){
            if(typeof q.keyword != 'string'){
                return { 'error': errors.keyword_bad_format };
            }
        }
		if(q.createTimeStart && q.createTimeEnd && q.createTimeStart > q.createTimeEnd){
			return { 'error': errors.params_end_time_must_gte_start_time };
		}
		if(q.lastUpdateTimeStart && q.lastUpdateTimeEnd && q.lastUpdateTimeStart > q.lastUpdateTimeEnd){
			return { 'error': errors.params_end_time_must_gte_start_time }
		}
        if((q.searchScope == 'page' || q.searchScope == 'site') && !q.url){
		    return false;
	    }
	}

    return true;
};

services.getSuggestions = function(params){
    if(!params){
        return { error: errors.parameters_missing };
    }
    if(!params.url){
        return { error: errors.url_unspecified };
    }
    if(typeof params.url != 'string'){
        return { error: errors.url_bad_format };
    }
    if(params.pageTitle && typeof params.pageTitle != 'string'){
        return { error: errors.page_title_bad_format };
    }
    if(params.cands && !Array.isArray(params.cands)){
        return { error: errors.cands_bad_format };
    }
    if(params.text && typeof params.text != 'string'){
        return { error: errors.text_bad_format };
    }

    return true;
};

module.exports = services;