define([
  'app',
  'models/project',
  'models/session',
  'models/profile',
  'models/mmfcollection',
  'models/mmfthing',
  './MMFThingThumbView',
  'text!./templates/mmfactory-collection.html'
],

function(
  app,
  ProjectModel,
  sessionModel,
  profileModel,
  MMFCollection,
  MMFThingModel,
  MMFThingThumbView,
  Tpl
)
{

  var v = Backbone.View.extend(
  {
    className: 'mmfactory-collection',

    events: {

    },

    initialize: function(o) {
      this.tpl = _.template(Tpl);
      this.mmfcollection = new MMFCollection();

      this.listenTo(this.mmfcollection, 'sync', function(e) {
        this.render();
      }, this);

      this.mmfcollection.fetch();
    },

    render: function() {
      this.$el.html(this.tpl({ collection: this.mmfcollection }));

      var co = this.$el.find('.mmf-things');

      var things = this.mmfcollection.get('objects');

      if (things && things.length > 0) {
        _.each(things, function(c) {
          var m = new MMFThingModel(c);
          var v = this.loadView(new MMFThingThumbView({'model': m}), 'mmfthumb-'+c.id);
          co.append(v.render());
        }, this);
      }
      
      return this.$el;
    }
  });

  return v;
});
