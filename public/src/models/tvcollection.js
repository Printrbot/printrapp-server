define([
    'app'
],
function(
    app
)
{
    var m = Backbone.Model.extend(
    {
      //urlRoot: '/api/project/',
      id: null,
      sync: app.syncTv,

      initialize: function(o) {

      },

      fetch: function(options) {
        this.url = 'https://api.thingiverse.com/collections/' + app.selectedThingiverseCollection;
        return Backbone.Model.prototype.fetch.call(this, options);
      }

    })

    return m;
});
