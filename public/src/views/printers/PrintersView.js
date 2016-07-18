define([
  'app',
  'printers',
  'models/printer',
  'models/profile',
  'models/session',
  'views/printers/PrinterControlPanel',
  'views/printers/PrinterItem',
  'text!templates/printers/printers.html'
],

function(
   app,
   printers,
   PrinterModel,
   profileModel,
   userModel,
   PrinterControlPanel,
   PrinterItem,
   Tpl
)
{

    var v = Backbone.View.extend(
    {
        className: 'printers ',

        events:
        {
            'click button.define-printer': 'definePrinter',
        },

        initialize: function(o)
        {
            this.tpl = _.template(Tpl);
console.info('here');
            this.listenTo(printers, 'all', function(e) {
              this.render();
              console.info(e);
            }, this);


        },

        definePrinter: function(e)
        {
            e.preventDefault();
            e.stopPropagation();
            var that = this
              , p = new EditPrinterModal();

            p.open(function(o)
            {
              o.set({"user": userModel.getId()});
              o.save();
              that.render();
              app.alert('info', 'printer added');
            });
        },

        render: function()
        {
          var that = this;
            this.$el.html(this.tpl({printers:printers}));

            var ps = this.$el.find('.plist');
            var pc = this.$el.find('.pctrl');

/*
            printersCollection.each(function(printer) {
              var p = that.loadView(new PrinterItem({printer: printer, selectedPrinter: app.selectedPrinter}), 'pitem'+printer.cid);
              ps.append(p.render());
            });

            if (printersCollection.length == 0) {
              ps.append('<div class="alert alert-info">No printers connected</div>')
            }

            if (printers.printers.length > 0) {
              app.selectedPrinter = printers.printers[0];
              ps.addClass('col-xs-6');
              pc.addClass('col-xs-6');
              pc.html(that.loadView(new PrinterControlPanel({printer: app.selectedPrinter}), 'pctrl').render());
            }
*/
            return this.$el;
        }
    });

    return v;
});
