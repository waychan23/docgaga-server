"use strict";

module.exports.MILLIS = {
	'ONE_HOUR': 1000 * 60 * 60,
	'ONE_WEEK': 1000 * 60 * 60 * 24 * 7,
	'ONE_MONTH': 1000 * 60 * 60 * 24 * 30
};

module.exports.getDayDateFromMills = function(mills, dayEnd){
	var d = new Date(mills);
	if(!d){
		return null;
	}

	d.setMilliseconds(dayEnd? 999: 0);
	d.setSeconds(dayEnd? 59: 0);
	d.setMinutes(dayEnd? 59: 0);
	d.setHours(dayEnd? 23: 0);

	return d;
}

module.exports.since = function(time, dateSeparator, padZero){
	if(!time){
		return '';
	}

	dateSeparator = dateSeparator || '-';

	var now = new Date(),
		dt = now.getTime() - time.getTime(),
		y, M, d;

	if(dt < 0){
		return '-';
	}

	if(dt < 1000 * 60){
		return '刚刚';
	}

	if(dt < 1000 * 60 * 60){
		return Math.floor(dt / 1000 / 60) + '分钟前';
	}

	if(dt < 1000 * 60 * 60 * 24){
		return Math.floor(dt / 1000 / 60 / 60) + '小时前';
	}

	if(dt < 1000 * 60 * 60 * 24 * 60){
		return Math.floor(dt / 1000 / 60 / 60 / 24) + '天前';
	}

	y = padZero?leftPadStr(time.getFullYear(), '0', 2): time.getFullYear();
	M = padZero?leftPadStr(time.getMonth() + 1, '0', 2): time.getMonth();
	d = padZero?leftPadStr(time.getDate(), '0', 2): time.getDate();

	if(now.getFullYear() === time.getFullYear() &&
	   now.getMonth() > time.getMonth()){
		return [M, d].join(dateSeparator);
	}

	return [y, M, d].join(dateSeparator);
};

module.exports.dateTime = function(time, dateSeparator, padZero){
	if(!time){
		return '';
	}

	dateSeparator = dateSeparator || '-';

	var y = time.getFullYear(),
		M = padZero?leftPadStr(time.getMonth() + 1, '0', 2): time.getMonth(),
		d = padZero?leftPadStr(time.getDate(), '0', 2): time.getDate(),
		h = padZero?leftPadStr(time.getHours(), '0', 2): time.getHours(),
		m = padZero?leftPadStr(time.getMinutes(), '0', 2): time.getMinutes(),
		s = padZero?leftPadStr(time.getSeconds(), '0', 2): time.getSeconds();
	
	return [y, M, d].join(dateSeparator)+' '+[h, m, s].join(':');
};

module.exports.millToSec = function(mill, round){
	var f = mill / 1000;
	return round == 'ceil'? Math.ceil(f): (round == 'floor'? Math.floor(f): f);
};

module.exports.millToMin = function(mill, round){
	var f = mill / 1000 / 60;
	return round == 'ceil'? Math.ceil(f): (round == 'floor'? Math.floor(f): f);
};

module.exports.millToHour = function(mill, round){
	var f = mill / 1000 / 60 / 60;
	return round == 'ceil'? Math.ceil(f): (round == 'floor'? Math.floor(f): f);
};

module.exports.millToDay = function(mill, round){
	var f = mill / 1000 / 60 / 60 / 24;
	return round == 'ceil'? Math.ceil(f): (round == 'floor'? Math.floor(f): f);
};

module.exports.utc_iso8601 = utc_iso8601;

function utc_iso8601(date){
	date = date instanceof Date? date: new Date(date);

	var d = getUTCFields(date),
		s = {
			'y': d.y,
			'M': leftPadStr(d.M + 1, '0', 2),
			'd': leftPadStr(d.d, '0', 2),
			'h': leftPadStr(d.h, '0', 2),
			'm': leftPadStr(d.m, '0', 2),
			's': leftPadStr(d.s, '0', 2)
		};

	return [s.y, s.M, s.d].join('-')+'T'+[s.h, s.m, s.s].join(':')+'Z';
};

function getFields(d){
	return {
		'y': d.getFullYear(),
		'M': d.getMonth(),
		'd': d.getDate(),
		'h': d.getHours(),
		'm': d.getMinutes(),
		's': d.getSeconds()
	};
}

function getUTCFields(d){
	return {
		'y': d.getUTCFullYear(),
		'M': d.getUTCMonth(),
		'd': d.getUTCDate(),
		'h': d.getUTCHours(),
		'm': d.getUTCMinutes(),
		's': d.getUTCSeconds()
	};
}

function leftPadStr(str, padChar, padToLength){
	if(str === undefined || str === null){
		return str;
	}

	str = str + '';

	if(!str.length){
		return str;
	}

	var len = padToLength - str.length;

	if(len <= 0){
		return str;
	}
	
	while(len > 0){
		str = padChar + str;
		len --;
	}

	return str;
}
