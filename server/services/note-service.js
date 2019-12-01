"use strict";

const NoteStore = require('../persist/note-store'),
	  KeywordStore = require('../persist/keyword-store'),
	  urlUtils = require('../utils/url-utils'),
	  timeUtils = require('../utils/time-utils');

const store = {
	note: NoteStore.newInstance(),
	keyword: KeywordStore.newInstance()
};

module.exports = NoteService;

function NoteService(){
	var self = this;

	if(!(self instanceof NoteService)){
		return new NoteService();
	}

	return self;
}

NoteService.prototype.addNote = async function(note, loginUser){
	if(!loginUser || !loginUser.username){
		return false;
	}

	var rs, t;

	note.username = note.username || loginUser.username;

	if(note.username != loginUser.username){
		return false;
	}

	note.createTime = new Date();

	t = new Date();
	t.setTime(note.createTime.getTime());

	note.lastUpdateTime = t;

	note = await populateKeywords(note);

	if(!note){
		return false;
	}

	rs = await store.note.save(note);

	if(!rs){
		return false;
	}

	return rs;
};

NoteService.prototype.updateNote = async function(note, loginUser){
	if(!loginUser || !loginUser.username){
		return false;
	}
	var self = this,
		rs, update;

	note.username = note.username || loginUser.username;

	if(note.username != loginUser.username){
		return false;
	}

	note = await populateKeywords(note);

	if(!note){
		return false;
	}

	update = Object.assign({}, note);

	update.lastUpdateTime = new Date();

	delete update._id;
	delete update.createTime; 

	rs = await store.note.update({ _id: note._id, username: loginUser.username }, { $set: update });

	if(!rs){
		return false;
	}

	return await self.findNoteById(note._id, loginUser);
};

NoteService.prototype.deleteNote = async function(_id, loginUser){
	if(!loginUser || !loginUser.username){
		return false;
	}

	var rs;

	rs = await store.note.delete({ _id: _id, username: loginUser.username });

	if(!rs){
		return false;
	}

	return true;
};

NoteService.prototype.findNoteById = async function(_id, loginUser){
	if(!loginUser || !loginUser.username){
		return false;
	}

	var rs;

	rs = await store.note.find({ _id: _id, username: loginUser.username }, {}, 'toArray');

	if(!rs || !rs.length){
		return null;
	}

	return rs[0] || null;
};

NoteService.prototype.listNotes = async function(query, opts, loginUser){
	if(!loginUser || !loginUser.username){
		return false;
	}

	var rs;

	query = query || {};
	opts = opts || {};

	query.username = query.username || loginUser.username;

	if(query.username != loginUser.username){
		return false;
	}

	if(!opts.pagination){
		opts.pagination = {
			pageNo: 1,
			pageSize: 20
		};
	}
	opts.pagination.pageSize = Math.min(opts.pagination.pageSize, 100);

	if(!opts.sort){
		opts.sort = {
			lastUpdateTime: -1
		};
	}

	rs  = await store.note.find(query, opts, 'toArray');

	if(rs){
		return rs;
	}

	return false;
};

NoteService.prototype.searchNotes = async function(params, loginUser){
	if(!loginUser || !loginUser.username){
		return false;
	}

	var rs, q, query, opts, tot, allCap, origin;

	q = params.query || {};

	q.searchScope = q.searchScope || '';
	q.url = q.url || '';

	q.searchStr = (q.searchStr || '').trim();
	q.keywords = q.keywords || [];
	q.noteTypes = q.noteTypes || [];

	query = {};
	opts = {};

	allCap = /^[^a-z]+$/.test(q.searchStr);

	if(q.searchStr){
		query.$or = [
			{ note: { $contains: q.searchStr, $opts: { ignoreCases: allCap?false:true } } },
			{ text: { $contains: q.searchStr, $opts: { ignoreCases: allCap?false:true } } },
			{ pageTitle: { $contains: q.searchStr, $opts: { ignoreCases: allCap?false:true } } },
			{ url: { $contains: q.searchStr, $opts: { ignoreCases: allCap?false:true } } },
			{ keywordNames: { $contains: q.searchStr, $opts: { ignoreCases: allCap?false:true } } }
		];
	}

	if(q.createTimeStart){
		let d = timeUtils.getDayDateFromMills(q.createTimeStart);
		if(d){
			query.createTime = {};
			query.createTime.$gte = d;
		}
	}
	if(q.createTimeEnd){
		let d = timeUtils.getDayDateFromMills(q.createTimeEnd, 'dateEnd');
		if(d){
			query.createTime = query.createTime || {};
			query.createTime.$lte = d;
		}
	}

	if(q.lastUpdateTimeStart){
		let d = timeUtils.getDayDateFromMills(q.lastUpdateTimeStart);
		if(d){
			query.lastUpdateTime = {};
			query.lastUpdateTime.$gte = d;
		}
	}
	if(q.lastUpdateTimeEnd){
		let d = timeUtils.getDayDateFromMills(q.lastUpdateTimeEnd);
		if(d){
			query.lastUpdateTime = query.lastUpdateTime || {};
			query.lastUpdateTime.$lte = d;
		}
	}

	if(q.keywords.length){
		query.keywords = { $in: q.keywords };
	}

	if(q.searchScope == 'page'){
		query.url = urlUtils.normalizeUrl(q.url);
	}else if(q.searchScope == 'site'){
		origin = urlUtils.getOriginFromUrl(q.url);
		if(origin && /^www\./.test(origin) && origin.replace(/[^\.]/g, '').length <= 2){
			origin = origin.replace(/^www\./, '');
		}
		query.url = { $startWith: origin, $opts: { ignoreCases: true } };
	}

	query.username = loginUser.username;

	if(!params.sort){
		opts.sort = [];
	}else{
		opts.sort = [].concat(params.sort).filter(Boolean);
	}

	if(!opts.sort.some(f => f.length && f[0] == 'lastUpdateTime')){
		opts.sort.push([ 'lastUpdateTime', -1 ]);
	}

	if(!params.pagination){
		opts.pagination = {
			pageNo: 1,
			pageSize: 20
		};
	}else{
		opts.pagination = Object.assign({}, params.pagination);
	}

	opts.pagination.pageSize = Math.min(opts.pagination.pageSize, 100);

	tot = await store.note.count(query);

	if(tot < (opts.pagination.pageNo - 1) * opts.pagination.pageSize){
		opts.pagination.pageNo = Math.floor(tot / opts.pagination.pageSize) + 1;
	}

	opts.project = params.project;

	rs = await store.note.find(query, opts, 'toArray');

	if(rs){
		rs = {
			result: rs,
			totalCount: tot,
			pagination: { pageNo: opts.pagination.pageNo, pageSize: opts.pagination.pageSize }//,
//			sort: opts.sort
		};
	}

	return rs || false;
};

NoteService.prototype.findByMark = async function(params, loginUser){
	if(!loginUser || !loginUser.username || (params.username && loginUser.username != params.username)){
		return false;
	}
	
	var rs, query;

	query = {
		startPath: params.startPath,
		endPath: params.endPath,
		startOffset: params.startOffset,
		endOffset: params.endOffset,
		url: urlUtils.normalizeUrl(params.url)
	};

	query.username = loginUser.username;

	rs = await store.note.find(query, null, 'toArray');

	if(rs){
		rs = {
			result: rs			
		};
	}

	return rs || false;
};

NoteService.prototype.countNotes = async function(params={}, loginUser){
	if(!loginUser || !loginUser.username){
		return false;
	}

	var rs = await store.note.count({ username: loginUser.username });

	return rs;
};

async function populateKeywords(note){
	var m = {},
		ids = [],
		kws;

	note.keywords.forEach(i => {
		if(!m[i]){
			ids.push(i);
			m[i] = true;
		}
	});

	if(!ids.length){
		return false;
	}

	kws = await store.keyword.listBy({
		_id: { $in: ids }
	}, {
		project: {
			keyword: 1
		}
	}, 'toArray');

	if(!kws || !kws.length){
		return false;
	}

	note.keywords = kws.map(k => k._id.toHexString());
	note.keywordNames = kws.map(k => k.keyword).join(",");

	return note;
}