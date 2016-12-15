define([
	'models/session',
	'models/profile',
	'growl'
],
function(
	sessionModel,
	profileModel,
	growl
) {


	Backbone.View.prototype.views = [];

	Backbone.View.prototype.close = function(){

		_.each(this.views, function(v) {
			 v.close();
		});

		if (this.onClose) {
			this.onClose();
		}

		this.undelegateEvents();
		this.$el.removeData().unbind();
		this.unbind();
		this.stopListening();
		this.remove();
		this.connectedPrinter = null;

		Backbone.View.prototype.remove.call(this);
	}

	Backbone.View.prototype.loadView = function(view, view_id)
	{
		if (typeof this.views[view_id] !== 'undefined') {
			 this.views[view_id].close();
		}
		this.views[view_id] = view;
		return this.views[view_id];
	}

  var app = {
  	api: '/api'
  };

  app.channel = _.extend({}, Backbone.Events);
  app.selectedView = "login";
	app.selectedPrinter = null;
	app.protected = false;
	app.hostUrl = window.location.origin;
	app.filesUrl = 'https://s3-us-west-2.amazonaws.com/files.printrapp.com/';
	app.mmfApiUrl = 'https://www.myminifactory.com/api/v1';

	app.sync = function (method, model, options)
	{
    if (sessionModel.get('authenticated') && sessionModel.get('jwt'))
    {
      options =  _.extend({
        beforeSend: function(xhr) {
          var token = 'Bearer ' + sessionModel.get('jwt');
          xhr.setRequestHeader('Authorization', token);
        }
      }, options)
    }
		Backbone.sync(method, model, options);
	};

	profileModel.sync = app.sync;

	app.syncTv = function (method, model, options)
	{
    if (sessionModel.get('authenticated') && profileModel.get('thingiverse_token'))
    {
      options =  _.extend({
        beforeSend: function(xhr) {
          var token = 'Bearer ' + profileModel.get('thingiverse_token');
          xhr.setRequestHeader('Authorization', token);
        }
      }, options)
    }
		Backbone.sync(method, model, options);
	};

	sessionModel.sync = app.sync;

	app.alert = function(type, text)
  {
    if (type == 'error') {
			type = 'danger';
		}

    $.bootstrapGrowl(text, {
      ele: 'body',
      type: type + ' alert-dismissable',
      offset: {from: 'top', amount: 10},
      align: 'right',
      width: 300,
      delay: 3000,
      allow_dismiss: true,
      stackup_spacing: 5
    });
  };

	app.logout = function() {
		sessionModel.set(sessionModel.defaults);
		sessionModel.save();
		Backbone.history.navigate('/', true);
	}


	app.getConnectedPrinter = function()
	{
		return this.connectedPrinter;
	}

	sessionModel.bind('change:authenticated', function(c) {
		if (c.get('authenticated') == true) {
			// fetch user profile
			var uid = sessionModel.getId();
			profileModel.set({id: uid});
			profileModel.fetch({ headers: {'Authorization' :'Bearer '+sessionModel.get('jwt')}});
			connectSocketIo();
			Backbone.history.navigate('browser', true);
		} else {
			disconnectSocketIo();
			Backbone.history.navigate('/', true);
		}
	});

	sessionModel.fetch();

	function connectSocketIo() {
		console.info('connecting socket io')
		app.io= io(app.hostUrl, {
			 query: 'jwt=' + sessionModel.get('jwt')
		})

		app.io.on('message', function(e) {
			console.info("SOCKETIO: ", e);
      app.channel.trigger(e.message, e);
    });

		app.io.on('connect', function(e) {
			console.info('connected', e)
		})

	}

	function disconnectSocketIo() {
		app.io.close();
	}

	app.printer = {};
	app.printer.send = function(sn, message) {
		$.ajax({
			method: "POST",
			url: app.hostUrl + app.api + '/printer/'+ sessionModel.getId() + '/' + sn,
			data: message,
			beforeSend : function(xhr) {
        xhr.setRequestHeader("Authorization", "Bearer " +  sessionModel.get('jwt'));
    	}
		})
		.done(function(msg) {
				console.info("posted message to printer", msg);
		})
		.fail(function( jqXHR, textStatus ) {
				app.alert('error', 'Error communicating with the printer');
		});
	}

	app.channel.on('printer.connected', function(e) {
		console.info("in printer.connected");
		app.connectedPrinter = e;
	})

	app.channel.on('printer.disconnected', function(e) {
		console.info("in printer.disconnected");
		app.connectedPrinter = null;
	})

	app.channel.on('printer.message', function(e) {
		console.info(e);
	})

	app.channel.on('printer.print-started', function(e) {
		app.alert('info', 'Print job started...')
	});

	app.channel.on('job.status', function(e) {
		if (e.data == 'slicing.started') {
			app.alert('info', 'Slicing started')
		}
		else if (e.data == 'sending') {
			app.alert('info', 'Sending job to printer')
		}
	});

	app.channel.on('job.download', function(e) {
		console.info(e);
		$.ajax({
			// TODO: use selected printer
			url: 'http://printrbot.local/download',
			cache: false,
			data: {
				location: e.location
			},
			type: 'GET',
			// TODO pass authentication for locked printers
			/*
			headers: {
				'authorization': 'Bearer '+user.get('jwt')
			},
			*/
			success: function(r){
				debugger;
			},
			error: function(r){
				debugger;
			}
		});
	});


	app.channel.on('printer.update', function(e) {
	var changed = [];
	if (app.connectedPrinter) {
		for (var i in e) {
			if (app.connectedPrinter[i] != e[i])
				changed.push(i);
		  	app.connectedPrinter[i] = e[i];
			}
		} else {
			app.connectedPrinter = e;
			changed.push('all');
		}
		app.connectedPrinter.changed = changed;
	})
  $.ajaxSetup({ cache: false });
  return app;
});
