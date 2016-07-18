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

            this.listenTo(this.printers, 'all', function(e) {
              this.render();
            }, this);
            this.listenTo(app.channel, 'printer.disconnected', function(p) {
              this.printers.fetch();
            }, this)

            this.listenTo(app.channel, 'printer.connected', function(p) {
              this.printers.fetch();
            }, this)
        },

        render: function() {
            this.$el.html(this.tpl({ "printers": this.printers.printers, "selectedView": app.selectedView }));
            return this.$el;
        }
    });

    return v;
});
