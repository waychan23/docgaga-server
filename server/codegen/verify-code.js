"use strict";

const config = {
	'phone': {
		'digits': 6,
		'noZero': false
	},
	'email': {
		'digits': 6,
		'noZero': false
	}
};

var foo = 1;

module.exports.phone = function(){
	var c = config.phone;

	return genNDigit(c.digits, c.noZero);
};

module.exports.email = function(){
	var c = config.email;

	return genNDigit(c.digits, c.noZero);
};

function genNDigit(n){
	var code = '';

	for(let i=0;i<n;i++){
		code += genOneDigit();
	}

	return code;
}

function genOneDigit(noZero){
	var rand = Math.abs(Math.floor(Math.random() * 10));

	if(noZero && rand === 0){
		rand = foo;
		foo = (foo + 1) % 9 + 1;
	}

	return rand;
}
