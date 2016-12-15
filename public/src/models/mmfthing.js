define([
    'app'
],
function(
    app
)
{
    var m = Backbone.Model.extend(
    {
      id: null,
      url: '/api/mmfactory/thing/',
      sync: app.sync,

      initialize: function() {

      },

      fetch: function(options) {
        //debugger
        this.url += app.selectedMMFactoryThing;
        return Backbone.Collection.prototype.fetch.call(this, options);
      },

      parse: function(response) {
        debugger
        return response;
      }
    })

    return m;
});
