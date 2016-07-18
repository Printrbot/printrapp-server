define([
    'app'
],
function(
    app
)
{
    var m = Backbone.Model.extend(
    {
        //urlRoot: 'http://printrbot.local',
        id: null,

        initialize: function()
        {

        },

        defaults: {
            x: 100,
            y: 100,
            z: 100,
            heated_bed: false,
            nozzle_size: 0.4,
            files: []
        }
    })

    return m;
});
