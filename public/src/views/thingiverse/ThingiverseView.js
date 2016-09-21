define([
  'app',
  'models/project',
  'models/session',
  'models/profile',
  'collections/tvcollections',
  './TvCollectionThumbView',
  'text!./templates/thingiverse.html'
],

function(
  app,
  ProjectModel,
  sessionModel,
  profileModel,
  tvCollections,
  TvCollectionThumbView,
  Tpl
)
{

  var v = Backbone.View.extend(
  {
    className: 'thingiverse',
    tvConnected: false,
    tvConnecting: false,

    events: {
      'click div.connect': 'getThingiverseAccess'
    },

    getThingiverseAccess: function(e) {
      window.location = "https://www.thingiverse.com/login/oauth/authorize?client_id=47698f5cb23b75a453ca&t=" + sessionModel.get('jwt');
    },

    initialize: function(o) {
      this.tpl = _.template(Tpl);
      this.listenTo(tvCollections, 'sync', function(e) {
        this.tvConnected = true;
        this.tvConnecting = false;
        this.render();
      }, this);

      if (profileModel.get('thingiverse_token')) {
        this.tvConnecting = true;
        tvCollections.fetch();
      }
    },

    render: function() {
      this.$el.html(this.tpl({ profile: profileModel, tvConnected: this.tvConnected, tvConnecting: this.tvConnecting  }));

      var co = this.$el.find('.tv-collections');
      if (tvCollections.models.length > 0) {
        _.each(tvCollections.models, function(c) {
          var v = this.loadView(new TvCollectionThumbView({'model':c, ctype: 'collection'}), 'tvc'+c.cid);
          co.append(v.render());
        }, this);
      }

      return this.$el;
    }
  });

  return v;
});
