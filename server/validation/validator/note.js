"use strict";

const errors = require('../../error/error-def');
const DocGagaNote = require('../../model/note');

const NOTE_TYPE_ID = DocGagaNote.NOTE_TYPE_ID,
	  NOTE_TYPE = DocGagaNote.NOTE_TYPE;

const config = {
    MAX_KEYWORDS: 5
};

const services = {};

services.add = function(note){
    if(!note){
		return { error: errors.parameters_missing };
	}

    if(note._id){
        return { error: errors.invalid_parameters };
    }

    return validateNote(note);
};

services.delete = function(params){
    if(!params || !params._id){
        return { error: errors.id_unspecified };
    }

    if(typeof params._id != 'string'){
        return { error: errors.id_bad_format };
    }

    return true;
};

services.search = function(params){
    var q;

    if((q = params.query)){
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

services.findById = function(params){
    if(!params || !params._id){
        return { error: errors.id_unspecified };
    }

    if(typeof params._id != 'string'){
        return { error: errors.id_bad_format };
    }

    return true;
};

services.update = function(params){
    var note = params;

    if(!note){
        return { errors: errors.parameters_missing };
    }

    if(!note._id){
        return { errors: errors.id_unspecified };
    }

    return validateNote(note);
};

services.findByMark = function(params){
	var mark = params;

	if(!mark){
		return { error: errors.parameters_missing };
	}

	if(!mark.url){
		return { error: errors.url_unspecified };
	}

	if(!mark.startPath){
		return { error: errors.start_path_unspecified };
	}

	if(!mark.endPath){
		return { error: errors.end_path_unspecified };
	}

	if(isNaN(parseInt(mark.startOffset))){
		return { error: errors.start_offset_bad_format };
	}

	if(isNaN(parseInt(mark.endOffset))){
		return { error: errors.end_offset_bad_format };
	}

	return true;
};

services.count = function(params){
	return true;
};

module.exports = services;

function validateNote(note){
    var type;

	if(!note.keywords){
		return { error: errors.keywords_unspecified };
	}

	if(!Array.isArray(note.keywords)){
		return { error: errors.keywords_bad_format };
	}

	if(!note.keywords.length){
		return { error: errors.keywords_unspecified };
	}

	if(note.keywords.length > config.MAX_KEYWORDS){
		return { error: errors.too_many_keywords };
	}

    type = note.noteType;

    if(!type || !NOTE_TYPE[type]){
		return false;
	}

	if(type == NOTE_TYPE_ID.MARK || type == NOTE_TYPE_ID.ANCHOR){
		if(!note.url || !note.startPath || !note.endPath){
			return false;
		}
	}

	if(type == NOTE_TYPE_ID.BOOKMARK){
		if(!note.url){
			return false;
		}
	}

    return true;
}