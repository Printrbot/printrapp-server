define([
  'app',
  'text!./templates/thing-thumb.html'
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

        ctype: 'collection',

        initialize: function(o)
        {
          var that = this;
          this.tpl = _.template(Tpl);
          this.model = o.model;
          this.forcereload = false;
        },

        onThumbClick: function(e) {
          app.selectedMMFThing = this.model.get('id');
          Backbone.history.navigate('mmfactory/thing/'+app.selectedMMFThing, true)
        },

        render: function() {
            this.$el.html(this.tpl({thing: this.model, forcereload: this.forcereload }));

            this.$el.find('.preview-block img').on('error', function(i) {
              // just set unknown image
              $(i.currentTarget).attr("src", "/images/noimage_thumb.png");
            })

            return this.$el;
        }
    });

    return v;
});
