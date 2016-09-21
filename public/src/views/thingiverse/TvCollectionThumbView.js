define([
  'app',
  'text!./templates/collection-thumb.html'
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
          this.ctype = o.ctype;
        },

        onThumbClick: function(e) {
          var pid = $(e.currentTarget).attr('idx');
          if (pid) {

            if (this.ctype == 'collection') {
              Backbone.history.navigate('thingiverse/collection/'+pid, true)
            } else if (this.ctype == 'thing') {
              Backbone.history.navigate('thingiverse/thing/'+pid, true);
            }
          }
        },

        render: function() {
            this.$el.html(this.tpl({collection: this.model, forcereload: this.forcereload }));

            this.$el.find('.preview-block img').on('error', function(i) {
              // just set unknown image
              $(i.currentTarget).attr("src", "/images/noimage_thumb.png");
            })

            return this.$el;
        }
    });

    return v;
});
