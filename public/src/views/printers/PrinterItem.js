define([
  'app',
  'text!templates/printers/printer-item.html'
],

function(
   app,
   Tpl
)
{

    var v = Backbone.View.extend(
    {
        className: 'printer-item',

        events:
        {
          'click': function() {
            app.channel.trigger('printer.selected', this.printer);
          }
        },

        initialize: function(o)
        {
          this.tpl = _.template(Tpl);
          this.printer = o.printer;
          this.selected = (o.selectedPrinter && o.selectedPrinter.get('sn') == this.printer.get('sn')) ? true : false;
        },

        render: function()
        {
          if (this.selected)
            this.$el.addClass("active");

          return this.$el.html(this.tpl({"printer": this.printer, "selected": this.selected}));
        }
    });

    return v;
});
