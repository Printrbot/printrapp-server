define([
  'app',
  'text!templates/sidebar.html',
],

function(
   app,
   Tpl
)
{
    var v = Backbone.View.extend(
    {
        className: 'sidebar',

        events: {
        },

        initialize: function(o)
        {
            this.tpl = _.template(Tpl);
            this.printers = o.printers;
        },

        render: function() {
            this.$el.html(this.tpl({ "printers": this.printers.printers, "selectedView": app.selectedView }));
            return this.$el;
        }
    });

    return v;
});
