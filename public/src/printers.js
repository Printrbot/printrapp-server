define([
    'app',
    'models/printer'
],
function(
    app,
    PrinterModel
)
{
  var m = {

    printers: [],
    scanning: true,

    scan: function(names) {
      // look for printrbot.local,
      // and other names
      this.scanning = true;
      this.trigger("scan");

      console.info('in scan... [[[((((....))))]]]');
      var that = this;
      $.ajax({
        url: 'http://printrbot.local/info',
        cache: false,
        data: {

        },
        type: 'GET',
        /*
        headers: {
          'authorization': 'Bearer '+user.get('jwt')
        },
        */
        success: function(r){
          var _p = new PrinterModel(r);
          that.printers = _.union(that.printers, [_p]);
          that.scanning = false;
          that.trigger("add");
        },
        error: function(r){
          that.scanning = false;
          that.trigger("sync");
        }
      });
    }


  }

  _.extend(m, Backbone.Events);

  return m;
});
