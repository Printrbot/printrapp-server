define([
  'app',
  'text!templates/printers/jog-control-panel.html'
],

function(
   app,
   Tpl
)
{

    var v = Backbone.View.extend(
    {
        className: 'jog-control-panel',

        events:
        {
          'click .jog-buttons button': 'onJogPress',
          'click button.jog-toggle': 'onToggleJog',
          'click .jog-size button': 'onJogSize'
        },

        initialize: function(o)
        {
          this.tpl = _.template(Tpl);
          this.printer = o;
          this.jogSize = 1;
        },

        onJogPress: function(e)
        {
            var c =  $(e.currentTarget).attr('m');
            if (c == 'hxy') {
              app.printer.send(this.printer.get('sn'), {m: 'gc',  d: 'G28X0Y0'});
            }
            else if (c == 'hz') {
              app.printer.send(this.printer.get('sn'), {m: 'gc',  d: 'G28Z0'});
            } else {
              c = c.replace("+","").toUpperCase();
              app.printer.send(this.printer.get('sn'), {m: 'gc',  d: 'G91\nF1000G0'+c+this.jogSize+'\n'});

            }
            console.info(c);
        },

        onJogSize: function(e)
        {
            e.preventDefault();
            e.stopPropagation();
            this.jogSize = $(e.currentTarget).html();
            $('.jog-size button').removeClass('active');
            $(e.currentTarget).addClass('active');
        },

        render: function()
        {
            this.$el.html(this.tpl({ printer: this.printer, jogSize: this.jogSize, status: app.connectedPrinter }));
            return this.$el;
        }
    });

    return v;
});
