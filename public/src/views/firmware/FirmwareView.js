define([
  'app',
  'printers',
  'models/profile',
  'models/session',
  'views/printers/PrinterItem',
  'views/project/PrintrbarView',
  'text!./templates/firmware.html'
],

function(
  app,
  printers,
  profileModel,
  userModel,
  PrinterItem,
  PrintrbarView,
  Tpl
)
{

  var v = Backbone.View.extend(
  {
    className: 'firmware',
    events:
    {
      'click button.update-esp': 'runEspUpdate',
      'click button.update-mk20': 'runMk20Update',
      'click button.update-ui': 'runUiUpdate',
      'click button.format-esp': 'formatEsp',
    },

    initialize: function(o)
    {
      this.tpl = _.template(Tpl);

      this.listenTo(profileModel, 'change', function(e){
        this.render();
      }, this);
    },

    getHeaders: function() {
      var _headers = {}, sp = profileModel.getSelectedPrinter();
      if (sp.password && sp.password.length > 0) {
        _headers.Authorization ="Basic " + sp.password;
      }
      return _headers;
    },

    runEspUpdate: function(e) {
      var headers = this.getHeaders();
      $.ajax({
        url: 'http://'+profileModel.getSelectedPrinter().ip+'/update_esp?url=http://static.printrbot.cloud/firmware/simple/esp.bin',
        cache: false,
        type: 'GET',
        headers: headers,
        success: function(r){
          app.alert('info', 'ESP Update started.');
        },
        error: function(r){
          app.alert('info', 'Unable to start ESP update.');
        }
      });
    },

    runMk20Update: function(e) {
      var headers = this.getHeaders();
      $.ajax({
        url: 'http://'+profileModel.getSelectedPrinter().ip+'/update_mk20?url=http://static.printrbot.cloud/firmware/simple/mk20.bin',
        cache: false,
        type: 'GET',
        headers: headers,
        success: function(r){
          app.alert('info', 'MK20 Update started.');
        },
        error: function(r){
          app.alert('info', 'Unable to start MK20 update.');
        }
      });
    },
    runUiUpdate: function(e) {
      var headers = this.getHeaders();
      $.ajax({
        url: 'http://'+profileModel.getSelectedPrinter().ip+'/update_ui?url=http://static.printrbot.cloud/firmware/simple/ui.min',
        cache: false,
        type: 'GET',
        headers: headers,
        success: function(r){
          app.alert('info', 'UI Update started.');
        },
        error: function(r){
          app.alert('info', 'Unable to start UI update.');
        }
      });
    },

    formatEsp: function(e) {
      var headers = this.getHeaders();
      $.ajax({
        url: 'http://'+profileModel.getSelectedPrinter().ip+'/format_spiffs',
        cache: false,
        type: 'GET',
        headers: headers,
        success: function(r){
          app.alert('info', 'Formatting ESP memory.');
        },
        error: function(r){
          app.alert('info', 'Unable to start format ESP.');
        }
      });
    },

    render: function() {
      this.$el.html(this.tpl({ profile: profileModel, selectedPrinter: profileModel.getSelectedPrinter()  }));
      var pbv = this.loadView(new PrintrbarView(), 'printrbarview');
      this.$el.find('.header').prepend(pbv.render());
      return this.$el;
    }
  });

  return v;
});
