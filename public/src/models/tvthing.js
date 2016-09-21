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
      sync: app.syncTv,
      initialize: function() {

      },

      fetch: function(options) {
        this.url = 'https://api.thingiverse.com/things/' + app.selectedThingiverseThing;
        return Backbone.Model.prototype.fetch.call(this, options);
      }
    })

    return m;
});
