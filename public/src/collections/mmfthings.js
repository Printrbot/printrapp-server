define([
  'app',
  'models/mmfthing',
  'models/session',
  'models/profile'
],

function(
  app,
  MMFThingModel,
  sessionModel,
  profileModel
)
{
  var c = Backbone.Collection.extend({

    model: MMFThingModel,
    url: '/api/mmfactory/collection/',
    id: null,
    sync: app.sync,

    fetch: function(options) {
      //debugger
      this.url += app.selectedMMFactoryCollection;
      return Backbone.Collection.prototype.fetch.call(this, options);
    },

    initialize: function() {
      //url:
    },

    parse: function(response) {
      debugger
      var c = [];
      _.each(response, function(r) {
        c.push(new MMFThingModel(r))
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
