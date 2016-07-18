define([
  'app',
  'moment',
  'models/profile',
  'models/session',
  'collections/jobs',
  'text!templates/jobs/jobs.html'
],

function(
   app,
   moment,
   profileModel,
   userModel,
   printJobs,
   Tpl
)
{

    var v = Backbone.View.extend(
    {
        className: 'jobs',

        events:
        {

        },

        initialize: function(o)
        {
            this.tpl = _.template(Tpl);

            this.listenTo(printJobs, 'all', function(e) {
              if (_.indexOf(['sync', 'destroy', 'add'], e) != -1) {
                this.render();
              }
            }, this);

            this.listenTo(app.channel, 'slicing.completed', function(e) {
            _.each(printJobs.models, function(j) {
                if (j.get('_id') == e._id) {
                  j.set({'status':'ready', 'gcode':e.gcode});
                }
            })
            this.render();
          }, this)

          this.tpl = _.template(Tpl);

          printJobs.fetch();

        },

        onDeleteJob: function(e)
        {
            var printJob = _.find(printJobs.models, function(m) {
                return m.get('_id') == $(e.currentTarget).attr('idx');
            }, this)
            printJob.destroy();
        },

        onDownloadJob: function(e)
        {
          var printJob = _.find(printJobs.models, function(m) {
              return m.get('_id') == $(e.currentTarget).attr('idx');
          }, this)
          window.location = printJob.attributes.gcode;
        },


        render: function()
        {
          var jobs = printJobs.models;

          this.$el.html(this.tpl({ jobs: jobs, printer: app.selectedPrinter, moment: moment }));

          this.$el.find('[data-toggle="tooltip"]').tooltip()
          return this.$el;
        }
    });

    return v;
});
