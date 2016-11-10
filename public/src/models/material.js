define([
    'app'
],
function(
    app
)
{
    var m = Backbone.Model.extend(
    {
        defaults: {
          "name": "",
          "type": "",
          "brand": "",
          "print_temperature": 200,
          "speed": 1,
          "fan": true,
          "retraction": true
        },

        initialize: function()
        {
        }
    })

    return m;
});
