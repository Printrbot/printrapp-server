define([
  'app',
  'text!templates/printers/extruder-control-panel.html'
],

function(
   app,
   Tpl
)
{

    var v = Backbone.View.extend(
    {
        className: 'extruder-control-panel',

        events:
        {
          'click .btn-set-extruder-temperature': 'onSetExtruderTemperature',
          'click button.btn-extrude': 'onExtrude',
          'click button.btn-retract': 'onRetract',
        },

        initialize: function(o)
        {
          this.tpl = _.template(Tpl);
          this.printer = o;

          this.listenTo(app.channel, 'printer.message', function(e) {
            if (e.data && e.data.m && e.data.m == 'M109' && this.printer.get('sn') == e.printer.sn)
              this.updateHeadTemperature(e.data);
          }, this);

        },

        updateHeadTemperature: function(e)
        {
            $('.extruder-temperature').html(e.d.c + "&deg;C")
            $('.extruder-temperature-target').val(e.d.s)
        },

        onSetExtruderTemperature: function(e)
        {
            var temp = parseFloat($('input.extruder-temperature-target').val());
            if (isNaN(temp))
              // todo: show red outline as error
              return;
            app.printer.send(this.printer.get('sn'), {m: 'gc',  d: 'M109 S'+temp});
            $('.extruder-temperature').html('<i class="fa fa-refresh fa-spin"></i>');
        },

        onExtrude: function(e)
        {
          var el = parseFloat($('.extruder-filament-length').val());
          app.printer.send(this.printer.get('sn'), {m: 'gc',  d: 'G92E0\nG1 F150 E'+el+'\nG92E0'});
        },

        onRetract: function(e)
        {
          var el = parseFloat($('.extruder-filament-length').val());
          app.printer.send(this.printer.get('sn'), {m: 'gc',  d: 'G92E0\nG1 F150 E-'+el+'\nG92E0'});
        },

        render: function()
        {
            this.$el.html(this.tpl({ printer: this.printer, status: app.connectedPrinter }));
            return this.$el;
        }
    });

    return v;
});
