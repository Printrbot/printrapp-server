define([
  'app',
  'text!./templates/project-thumb.html'
],

function(
   app,
   Tpl
)
{

    var v = Backbone.View.extend(
    {
        className: 'project-block col-lg-2 col-md-3 col-sm-3 col-xs-6',

        events: {
          'click .preview-block': 'onThumbClick'
        },

        initialize: function(o)
        {
            var that = this;
            this.tpl = _.template(Tpl);
            this.model = o.model;
            this.forcereload = false;
            /*
            this.listenTo(app.channel, 'render.completed', function(e) {
              if (!this.model.get('_id')) {
                if (this.model.get('originalname').toLowerCase() == e.data.originalname.toLowerCase()) {
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
            */

            /*
            this.listenTo(this.model, 'change:_id', function() {
              debugger;
              that.render();
            })
            */
        },

        onThumbClick: function(e)
        {

          var pid = $(e.currentTarget).attr('idx');

          if (pid)
            Backbone.history.navigate('project/'+pid, true)

        },

        render: function() {
            this.$el.html(this.tpl({project: this.model, forcereload: this.forcereload }));

            this.$el.find('.preview-block img').on('error', function(i) {
              // just set unknown image
              $(i.currentTarget).attr("src", "/images/noimage_thumb.png");
            })

            return this.$el;
        }
    });

    return v;
});
