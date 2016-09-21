define([
  'app',
  'models/tvcollection',
  'models/session',
  'models/profile'
],

function(
  app,
  TvCollectionModel,
  sessionModel,
  profileModel
)
{
  var c = Backbone.Collection.extend({

    model: TvCollectionModel,
    sync: app.syncTv,

    initialize: function() {

      //url:
    },

    fetch: function(options) {
      var t = profileModel.get('thingiverse');
      if (!t) return false;
      var tid = t.id;
      this.url = 'https://api.thingiverse.com/users/' + t.id + '/collections';
      return Backbone.Collection.prototype.fetch.call(this, options);
    },

    parse: function(response) {
      var c = [];

      _.each(response, function(r) {
        c.push(new TvCollectionModel(r))
      })

      /*
      this.comparator = function(model) {
        return -model.get('id');
      }

      // call the sort method
      this.sort();
      */

      return c;
    },
  });

  return new c;
});
