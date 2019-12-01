"use strict";
var errors = require('../../error/error-def');

function Validator(config){
    return async (ctx, next) => {
        var params,
            path = ctx.request.path,
            cf;

        switch(ctx.request.method.toLowerCase()){
            case 'get': 
                params = ctx.request.query;
                break;
            default: 
                params = ctx.request.body;
        }

        if(!path){
            ctx.body = { error: errors.invalid_path };
            return;
        }

        cf = config[path];

        if(!cf){
            return await next();
        }

        for(let i=0;i<cf.targets.length;i++){
            let tar = cf.targets[i],
                validator = tar.validator,
                getParams = tar.target,
                rs;
            
            rs = validator? validator(getParams(params)): true;
            
            if(rs === true){
                return await next();
            }

            ctx.body = { error: rs && rs.error || errors.invalid_parameters };

            if(rs && rs.mal){
                ctx.request.malRequest = true;
                return await next();
            }
            
            return;
        }
    };
}

module.exports = Validator;