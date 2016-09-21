define([
  'app',
  'models/project',
  'models/session',
  'models/profile',
  'models/tvcollection',
  'collections/tvthings',
  './TvCollectionThumbView',
  'text!./templates/thingiverse-collection.html'
],

function(
  app,
  ProjectModel,
  sessionModel,
  profileModel,
  TvCollectionModel,
  tvCollectionThings,
  TvCollectionThumbView,
  Tpl
)
{

  var v = Backbone.View.extend(
  {
    className: 'thingiverse-collection',

    events: {

    },

    initialize: function(o) {
      this.tpl = _.template(Tpl);
      tvCollectionThings.reset();

      this.collectionModel = new TvCollectionModel();
      this.collectionModel.fetch();

      this.listenTo(tvCollectionThings, 'sync', function(e) {
        this.render();
      }, this);

      tvCollectionThings.fetch();
    },

    render: function() {
      this.$el.html(this.tpl({ things: tvCollectionThings, collection: this.collectionModel  }));

      var co = this.$el.find('.tv-projects');

      if (tvCollectionThings.models.length > 0) {
        _.each(tvCollectionThings.models, function(c) {
          var v = this.loadView(new TvCollectionThumbView({'model':c, 'ctype':'thing'}), 'tvcp'+c.cid);
          co.append(v.render());
        }, this);
      }

      return this.$el;
    }
  });

  return v;
});
