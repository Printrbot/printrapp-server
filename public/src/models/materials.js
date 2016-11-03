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
        urlRoot: '/api/materials/',
        id: 'materials',
        sync: app.sync,

        defaults: {
            type: 'material',
            items: []
        },

        parse: function(d) {
          
          /*
          var items = [];
          _.each(d.items, function(i) {
            items.push(new ProjectItem(i));
          })
          d.items = items;
          return d;
          */
          return d;
        },

        initialize: function()
        {

        }
    })

    return new m();
});
