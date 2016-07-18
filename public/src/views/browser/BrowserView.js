define([
  'app',
  'models/project',
  'models/session',
  'collections/projects',
  'views/browser/SearchBarView',
  'views/browser/ProjectThumbView',
  'views/project/EditProjectModal',
  'text!./templates/browser.html'
],

function(
  app,
  ProjectModel,
  userModel,
  projectsCollection,
  SearchBarView,
  ProjectThumbView,
  EditProjectModal,
  Tpl
)
{

  var v = Backbone.View.extend(
  {
    className: 'browser',
    events:
    {
        'click div.create-project': 'showCreateProjectModal',
        'change input.file-upload': 'uploadFile',
        'keyup input.search-field': 'onSearch'
    },

    initialize: function(o)
    {
        this.tpl = _.template(Tpl);

        this.listenTo(projectsCollection, 'all', function(e) {
          if (_.indexOf(['sync', 'destroy', 'add'], e) != -1) {
            this.projects = projectsCollection.models;
            this.render();
          }
        }, this);

        this.listenTo(app.channel, 'filter-projects', function(e) {
          this.projects = e;
          this.render();
        })

        this.pendingUpload = [];
        this.pendingProjects = [];
        this.projects = projectsCollection.models;
        projectsCollection.fetch();
    },
/*
        uploadFile: function(e)
        {
            var that = this;
            $(e.currentTarget).removeClass('upload-indicator');

            var files = (e.currentTarget.files && e.currentTarget.files[0]) ? e.currentTarget.files[0] : e.originalEvent.dataTransfer.files;
            var output = [];
            var fa = files.length > 0 ? files : [files];
            var invalid = [];

            _.each(fa, function(f) {
                var ext = f.name.split(".").pop().toLowerCase();

                if (ext == 'stl') {
                    // have file reference here...
                    var s = new ProjectModel();
                    s.set({originalname:f.name, size:f.size });
                    s.index = projectsCollection.length;
                    that.pendingProjects.push(s);
                    that.pendingUpload.push(f);
                } else {
                    invalid.push(f.name);
                }
            })


            if (that.pendingUpload.length > 0) {
                that.render();
                that.uploadNextPendingFile();
            }

            if (invalid.length > 0) {
                // TODO: error notification
            }

        },

        uploadNextPendingFile: function()
        {
            if (this.pendingUpload.length == 0)
            return;

            	var that = this;

            	var data = new FormData();
                data.append('file', this.pendingUpload.shift());

            	$.ajax({
        				url: '/api/project/upload',
        				cache: false,
        				data: data,
        				contentType: false,
        				processData: false,
        				type: 'POST',
                headers: {
                    'authorization': 'Bearer '+userModel.get('jwt')
                },
        				success: function(r){
                  console.info('upload success')
                  //debugger
        				},
        				error: function(r){
        					//channel.trigger('file-upload-error', r);
        					console.info(r);
        					that.uploadNextPendingFile();
        				}
        			});
        },


        showFileUploadSelect: function(e)
        {
            $('input.file-upload').trigger('click');
            e.stopPropagation();
            return false;
        },
        */

        showCreateProjectModal: function(e)
        {
          e.preventDefault();
          e.stopPropagation();

          var that = this
            , m = new ProjectModel()
            , pm = new EditProjectModal(m);

          pm.open(function(o)
          {
            if (o.get('id'))
              Backbone.history.navigate('project/'+o.get('id'), true)
          });
        },

        onSearch: function(e)
        {
            this.search = $(e.currentTarget).val().trim();
            var s = this.search;
            this.filtered = projectsCollection.filter(function(item) {
                return item.get("name").indexOf(s) > -1
            });
        },

        render: function()
        {
            this.$el.html(this.tpl({ search: this.search }));

            var s = this.loadView(new SearchBarView(), 'searchbar');

            this.$el.find('.search-block').append(s.render());

            var pb = this.$el.find('.projects-pan');

    				_.each(this.pendingProjects, function(p) {
    					  pb.append(new ProjectThumbView({'model':p}).render());
    				});

            _.each(this.projects, function(p) {

                var v = this.loadView(new ProjectThumbView({'model':p}), 'pt'+p.cid);
      					pb.append(v.render());
    				}, this);


            return this.$el;
        }
    });

    return v;
});
