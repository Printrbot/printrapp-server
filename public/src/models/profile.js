define([

],
function(
)
{
    var m = Backbone.Model.extend(
    {
        urlRoot: '/api/profile/',
        id: null,

        defaults: {
          first_name: null,
          last_name: null,
          printers: []
        },

        initialize: function()
        {

        },

        addPrinter: function(printer)
        {
          var p = this.get('printers');
          p.push(printer);
          this.set({printers: p});
        }

    })

    return new m();
});
