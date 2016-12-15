define([
  'app',
  'bootbox',
  'models/project',
  'models/session',
  'models/profile',
  'models/tvthing',
  'collections/tvfiles',
  './TvCollectionThumbView',
  'text!./templates/thingiverse-thing.html'
],

function(
  app,
  bootbox,
  ProjectModel,
  sessionModel,
  profileModel,
  TvThingModel,
  tvThingFiles,
  TvCollectionThumbView,
  Tpl
)
{

  var v = Backbone.View.extend(
  {
    className: 'thingiverse-thing',

    events: {
      'click button.tvlink': 'gotoThingiverse',
      'click button.import-thing': 'importThing'
    },

    initialize: function(o) {
      this.tpl = _.template(Tpl);
      tvThingFiles.reset();

      this.thingModel = new TvThingModel();
      this.listenTo(this.thingModel, 'sync', function(e) {
        this.render();
      }, this);
      this.thingModel.fetch();

      this.listenTo(tvThingFiles, 'sync', function(e) {
        this.render();
      }, this);

      tvThingFiles.fetch();
    },

    gotoThingiverse: function() {
      window.location = this.thingModel.get('public_url')
    },

    importThing: function(e) {
      e.preventDefault();
      e.stopPropagation();
      var b = $(e.currentTarget);
      b.html('<img src="/images/ajax-loader.gif"/> Importing...');

      var thingData = this.thingModel.attributes;
      var thingFiles = [];

      _.each(tvThingFiles.models, function(m) {
        thingFiles.push(_.omit(m.attributes, ['default_image']));
      }, this);

      $.ajax({
        url: app.hostUrl + '/api/project/importthing',
        cache: false,
        dataType: 'json',
        data: {
          project: thingData,
          items: thingFiles
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


      bootbox.alert("<h1>Importing Project</h1><br/><p>Project import started. It may take few minutes before all files are imported shows up in your projects list.")
    },

    render: function() {
      this.$el.html(this.tpl({ thingFiles: tvThingFiles, thing: this.thingModel  }));

      var co = this.$el.find('.tv-files');
      co.html('<div class="col-xs-12"><div class="alert alert-info">Fetching files...</div></div>');

      if (tvThingFiles.models.length > 0) {
        var empty = true;
        co.empty();
        _.each(tvThingFiles.models, function(c) {
          if (c.get('name').substr(-4).toLowerCase() == '.stl') {
            empty = false;
            var v = this.loadView(new TvCollectionThumbView({'model':c, 'ctype':null}), 'tvcp'+c.cid);
            co.append(v.render());
          }
        }, this);

        if (empty) {
          co.html("<div class='col-xs-12'><div class='alert alert-info'>There are no STL files available in this Thing that can be imported</div></div>")
        }
      }

      return this.$el;
    }
  });
  return v;
});
