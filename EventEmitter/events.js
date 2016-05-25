
'use strict';

api.events = require('events');

api.events.enhancedEventEmitter = function() {
  var ee = new api.events.EventEmitter(),
      emit = ee.emit;
  ee.emit = function() {
  	console.log("arguments: "+ JSON.stringify(arguments));
    var args = [];
    Array.prototype.push.apply(args, arguments);
    args.unshift('*');
    console.log("called with args");
    emit.apply(ee, args);
    console.log("called with arguments");
    emit.apply(ee, arguments);
  };
  return ee;
};