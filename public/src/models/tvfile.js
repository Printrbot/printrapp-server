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
      initialize: function() {

      },
/*
      fetch: function(options) {
        this.url = 'https://api.thingiverse.com/thing/' + app.selectedThingiverseThing + '/files'
        return Backbone.Model.prototype.fetch.call(this, options);
      }
      */
    })

    return m;
});
