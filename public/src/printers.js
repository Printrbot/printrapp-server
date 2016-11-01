define([
    'app',
    'models/profile'
],
function(
    app,
    profileModel
)
{
  var m = {

    printers: [],

    scan: function(names) {
      // look for printrbot.local,
      // and other names
      _.each(profileModel.get('printers'), function(p) {
        p.status = 'unavailable';
        this._getStatus(p);
      }, this)

      console.info('in scan... [[[((((....))))]]]');
    },

    _getStatus: function(p) {

      var that = this;
      var _headers = {};

      if (p.password.length > 0) {
        _headers.Authorization ="Basic " + p.password;
      }

      $.ajax({
        url: 'http://'+p.ip+'/info',
        cache: false,
        type: 'GET',
        headers: _headers,
        success: function(r){
          p.info = r;
          p.status = 'online';
          profileModel.trigger('change', profileModel);
        },
        error: function(r){
          p.status = 'unavailable';
          profileModel.trigger('change', profileModel);
        }
      });
    }


  }

  _.extend(m, Backbone.Events);

  return m;
});
