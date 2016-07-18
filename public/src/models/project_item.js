define([
    'app'
],
function(
    app
)
{
  var m = Backbone.Model.extend(
  {
    urlRoot: '/api/project/:pid/item',
    id: null,
    sync: app.sync,

    defaults: {
      type: 'project_item'
    },

    initialize: function(o)
    {

    }
  })

  return m;
});
