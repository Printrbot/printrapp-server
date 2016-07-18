define([
  'app',
  'models/project'
],

function(
  app,
  ProjectModel
)
{
    var c = Backbone.Collection.extend({

        url: '/api/projects',
        model: ProjectModel,
        sync: app.sync,

        parse: function(response)
        {
          var projects = [];
          _.each(response.rows, function(r) {
            projects.push(new ProjectModel(r.value))
          })

          this.comparator = function(model) {
              return -model.get('created_at');
          }

          // call the sort method
          this.sort();

          return projects;
        },
    });

    return new c;
});
