define([
    'app'
],
function(
    app
)
{
    var m = Backbone.Model.extend(
    {
        urlRoot: '/api/printer-types/',
        id: 'printer-types',

        defaults: {

        },

        filterByType: function(model)
        {
          var p = null;
          _.each(this.get('current'), function(m) {
              if (m.model == model)
                p = m;
          })
          _.each(this.get('old'), function(m) {
              if (m.model == model)
                p = m;
          })
          return p;
        },

        getSettingsByType: function(model)
        {
          var p = this.filterByType(model);

          if (p) {
            return  {
              model: model,
              x: p.settings[0],
              y: p.settings[1],
              z: p.settings[2],
              nozzle_size: p.settings[3],
              filament_diameter: p.settings[4],
              autolevel: p.settings[5],
              heated_bed: p.settings[6]
            }
          }
        },

        initialize: function()
        {

        }
    })

    return new m;
});
