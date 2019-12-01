const DocGagaToken = require('../model/token');
const store = {
    token: require('../persist/token-store').newInstance()
};

module.exports = MongoTokenStorage;

/**
 * @constructor
 * @param {Object} options - 
 * @param {String} options.tokenType - 'a_t' | 'a_c' | 'r_t'
 * @param {function} [options.transformer] - 
 * @param {function} [options.unwrapKey] - 
 * @param {Boolean} [options.recordUpdateTime] - 
 */
function MongoTokenStorage(options){
    if(!(this instanceof MongoTokenStorage)){
        return new MongoTokenStorage(options);
    }

    options = options || {};

    var self = this;

    if(!options.tokenType){
        throw "'options.tokenType' not specified";
    }

    self.tokenType = options.tokenType;
    self.transformer = typeof options.transformer == 'function'? options.transformer: null;
    self.unwrapKey = typeof options.unwrapKey == 'function'? options.unwrapKey: (k) => k;    
    self.recordUpdateTime = options.recordUpdateTime || false;
}

MongoTokenStorage.prototype.get = get;
MongoTokenStorage.prototype.set = set;
MongoTokenStorage.prototype.setTTL = setTTL;
MongoTokenStorage.prototype.setExpiration = setExpiration;
MongoTokenStorage.prototype.remove = remove;

/**
 * @param {String} key
 * @return {DocGagaToken}
 */
async function get(key){
    key = this.unwrapKey(key);

    var self = this,
        tokens = await store.token.find({ token: key, type: self.tokenType }, null, 'toArray'),
        value;

    if(tokens && tokens.length){
        if(!tokens[0].type){
            tokens[0].type = this.tokenType;
        }

        value = DocGagaToken(tokens[0]);

        if(self.transformer){
            value = self.transformer.call(null, value);
        }

        return value;
    }

    return null;
}

/**
 * @param {String} key
 * @param {DocGagaToken} value
 * @return {Boolean}
 */
async function set(key, value){
    key = this.unwrapKey(key);

    var self = this;

    if(!value.type){
        value.type = self.tokenType;
    }

    if(!(value instanceof DocGagaToken)){
        value = DocGagaToken(value);
    }

    if(!(value.expiresAt instanceof Date)){
        throw "'expiresAt' is not specified";
    }

    if(self.recordUpdateTime){
        value._lastUpdateTime = new Date();
    }

    var rs = await store.token.update({
        token: key
    }, value, {
        upsert: true
    }, false);

    return rs;
}

/**
 * @param {String} key
 * @param {Object} value
 * @param {Number} ttl - time to live in seconds
 * @return {Boolean}
 */
async function setTTL(key, value, ttl){
    key = this.unwrapKey(key);

    var self = this;

    if(!value.type){
        value.type = self.tokenType;
    }
    
    if(!(value instanceof DocGagaToken)){
        value = DocGagaToken(value);
    }

    if(!(value.expiresAt instanceof Date) && ttl){
        value.expiresAt = new Date(Date.now() + ttl * 1000);
    }else{
        throw "neither 'expiresAt' nor 'ttl' is specified";
    }

    return await set.call(self, key, value);
}

/**
 * @param {String} key
 * @param {Object} value
 * @param {Date} exp
 * @return {Boolean}
 */
async function setExpiration(key, value, exp){
    key = this.unwrapKey(key);

    var self = this;

    if(!value.type){
        value.type = self.tokenType;
    }

    if(!value instanceof DocGagaToken){
        value = DocGagaToken(value);
    }

    if(!(value.expiresAt instanceof Date) && (exp instanceof Date)){
        value.expiresAt = exp;
    }else{
        throw "neither 'expiresAt' nor 'exp' is specified";
    }

    return await set.call(self, key, value);
}

/**
 * @param {String} key
 * @return {Boolean}
*/
async function remove(key){
    key = this.unwrapKey(key);

    return await store.token.delete({ token: key, type: this.tokenType }, false);
}
