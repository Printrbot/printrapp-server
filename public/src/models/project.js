define([
    'app',
    './project_item'
],
function(
    app,
    ProjectItem
)
{
    var m = Backbone.Model.extend(
    {
        urlRoot: '/api/project/',
        id: null,
        sync: app.sync,

        defaults: {
            type: 'project',
            items: []
        },

        parse: function(d) {
          var items = [];
          _.each(d.items, function(i) {
            items.push(new ProjectItem(i));
          })
          d.items = items;
          return d;
        },

  

        initialize: function()
        {

        }
    })

    return m;
});
