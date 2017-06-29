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
      type: 'project_item',
      ftype: 'stl',
      resolution: 'standard',
      infill: 'standard',
      support: false,
      brim: false
    },

    initialize: function(o)
    {
      if (o.project) {
        this.urlRoot = this.urlRoot.replace(':pid', o.project);
      }
    }
  })

  return m;
});
