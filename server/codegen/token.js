
const CSRF_TOKEN_LENGTH = 16;

const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

module.exports.randomInt = randomInt;

function randomInt(mod){
    return Math.floor(Math.abs(Math.random() * mod));
}

module.exports.randomChar = randomChar;

function randomChar(){
    var i = randomInt(CHARS.length);
    return CHARS[i];
}

module.exports.csrfToken = function(){
    var chs = [];

    for(let i=0;i<CSRF_TOKEN_LENGTH;i++){
        chs.push(randomChar());
    }

    return chs.join('');
}