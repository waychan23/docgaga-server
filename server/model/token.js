module.exports = DocGagaToken;

function DocGagaToken(mx){
	if(!(this instanceof DocGagaToken)){
		return new DocGagaToken(mx);
	}

	var self = this;

	self = Object.assign(self, mx || {});

	return DocGagaToken.parse(self);
}

DocGagaToken.modelName = 'docgagaoauth';

DocGagaToken.parse = function(self){
    if(self.type == 'a_t' && !self.expiresAt && self.accessTokenExpiresAt){
        self.expiresAt = self.accessTokenExpiresAt;
    }else if(self.type == 'r_t' && !self.expiresAt && self.refreshTokenExpiresAt){
        self.expiresAt = self.refreshTokenExpiresAt;
    }

    if(self.type == 'a_c' && !self.token && self.authorizationCode){
        self.token = self.authorizationCode;
    }else if(self.type == 'a_c' && !self.token && self.code){
        self.token = self.code;
    }if(self.type == 'a_t' && !self.token && self.accessToken){
        self.token = self.accessToken;
    }else if(self.type == 'r_t' && !self.token && self.refreshToken){
        self.token = self.refreshToken;
    }

    if(self.expiresAt && !(self.expiresAt instanceof Date)){
        self.expiresAt = new Date(self.expiresAt);
    }

    delete self.code;
    delete self.authorizationCode;
    delete self.accessToken;
    delete self.refreshToken;
    delete self.accessTokenExpiresAt;
    delete self.refreshTokenExpiresAt;
    
    if(self.type != 'a_c' || self.redirectUri){
        delete self.redirectUri;
    }

	return self;
};

DocGagaToken.prototype = {
    //_id: String
    //token: String, //index: unique
    //user: String
    //scope: String,
    //client: String
    //expiresAt: Date //index: expiresAt TTL
    //type: 'a_c' | 'a_t' | 'r_t'
    //redrectUri: String (only when type == 'a_c')
};