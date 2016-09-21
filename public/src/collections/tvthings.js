define([
  'app',
  'models/tvthing',
  'models/session',
  'models/profile'
],

function(
  app,
  TvThingModel,
  sessionModel,
  profileModel
)
{
  var c = Backbone.Collection.extend({

    model: TvThingModel,
    sync: app.syncTv,

    initialize: function() {
      //url:
    },

    fetch: function(options) {
      this.url = 'https://api.thingiverse.com/collections/' + app.selectedThingiverseCollection+'/things';
      return Backbone.Collection.prototype.fetch.call(this, options);
    },

    parse: function(response) {
      var c = [];
      _.each(response, function(r) {
        c.push(new TvThingModel(r))
      })

      this.comparator = function(model) {
        return -model.get('id');
      }

      // call the sort method
      this.sort();

      return c;
    },
  });

  return new c;
});
