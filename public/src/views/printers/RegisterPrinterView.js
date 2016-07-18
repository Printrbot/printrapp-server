define([
  'app',
  'models/session',
  'text!templates/printers/register-printer.html'
],
function(
  app,
  user,
  Tpl
)
{
  var v = Backbone.View.extend(
  {
    initialize: function(o)
    {
        var that = this;
        this.tpl = _.template(Tpl);
        this.register_code = null;

        // request registration token from the server
        $.ajax({
          url: app.hostUrl + '/api/printer/register-token',
          cache: false,
          data: {

          },
          type: 'GET',
          headers: {
            'authorization': 'Bearer '+user.get('jwt')
          },
          success: function(r){
            that.register_code = r;
            that.render();
          },
          error: function(r){
            app.alert('error', 'Unable to fetch registration token from the server')
          }
        });


    },

    render: function() {
      console.info(user);
      this.$el.html(this.tpl({register_code: this.register_code}));
        //console.info(jade)
      return this.$el;
    }

  });

  return v;

})
