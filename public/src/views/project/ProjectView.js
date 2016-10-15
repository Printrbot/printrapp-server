define([
  'app',
  'printers',
  'models/project',
  'models/session',
  'models/project_item',
  'models/profile',
  'views/project/ProjectItemThumbView',
  'views/project/PrintrbarView',
  'views/project/EditProjectModal',
  'views/project/PrinterModal',
  'text!./templates/project.html'
],

function(
   app,
   printers,
   ProjectModel,
   sessionModel,
   ProjectItemModel,
   profileModel,
   ProjectItemThumbView,
   PrintrbarView,
   EditProjectModal,
   PrinterModal,
   Tpl
){

    var v = Backbone.View.extend(
    {
      events: {
        'click button.edit': 'editModal',
        'click button.change-picture': function(e) {
          $('input.project-photo-upload').trigger('click');
          e.stopPropagation();
        },
        'click button.upload-item': function(e) {
          $('input.project-item-upload').trigger('click');
          e.stopPropagation();
        },
        'click button.send-to-printer': 'sendToPrinter',
        'change input.project-photo-upload': 'uploadProjectPhoto',
        'change input.project-item-upload': 'uploadProjectItems',
        'click .add-printer': 'addPrinter',
        'click .select-printer': 'selectPrinter',
        'click .edit-printer': 'editPrinter',
        'click .delete-printer': 'deletePrinter'
      },

      initialize: function(o) {

        var that = this;

        this.projectModel = new ProjectModel({id:app.selectedProject});

        this.listenTo(this.projectModel, 'change:_id', function(e){
          this.render();
        }, this);

        this.listenTo(this.projectModel, 'change:preview', function(e){
          this.render();
        }, this);

        this.tpl = _.template(Tpl);

        this.projectModel.fetch({
          headers: {'Authorization' :'Bearer '+sessionModel.get('jwt')},
          error: function(model, xhr, options) {
            if (xhr.status == 404) {
              app.router.navigate('browser',true);
            }
            //Backbone.history.navigate('browser', true);
          }
        });

        this.listenTo(app.channel, 'render.completed', function(e) {
          // if project does not have preview yet, use first
          // uploaded file preview as project preview
          if (!this.projectModel.get('preview')) {
            this.projectModel.set(
            {
              'preview': e.data.preview,
              'thumbnail': e.data.thumbnail,
              'rawimage': e.data.rawimage
            });
            this.projectModel.save();
          }
        }, this)

        this.listenTo(app.channel, 'project.item-removed', function(item) {
          //var items = this.projectModel.get('items');
          this.projectModel.fetch({
            'success': function(r) {
                that.render();
            }
          });

        }, this);

        this.pendingUpload = [];
        this.pendingItems = [];
      },

      editModal: function()
      {
        var pm = new EditProjectModal(this.projectModel);
        var that = this;
        pm.open(function(o)
        {
          app.alert('info', 'Project updated');
          that.render();
        });
      },

      uploadProjectPhoto: function(e)
      {
        var that = this;
        var file = (e.currentTarget.files && e.currentTarget.files[0]) ? e.currentTarget.files[0] : false;
        if (!file)
          return;
        var ext = file.name.split(".").pop().toLowerCase();
        if (ext == 'jpg' || ext == 'jpeg' || ext == 'png') {
          var data = new FormData();
          data.append('file', file);
          app.alert('info', 'Uploading, please wait...');
        	$.ajax({
    				url: '/api/project/'+this.projectModel.get('id')+'/uploadpreview',
    				cache: false,
    				data: data,
    				contentType: false,
    				processData: false,
    				type: 'POST',
            headers: {
              'authorization': 'Bearer '+sessionModel.get('jwt')
            },
    				success: function(r){
              console.info('in success');
              app.alert('info', 'Project preview updated')
              that.projectModel.fetch(
                {
                  success: function(e) {
                    console.info('oh yaya');
                    that.render();
                  }
                }
              );

    				},
    				error: function(err){
    					console.info(err);
              app.alert('error', 'Unable to upload project preview. Please try a different photo.');
    				}
    			});
        } else {
          return app.alert('error', 'Invalid file type. Only jpg and png files are supported.')
        }
      },

      addPrinter: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var pm = new PrinterModal();
        var that = this;
        pm.open(function(o)
        {
          if (o) {
            app.alert('info', 'Printer Added');
            printers.scan();
          } else {
            app.alert('error', "Unable to add printer");
          }
          that.render();
        });
      },

      selectPrinter: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var sp = $(e.currentTarget).text();
        profileModel.selectPrinter(sp);
      },

      editPrinter: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var sp =  profileModel.getSelectedPrinter();

        var pm = new PrinterModal(sp);
        var that = this;
        pm.open(function(o)
        {
          if (o) {
            app.alert('info', 'Printer Updated');
            printers.scan();
          } else {
            app.alert('error', "Unable to update printer");
          }
          that.render();
        });
      },

      sendToPrinter: function(e)
      {
        var sp = profileModel.getSelectedPrinter();
        if (sp.status == 'online') {
          var url = "http://files.printrapp.com/u/"+this.projectModel.get('user')+'/p/'+this.projectModel.get('_id')+'/'+this.projectModel.get('idx');
          //var url = location.origin + "/12345678";
          $.get('http://'+profileModel.getSelectedPrinter().ip+'/fetch?id='+this.projectModel.get('idx')+'&url='+url+'&type=project');
          console.info('http://'+profileModel.getSelectedPrinter().ip+'/fetch?id='+this.projectModel.get('idx')+'&url='+url+'&type=project');
          app.alert('info', 'Project Sent to printer.');
        } else {
          app.alert('error', 'Printer is not available.');
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
            url: '/api/project/'+this.projectModel.get('id')+'/uploaditem',
            cache: false,
            data: data,
            contentType: false,
            processData: false,
            type: 'POST',
            headers: {
              'authorization': 'Bearer '+sessionModel.get('jwt')
            },
            success: function(r){
              app.channel.trigger('item.uploaded', r);
              app.alert('info', 'Project item uploaded. Rendering preview image...');
              that.uploadNextPendingFile();
            },
            error: function(r){
              //channel.trigger('file-upload-error', r);
              console.info(r);
              that.uploadNextPendingFile();
              /*
              app.channel.trigger('item.upload-error', m);
              var _items = _.filter(items, function(i) {
                return (i.get('name') != m.get('name'))
              }, m);

              that.projectModel.set('items', _items);
              that.render();
              // remove this temp item from list of items
              */

            }
          });
      },

      uploadProjectItems: function(e)
      {
          var that = this;
          var files = (e.currentTarget.files && e.currentTarget.files[0]) ? e.currentTarget.files : e.originalEvent.dataTransfer.files;
          var output = [];
          var fa = files.length > 0 ? files : [files];
          var invalid = [];
          var items = that.projectModel.get('items');

          _.each(fa, function(f) {
              var ext = f.name.split(".").pop().toLowerCase();
              if (ext == 'stl') {
                  var m = new ProjectItemModel({'name': f.name, 'size': f.size});
                  m.index = items.length;
                  items.push(m)
                  that.pendingItems.push(m);
                  that.pendingUpload.push(f);
              } else {
                  invalid.push(f.name);
              }
          })
          that.projectModel.set('items', items)

          if (that.pendingUpload.length > 0) {
              that.render();
              that.uploadNextPendingFile();
          }

          if (invalid.length > 0) {
              // TODO: error notification
          }

      },

      render: function() {

        this.$el.html(this.tpl({ project: this.projectModel, profile: profileModel }));

        var pbv = this.loadView(new PrintrbarView(), 'printrbarview');
        this.$el.find('.header').prepend(pbv.render());

        this.$el.find('.preview img').on('error', function(i) {
          // just set unknown image
          $(i.currentTarget).attr("src", "/images/noimage.png");
        })

        var pi = this.$el.find('.project-items');
        _.each(this.projectModel.get('items'), function(p) {
          var v = this.loadView(new ProjectItemThumbView({'model':p, 'project': this.projectModel}), 'pt'+p.cid);
          pi.append(v.render());
        }, this);
        return this.$el;
      }
    });
    return v;
  }
);
