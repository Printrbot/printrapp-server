define([
    'app'
],
function(
    app
)
{
    var m = Backbone.Model.extend(
    {
        urlRoot: '/api/job/',
        sync: app.sync,

        defaults: {
          type: 'job'
        },

        initialize: function()
        {

        }
    })

    return m;
});
