"use strict";

require('./docgaga-server').listen(3333); 

process.on('uncaughtException', function (err) {
  console.log(err);
  console.log(err.stack);
});
