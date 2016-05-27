'use strict';

global.EventEmitter = {
  	events: {},
	on : function(name, callback) {
  		this.events[name] = this.events[name] || [];
  		this.events[name].push(callback);
	},
	emit : function(name, data) {
  		var event = this.events[name];
  		var args = [];
  		Array.prototype.push.apply(args, arguments);
  		args.shift();
  		if (event) event.forEach(function(callback) {
    		callback.apply(undefined,args);
  		});
  	}
};
