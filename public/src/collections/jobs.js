define([
  'app',
  'models/job'
],

function(
  app,
  JobModel
)
{
    var c = Backbone.Collection.extend({
        url: '/api/jobs',
        sync: app.sync,
        model: JobModel,

        parse: function(response)
        {
          var jobs = [];
          _.each(response.rows, function(r) {
            r.value.id = r.id;
            jobs.push(new JobModel(r.value))
          })

          this.comparator = function(model) {
              //return -model.get('created_at');
              return -(new Date(model.get('created_at')).getTime());
          }

          return jobs;
        },
    });

    return new c;
});
