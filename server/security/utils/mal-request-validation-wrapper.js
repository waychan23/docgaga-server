"use strict";

module.exports = function(handler){
    return async (ctx, next) => {
        if(ctx.request.malRequest){
            return await next();
        }
        return await handler(ctx, next);
    };
}