define([
  'app',
  'text!templates/printers/printer-job-panel.html'
],

function(
   app,
   Tpl
)
{

    var v = Backbone.View.extend(
    {
        className: 'print-job-panel',

        events:
        {

        },

        initialize: function(p)
        {
          this.tpl = _.template(Tpl);
          this.printer = p;
          this.listenTo(app.channel, 'printer.update', this.onPrinterUpdate);
        },

        onPrinterUpdate: function(e)
        {
          //  console.info(app.connectedPrinter.changed);
            _.each(app.connectedPrinter.changed, function(c) {
              if (c == 'paused')
                this.render();
            }, this)
        },


        render: function()
        {
            var s = app.connectedPrinter;
            var pr = Math.floor((100/s.jobLineCount) * s.jobLineProcessed);
            this.$el.html(this.tpl({ printer: this.printer, status: s, progress: pr }));
            return this.$el;
        }
    });

    return v;
});
