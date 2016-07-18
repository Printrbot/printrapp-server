define([
  'app',
  'bootstrap',
  'models/session',
  'views/printers/ExtruderControlPanel',
  'views/printers/JogControlPanel',
  'views/printers/PrintJobPanel',
  'text!templates/printers/printer-control-panel.html',
  'text!templates/printers/printer-job-panel.html'
],

function(
   app,
   bootstrap,
   sessionModel,
   ExtruderControlPanel,
   JogControlPanel,
   PrintJobPanel,
   ControlTpl,
   JobTpl
)
{

    var v = Backbone.View.extend(
    {
        className: 'printer-settings-panel',

        events:
        {
          'click button.test': 'sendTest',

          'click button.pause-job': 'onPause',
          'click button.cancel-job': 'onCancelJob',

          'click .toggle-fan': 'onToggleFan',

          'click button.printer-settings': 'onEditPrinter',
          'change #extruder': 'onExtruderChange',

          'click a.select-files': 'onSelectFiles',
          'click a.select-jog': 'onSelectJog',
          'click a.select-temperature': 'onSelectTemperature'
        },

        initialize: function(o)
        {
          this.printer = o.printer;
          this.ctrlTpl = _.template(ControlTpl);
          this.jobTpl = _.template(JobTpl);
          this.listenTo(app.channel, 'printers.list', this.onPrintersList);
          //this.listenTo(app.channel, 'printer.update', this.onPrinterUpdate);
          this.connecting = false;
          this.jogSize = 1;
          this.extruderPanel = true;
          this.jogPanel = true;
          this.selectedPrinterView = "jog";

          // fetch files
          //app.printer.send(this.printer.get('sn'), {m: 'listfiles'});

/*
          setInterval(function(){
            app.io.emit('printer.info');
          }, 3000);

          */

        },

        onSelectFiles: function(e) {
          this.selectedPrinterView = "files";
          this.render();
        },

        onSelectJog: function(e) {
          this.selectedPrinterView = "jog";
          this.render();
        },

        onSelectTemperature: function(e) {
          this.selectedPrinterView = "temperature";
          this.render();
        },

        onPrinterConnected: function(e)
        {
          this.printer.connecting(false);
          this.render();
        },

        onPrintersList: function(e)
        {
            this.render();
        },

        onPrinterUpdate: function(e)
        {
            //console.info('got printer update', app.connectedPrinter.changed)
            // only re-render the whole panel on connect and disconnect
            var _render = false;
            _.each(app.connectedPrinter.changed, function(c) {
                if (_.contains(['all', 'connected', 'paused', 'preheating', 'jobLineCount', 'jobLineProcessed', 'printing'], c))
                  _render = true;
            }, this)
            if (app.connectedPrinter.preheating)
              _render = true;

            if (_render)
              this.render();
        },

        onToggleJog: function(e)
        {
            var j = $('.jog');
            if (j.is(':visible')) {
              j.addClass('hidden');
              $(e.currentTarget).removeClass('active');
              this.jogPanel = false;
            } else {
              $(e.currentTarget).addClass('active');
              j.removeClass('hidden')
              this.jogPanel = true;
            }
        },

        onToggleExtruder: function(e)
        {
            var j = $('.extruder');
            if (j.is(':visible')) {
              j.addClass('hidden');
              $(e.currentTarget).removeClass('active');
              this.extruderPanel = false;
            } else {
              $(e.currentTarget).addClass('active');
              j.removeClass('hidden')
              this.extruderPanel = true;
            }
        },



        onChangeFilament: function(e)
        {
            app.alert('error', 'not done');
            app.client.broadcast({message: 'printer.command',  data: { id: this.printer.get('_id'), command:'G91\nG0Z3\nG90\nG1X50Y50' }})
        },

        onPrinterUnavailable: function(e)
        {
            app.alert('error', "Printer is not available" )
            console.info(e);
        },

        onPause: function()
        {
            app.client.broadcast({message: 'printer.pause-job',  data: { id: this.printer.get('_id') }})

        },

        onCancelJob: function()
        {
            app.client.broadcast({message: 'printer.cancel-job',  data: { id: this.printer.get('_id') }})
        },

        onToggleFan: function()
        {
            var action = this.getStatus().fanOn ? 'fanOff' : 'fanOn';

            app.client.broadcast({message: 'printer.action', data: { id: this.printer.get('_id'), action: action }})
        },

        onParkHead: function()
        {
            app.client.broadcast({message: 'printer.command',  data: { id: this.printer.get('_id'), command:'G91\nG0Z1\nG28X0Y0\nG90' }})
        },

        onExtruderChange: function(e)
        {
            var ext = "T" + $(e.currentTarget).val();
            app.client.broadcast({message: 'printer.command',  data: { id: this.printer.get('_id'), command: ext }})
        },

        connectPrinter: function()
        {
            //app.client.send(userModel.getId(), 'testing...');
            app.client.broadcast({message: 'printer.connect', data: this.printer.get('_id')})
            this.printer.connecting(true);

            this.render();
            app.alert('info', 'connecting to printer...');

            // set timeout to check if printer replied
            var that = this;
            this.timeout = setTimeout(function() {
              that.printer.connecting(false);
              if (!that.printer.connected()) {
                app.alert('error', 'unable to connect to printer');
                that.render();
              }
            }, 3000);
        },

        disconnectPrinter: function()
        {
            app.client.broadcast({message: 'printer.disconnect', data: this.printer.get('_id')})
        },

        render: function()
        {
          this.$el.html(this.ctrlTpl({ printer: this.printer, subview: this.selectedPrinterView }));
          var b = this.$el.find('.panel-body');

          if (this.selectedPrinterView == "files") {

          }
          else if (this.selectedPrinterView == "jog") {
            var jp = this.loadView(new JogControlPanel(this.printer), 'jog-control-panel');
            b.append(jp.render());
          }
          else if (this.selectedPrinterView == "temperature") {
            var ep = this.loadView(new ExtruderControlPanel(this.printer), 'extruder-control-panel');
            b.append(ep.render());
          }

/*
            if (s && s.printing && s.job != null) {

              var bp = this.loadView(new PrintJobPanel(this.printer), 'print-job-panel');
              this.$el.append(bp.render());

              if (s.paused) {
                this.$el.append(ep.render());
                //this.$el.append(jp.render());
              }
            }
            else {
              if (s) {
                this.$el.append(ep.render());
                var jp = this.loadView(new JogControlPanel(this.printer), 'jog-control-panel');
                this.$el.append(jp.render());
              }
            }
            */




            //var jp = this.loadView(new JogControlPanel(this.printer), 'jog-control-panel');
            //b.append(jp.render());
            this.$el.find('[data-toggle="tooltip"]').tooltip()
            return this.$el;
        }
    });

    return v;
});
