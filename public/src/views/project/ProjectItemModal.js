define([
    'app',
    'models/session',
    'threejs/three',
    'libs/STLLoader',
    'libs/STLExporter',
    'libs/TrackballControls',
    'xeditable',
    'text!./templates/project-item-modal.html',
    'text!./templates/gcode-item-modal.html'
],
function(
    app,
    sessionModel,
    threejs,
    stlloader,
    stlexporter,
    tbctrls,
    xeditable,
    Tpl,
    TplG
)
{
    var v = Backbone.View.extend(
    {
        events:
        {
          'click button.edit': function() {
            this.show('div.edit');
          },
          'click .psinfo ul': function() {
            this.show('div.print-settings');
          },
          'click button.cancel-print-settings': function() {
            this.show('div.read');
          },
          'click button.cancel-edit': function() {
            this.show('div.read');
          },
          'click button.save-print-settings': function() {

            this.model.set({
              'infill': $('select.infill').val(),
              'support': $('.print-support').is(':checked'),
              'brim': $('.print-brim').is(':checked'),
              'resolution': $('select.resolution').val()
            })

            this.model.save();
            app.alert('info', 'Print settings updated');
            this.show('div.read');

          },
          'click button.getgcode': 'getgcode',
          'click button.delete': function(e) {
            this.delete(e);
          },
          'click button.save': 'save',
          'click button.show-three-dee': 'show3dView',
          'click button.cancel-three-dee': function() {
            this.mesh.rotation.z = 0;
            this.mesh.rotation.x = 0;
            this.mesh.rotation.y = 0;
            this.centerObject();
            this.show('div.read');
          },
          'click button.zflip': function() {
            this.mesh.rotation.z += Math.PI / 4;
            this.centerObject();
          },
          'click button.xflip': function() {
            this.mesh.rotation.x += Math.PI / 4;
            this.centerObject();
            console.info(this.mesh.rotation);
          },
          'click button.yflip': function() {
            this.mesh.rotation.y += Math.PI / 4;
            this.centerObject();
            console.info(this.mesh.rotation);
          },
          'click button.rflip': function() {
            this.mesh.rotation.z = 0;
            this.mesh.rotation.x = 0;
            this.mesh.rotation.y = 0;
            this.centerObject();
          },
          'click button.save-three-dee': 'saveTransformations',
          'keypress': function(e) {
            if (e.which == 13)
              this.save();
          },
          'change input.gcode-preview-upload': 'uploadGcodePreview',
        },

        show: function(cls) {
          this.$el.find('div.read').addClass('hidden');
          this.$el.find('div.print-settings').addClass('hidden');
          this.$el.find('div.edit').addClass('hidden');
          this.$el.find('div.three-dee').addClass('hidden');
          this.$el.find(cls).removeClass('hidden');
        },

        initialize: function(pm, pim)
        {
          this.projectModel = pm;
          this.model = pim;
          this.edit = false;
          if (this.model.get('ftype') == 'stl') {
            this.stlLoaded = false;
            this.template = _.template(Tpl);
            this.listenTo(app.channel, 'render.completed', function(e) {
              if (this.model.get('id') == e.data.id) {
                this.model.set(e.data);
                this.$el.find('.preview img.preview-image').attr('src', e.data.preview);
              }
            }, this)
          }
          else {
            this.template = _.template(TplG);
            this.listenTo(app.channel, 'gcode.fixed', function(e) {
              if (this.model.get('id') == e.data.id) {
                this.model.set({'fixed':true});
              }
            }, this)
          }

          this.listenTo(this.model, 'change', function(e){
            if (this.model.get('ftype') == 'stl') {
              if (e.changed.support)
                this.$el.find('span.support').html((e.changed.support?'Yes':'No'));
              if (e.changed.infill)
                this.$el.find('span.infill').html(e.changed.infill);
              if (e.changed.resolution)
                  this.$el.find('span.resolution').html(e.changed.resolution);
            }
          }, this);

        },

        open: function(callback)
        {
            $('body').append(this.render());
            $('#gass').modal();
            var t = this;
            $('#gass').on('hidden.bs.modal', function () {
              t.remove();
            })
            this.callback = callback;
        },

        delete: function()
        {
          // TODO: swap ugly alert box with bootbox or similar
          var that = this;
          if (confirm("Are you sure you want to delete this?")) {
            /*
            var items = _.filter(that.projectModel.get('items'), function(i) {
              return (i.get('_id') != that.model.get('_id'));
            });
            that.projectModel.set('items', items);
            */
            //that.projectModel.save();
            // delete the item from the server
            that.model.destroy({
              'success': function(model, response) {
                app.alert('info', 'Item successfully deleted');
                app.channel.trigger('project.item-removed', response);
                that.removeModal();
              },
              'error': function(err) {
                app.alert('error', 'Unable to delete the item')
              }
            });
          }
        },

        save: function() {
          if (!$('.name').val()) {
            $('.name').parent().addClass('has-error');
            return;
          }

          this.model.set('name', $('.name').val());

          var that = this;
          this.model.save({}, {
            'success': function(e) {
              that.callback(that.model);
              that.removeModal();
            },
            'error': function(e) {
              that.callback(false);
              that.removeModal();
            }
          });
        },

        removeModal: function() {
          $('#gass').modal('hide');
        },

        show3dView: function() {
          this.show('div.three-dee')
          console.info('here')
          this.setupScene();

          this.drawEnvelope();
          if (!this.stlLoaded)
            this.loadObject();
          if (this.renderer) {
            this.$el.find('.threed-view').prepend(this.renderer.domElement);
          }
        },

        getgcode: function() {
          console.info(this.model)
          window.location = "http://files.printrapp.com/u/" +
                              this.model.get('user') + "/i/" +
                              this.model.get('_id') + "/" +
                              this.model.get('_id') + ".gco";
        },

        setupScene: function() {
          var that = this;

          if (typeof this.scene === 'undefined') {

            this.camera = new THREE.PerspectiveCamera( 60, $('.threed-view').width() / $('.threed-view').height(), 1, 10000 );
            this.camera.position.set(0, -115, 60);
                //this.camera.up.set( 0, 0, 1 );
            this.camera.up = new THREE.Vector3(0,0,1);
            //this.camera.lookAt(new THREE.Vector3(10,0,0));
            //this.camera.lookAt(new THREE.Vector3(100,100,0));

            this.controls = new THREE.TrackballControls( this.camera, this.$el.find('.threed-view').get(0) );
            this.controls.rotateSpeed = 1.0;
            this.controls.zoomSpeed = 1.2;
            this.controls.panSpeed = 0.8;
            this.controls.noZoom = false;
            this.controls.noPan = false;
            this.controls.target = new THREE.Vector3(0,0,10);


            this.controls.staticMoving = true;
            this.controls.dynamicDampingFactor = 0.3;
            this.controls.keys = [ 65, 83, 68 ];
            controls = this.controls;
            console.info(this.controls);

            this.controls.addEventListener( 'change', function() {
              that.renderer.render( that.scene, that.camera );
            });

            // world
            this.scene = new THREE.Scene();
            this.renderer = new THREE.WebGLRenderer( { antialias: false, alpha: true } );
            this.renderer.setSize($('.modal-body').width() , $('.modal-body').height());
            this.drawCoordinates();

            function animate() {
              that.animation = requestAnimationFrame(animate);
              that.controls.update();
              if (that.tcontrols)
                that.tcontrols.update();
              that.renderer.render(that.scene, that.camera);
            };

            this.render3d();
            animate();
          }
        },

        drawCoordinates: function() {
          this.removeSceneObject("coordinates");
          var that = this;

          function createAxis(p1, p2, color){
            var line, lineGeometry = new THREE.Geometry(),
                lineMat = new THREE.LineBasicMaterial({color: color, linewidth: 1});
            lineGeometry.vertices.push(p1, p2);
            line = new THREE.Line(lineGeometry, lineMat);
            line.name = "coordinates";
            that.scene.add(line);
          }

          createAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(110, 0, 0), 0xda4453);
          createAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 75, 0), 0x8cc152);
          createAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 160), 0x4a89dc);
        },

        removeSceneObject: function(ot) {
          var len = this.scene.children.length;

          while(len--) {
            if (this.scene.children[len].name == ot)
              this.scene.remove(this.scene.children[len]);
          }
        },

        render3d: function(e,b) {
          this.renderer.render(this.scene, this.camera);
        },


        drawEnvelope: function() {

          this.removeSceneObject("envelope");
          var en = new THREE.Mesh(new THREE.BoxGeometry(220, 150, 216), new THREE.MeshBasicMaterial({
            visible: false
          }));

          en.name = 'envelope';
          en.position.z = 108;

          var eh = new THREE.EdgesHelper(en, 0x359BDD);
          eh.material.linewidth = 1;
          eh.name = "envelope";

          this.scene.add(eh);
          this.scene.add(en);
        },

        loadObject: function()
        {
          var that = this;
          var loader = new THREE.STLLoader();

          var model_path = app.filesUrl + this.model.get('file_path');

          if (!model_path)
            return;

          loader.load(model_path+"?c="+Math.random(), function ( geometry ) {
              var material = new THREE.MeshNormalMaterial( {
                 overdraw: 0.5,
                 side: THREE.DoubleSide
              } );

              that.mesh = new THREE.Mesh( geometry, material );
              that.mesh.name = 'model';
              that.centerObject();
              that.$el.find('.loader').hide();
              that.mesh.receiveShadow = true;
              that.scene.add( that.mesh );
              that.positionCamera();
              that.stlLoaded = true;

              that.origialRotation = that.mesh.rotation.clone();
              that.centerObject();
          })
        },

        positionCamera: function() {
          var bbox = new THREE.Box3().setFromObject(this.mesh)
            , bs = bbox.size()
            , bc = bbox.center()

          this.camera.position.x = bc.x + (bs.x*0.8);
          this.camera.position.y = bc.y - (bs.y*1.3);
          this.camera.position.z = bc.z + (bs.z*1.3);
        },

        centerObject: function() {
          var bbox = new THREE.Box3().setFromObject(this.mesh)
            , bs = bbox.size()
            , bc = bbox.center()
            , cp = this.mesh.position;

          this.mesh.position.set(cp.x-bc.x,cp.y-bc.y,cp.z-bc.z+(bs.z/2))
        },

        saveTransformations: function() {
          this.showLoader('Saving...');
          app.channel.trigger('project.clear-thumb', this.model);

          var r = this.mesh.rotation
            , s = this.mesh.scale
            , that = this;

          $.ajax({
            url: app.hostUrl + '/api/project/modify/'+this.model.get('id'),
            cache: false,
            data: {
                rotation: {x: r.x, y: r.y, z: r.z},
                scale: {x: s.x, y: s.y, z: s.z},
                user: sessionModel.getId()
            },

            type: 'POST',
            headers: {
              'authorization': 'Bearer '+sessionModel.get('jwt')
            },
            success: function(r){
              app.alert('info', 'File saved');
              // remove preview thumb until new one is rendered
              that.model.set({'thumbnail': null, 'preview': null, 'rawimage': null, 'rendered': false});
              //that.model.save();
              that.$el.find('.loader').hide();
              that.show('div.read');

              that.$el.find('.preview img.preview-image').attr('src', '/images/loading.gif')
              app.alert("info", "Rendering new preview image")
              //debugger;
            },
            error: function(r){
              app.alert('error', 'Unable to save the file. Please try again.')
            }
          });
        },

        uploadGcodePreview: function(e)
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

        showLoader: function(m) {
          if (!m) m = 'Loading...';
          this.$el.find('.loader div').html(m);
          this.$el.find('.loader').show();
        },

        render: function() {
          this.$el.html(this.template({
            'model': this.model,
            'edit': this.edit
          }));

          var that = this;
          this.$el.find('h4.modal-title').editable(
            {
              'mode': 'inline',
              'success': function(r,v) {
                that.model.set('name', v);
                that.model.save();
              },
              'validate': function(v) {
                if($.trim(v) == '') {
                    return 'Please provide item name';
                }
              }
            }
          );

          return this.el;
        }
    });

    return v;
});
