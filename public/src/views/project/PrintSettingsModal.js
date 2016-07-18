define([
    'app',
    'models/print_profile',
    'models/session',
    'printers',
    'text!templates/project/print-settings-modal.html',
],
function(
    app,
    printProfile,
    sessionModel,
    printers,
    Tpl
)
{
    var v = Backbone.View.extend(
    {
        events:
        {
           'click button.cancel-print-job': 'cancel',
           'click button.run-print-job': 'preparePrint'
           //'change select.material': 'onMaterialChange',
        },

        initialize: function(pm)
        {
            this.project = pm;
            this.template = _.template(Tpl);
        },

        open: function(callback)
        {
            $('body').append(this.render());
            $('#print-job').modal();
            var t = this;
            $('#print-job').on('hidden.bs.modal', function () {
              t.remove();
            })
            this.callback = callback;
        },

        preparePrint: function(e)
        {
            var project_id = this.project.get('_id');
            var profile = printProfile.defaults;

            var printer;
            if (printers.printers.length == 1) {
              printer = printers.printers[0];
            } else {
              // if more then one printer is available,
              // use the one selected in GUI
              //TODO
            }

            var that = this;

            // override print profile
            profile["print-center"] = (printer.get('x')/2 + ',' + printer.get('y')/2)

            // override the nozzle size
            profile["nozzle-diameter"] = printer.get('nozzle_size');

            // override filament diameter
            profile["filament-diameter"] = printer.get('filament_diameter');

            // quality
            var quality = $('.quality').val();
            if (quality == 'standard')
              profile["layer-height"] = 0.2;
            else if (quality == 'low')
              profile["layer-height"] = 0.3;
            if (quality == 'high')
                profile["layer-height"] = 0.1;

            // material
            var mat = printProfile.materials[$('.material').val()];
            _.each(mat, function(m,k) {
                profile[k] = m;
            }, this);

            // infill
            var infill = $('.infill').val();
            if (infill == 'light')
              profile["fill-density"] = 5;
            else if (infill == 'standard')
                profile["fill-density"] = 15;
            else if (infill == 'medium')
                profile["fill-density"] = 40;
            else if (infill == 'heavy')
                    profile["fill-density"] = 60;

            // support
            if ($('.print-support').is(':checked')) {
              _.each(printProfile.support, function(m,k) {
                  profile[k] = m;
              }, this);
            }
            // brim
            if ($('.print-brim').is(':checked')) {
                profile['brim-width'] = 5;
            }

            $.ajax({
              url: app.hostUrl + '/api/job/'+project_id,
              cache: false,
              data: {
                  profile: profile,
                  material: $('.material').val(),
                  quality: $('.quality').val(),
                  support: $('.print-support').is(':checked'),
                  infill: infill,
                  brim: $('.print-support').is(':checked'),
                  printer: printer.get('serial'),
                  created_at: new Date().toJSON()
              },

              //contentType: false,
              //processData: false,
              type: 'POST',
              headers: {
                'authorization': 'Bearer '+sessionModel.get('jwt')
              },
              success: function(r){
                app.alert('info', 'Print job created')
                //Backbone.history.navigate('printers', true);
                that.removeModal();
              },
              error: function(r){
                app.alert('error', 'unable to create print job')
                that.removeModal();
              }
            });
        },

        cancel: function()
        {
            this.removeModal();
        },

        removeModal: function()
        {
            $('#print-job').modal('hide');
        },

        render: function()
        {
            var that = this;

            this.$el.html(this.template({
              profile: printProfile,
              printers: printers
            }));

            return this.el;
        }
    });

    return v;
});
