define([
  'app',
  'bootbox',
  'models/project',
  'models/session',
  'models/profile',
  'models/mmfthing',
  'text!./templates/mmfactory-thing.html'
],

function(
  app,
  bootbox,
  ProjectModel,
  sessionModel,
  profileModel,
  MMFThingModel,
  Tpl
)
{

  var v = Backbone.View.extend(
  {
    className: 'mmfactory-thing',

    events: {
      'click button.mmflink': 'gotoMMFactory',
      'click button.import-thing': 'importThing'
    },

    initialize: function(o) {

      this.tpl = _.template(Tpl);
      //mmfThingFiles.reset();

      this.model = new MMFThingModel();

      this.listenTo(this.model, 'sync', function(e) {
        this.render();
      }, this);

      this.model.fetch();
    },

    gotoMMFactory: function() {
      window.location = 'https://myminifactory.com/object/' + this.model.get('url');
    },

    importThing: function(e) {
      e.preventDefault();
      e.stopPropagation();
      var b = $(e.currentTarget);
      b.html('<img src="/images/ajax-loader.gif"/> Importing...');

      $.ajax({
        url: app.hostUrl + '/api/mmfactory/importthing',
        cache: false,
        dataType: 'json',
        data: {
          thing: this.model.attributes
        },
        //contentType: false,
        //processData: false,
        type: 'POST',
        headers: {
          'authorization': 'Bearer '+sessionModel.get('jwt')
        },
        success: function(r) {
          if (r.ok) {
            Backbone.history.navigate('project/'+r.id, true);
            app.alert("info", "Importing, please wait...")
          }
        },
        error: function(r){
          app.alert('error', 'Unable to import Thing. Please try again.')
        }
      });


      //bootbox.alert("<h1>Importing Project</h1><br/><p>Project import started. It may take few minutes before all files are imported shows up in your projects list.");
    },

    render: function() {
      this.$el.html(this.tpl({ thing: this.model  }));
      return this.$el;
    }
  });
  return v;
});
