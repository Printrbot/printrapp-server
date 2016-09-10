define([
  'app',
  './ProjectItemModal',
  'text!./templates/project-item-thumb.html'
],

function(
   app,
   ProjectItemModal,
   Tpl
)
{
  var v = Backbone.View.extend(
  {
    className: 'project-item-block col-lg-3 col-md-3 col-sm-4 col-xs-6',
    events: {
      'click .preview-block': 'onThumbClick'
    },
    initialize: function(o)
    {
      var that = this;
      this.tpl = _.template(Tpl);
      this.model = o.model;
      this.project = o.project;
      this.forcereload = false;

      console.info(this.model)

      this.listenTo(app.channel, 'render.completed', function(e) {
        if (!this.model.get('_id')) {
          if (this.model.get('name').toLowerCase() == e.data.name.toLowerCase()) {
            this.model.set(e.data);
            this.render();
          }
        } else {
          if (this.model.get('_id') == e.data._id) {
            this.model.set(e.data);
            this.render();
          }
        }
      }, this)

      this.listenTo(app.channel, 'item.uploaded', function(e) {
        if (!this.model.get('_id')) {
          if (this.model.get('name').toLowerCase() == e.name.toLowerCase()) {
            this.model.set(e);
            this.render();
          }
        } else {
          if (this.model.get('_id') == e._id) {
            this.model.set(e);
            this.render();
          }
        }

        console.info(this.project);
      }, this)
    },

    onThumbClick: function(e)
    {
      var that = this
      , ps = new ProjectItemModal(this.project, this.model);

      ps.open(function(o) {
        // callback
        that.render();
      });
    },

    render: function() {
      this.$el.html(this.tpl({item: this.model, project: this.project }));
      return this.$el;
    }
  });

  return v;
});
