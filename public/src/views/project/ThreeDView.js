define([
  'app',
  'models/project',
  'models/session',
  'models/print_profile',
  'views/project/PrintSettingsModal',
  'views/printers/PrinterItem',
  'threejs/three',
  'libs/STLLoader',
  'libs/STLExporter',
  'libs/TrackballControls',
  'text!templates/project/project.html'
],

function(
   app,
   ProjectModel,
   sessionModel,
   printProfile,
   PrintSettingsModal,
   PrinterItem,
   threejs,
   stlloader,
   stlexporter,
   tbctrls,
   Tpl
)
{

    var v = Backbone.View.extend(
    {
        className: 'project',

        events:
        {
          'click .panel.advanced_settings .panel-heading button': 'toggledvancedSettings',
          'click button.delete-project-btn': 'deleteProject',

          'click button.hflip': 'onHflipClick',
          'click button.vflip': 'onVflipClick',
          'click button.save-object-btn': 'onSaveStl',

          'click button.modify-object-btn': 'onModifyClick',
          'click button.cancel-modify-obj': 'onCancelModify',
          'click button.print-settings-btn': 'onJobSettings'
        },

        initialize: function(o)
        {
            this.printers = o.printers;
            this.tpl = _.template(Tpl);
            this.model = new ProjectModel({id:app.selectedProject});
            var that = this;
            this.listenTo(this.model, 'change:_id', function(e){
              that.render();
            })
            this.model.fetch({ headers: {'Authorization' :'Bearer '+sessionModel.get('jwt')}});
            // temporary hardcoded
            this.printerEnvelope = {x:220, y:150, z:200}
            this.modifier = null;

            this.listenTo(app.channel, 'render.completed', function(e){
              if (this.model.get('_id') == e._id) {
                this.onSaveCompleted();
              }
            })
/*
            this.listenTo(this.printers, 'all', function(e) {
              if (_.indexOf(['sync', 'destroy', 'add'], e) != -1) {
                this.updatePrinterItems();
              }
            }, this);
            */
        },

        onModifyClick: function(e)
        {
            $('.modify-pan-body').removeClass('hidden');
            $(e.currentTarget).addClass('hidden');
            $('.print-settings-btn').addClass('hidden');
            $('button.save-object-btn').removeClass('hidden');
            $('button.cancel-modify-obj').removeClass('hidden');
        },

        onCancelModify: function(e)
        {
          this.mesh.rotation.set(0,0,0);
          this.centerObject();
          $('.modify-pan-body').addClass('hidden');
          $(e.currentTarget).removeClass('hidden');
          $('.print-settings-btn').removeClass('hidden');
          $('button.save-object-btn').addClass('hidden');
          $('button.modify-object-btn').removeClass('hidden');
          $('button.cancel-modify-obj').addClass('hidden');
        },

        onSaveCompleted: function(e)
        {
          $('.loader').css('display','none');
          $('.modify-pan').removeClass('hidden');

          $('.print-settings-pan').removeClass('hidden');
          //$('.modify-pan-body').addClass('hidden');

          $('.print-settings-btn').removeClass('hidden');

          //$('button.save-object-btn').addClass('hidden');
          $('button.modify-object-btn').removeClass('hidden');

          //$('button.cancel-modify-obj').addClass('hidden');
        },

        onSaveStl: function(e)
        {
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
              that.model.set({'thumbnail': null, 'rendered': false});
              that.model.save();
              /*
              that.showLoader('Loading...');
              that.removeSceneObject('model');
              that.loadObject();
              */
              that.hideLoader();
              //debugger;
            },
            error: function(r){
              app.alert('error', 'Unable to save the file. Please try again.')
            }
          });
        },

        onHflipClick: function(e)
        {
          this.mesh.rotation.z += Math.PI / 4;
          this.centerObject();
        },

        onVflipClick: function(e)
        {
          this.mesh.rotation.x -= Math.PI / 4;
          this.centerObject();
        },

        onJobSettings: function(e)
        {
          e.preventDefault();
          e.stopPropagation();

          if (this.printers.length == 0) {
            app.alert('error', 'No printers connected');
            return;
          }

          var that = this
            , ps = new PrintSettingsModal(this.model);

          ps.open(function(o)
          {
              /*
              o.set({"user": sessionModel.getId()});
              o.save();
              that.render();
              */
              app.alert('info', 'Print Job added');
          });
        },

        toggledvancedSettings: function(e)
        {

          var b = this.$el.find('.advanced_settings .panel-body');
          if (b.is(':visible')) {
              b.addClass('hidden');
              this.$el.find('.advanced_settings .panel-heading').removeClass('active')
          } else {
              b.removeClass('hidden');
              this.$el.find('.advanced_settings .panel-heading').addClass('active')
          }
        },

        showFileUploadSelect: function(e)
        {
            $('input.file-upload').trigger('click');
            e.stopPropagation();
            return false;
        },

        deleteProject: function(e)
        {
          if (confirm('Are you sure you want to delete this project')) {
            this.model.destroy({
              dataType: 'text',
              success: function() {
                Backbone.history.navigate('browser', true);
                app.alert('info', 'Project deleted');
              },
              error: function() {
                alert('Unable to delete project, please refresh the page and try again.')
              }
            });
          }
        },

        render3d: function(e,b) {
            this.renderer.render( this.scene, this.camera );
        },

        showLoader: function(m)
        {
            if (!m) m = 'Loading...';
            this.$el.find('.loader div').html(m);
            this.$el.find('.loader').show();
        },

        hideLoader: function()
        {
            this.$el.find('.loader').hide();
        },

        loadObject: function()
        {
          var that = this;
            var loader = new THREE.STLLoader();

            var model_path = this.model.get('stl');
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

                  that.origialRotation = that.mesh.rotation.clone();


                  that.centerObject();
              })

        },

        removeSceneObject: function(ot)
        {
            var len = this.scene.children.length;

            while(len--) {
                if (this.scene.children[len].name == ot)
                    this.scene.remove(this.scene.children[len]);
            }
        },

        drawCoordinates: function()
        {
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

            createAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(100, 0, 0), 0xda4453);
            createAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 100, 0), 0x8cc152);
            createAxis(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 100), 0x4a89dc);
        },

        centerObject: function()
        {
          var bbox = new THREE.Box3().setFromObject(this.mesh)
            , bs = bbox.size()
            , bc = bbox.center()
            , cp = this.mesh.position;

          this.mesh.position.set(cp.x-bc.x,cp.y-bc.y,cp.z-bc.z+(bs.z/2))
        },

        positionCamera: function()
        {
          var bbox = new THREE.Box3().setFromObject(this.mesh)
            , bs = bbox.size()
            , bc = bbox.center()

          this.camera.position.x = bc.x + (bs.x*1.3);
          this.camera.position.y = bc.y - (bs.y*0.8);
          this.camera.position.z = bc.z + (bs.z*1.3);
        },

        drawGrid: function()
        {
            // TODO, get this from configured bot

            var g = new THREE.GridHelper(this.printerEnvelope.x/2, 10);
            g.rotation.x = Math.PI/2;
            g.position.set(0,0,0);

            g.setColors(0xaaaaaa, 0xbbbbbb);
            this.scene.add(g);
        },

        drawEnvelope: function()
        {
            return;
            this.removeSceneObject("envelope");
            var en = new THREE.Mesh(new THREE.BoxGeometry(this.printerEnvelope.x, this.printerEnvelope.y,this.printerEnvelope.z), new THREE.MeshBasicMaterial({
                visible: false
            }));

            en.name = 'envelope';
            en.position.z = this.printerEnvelope.z/2;

            var eh = new THREE.EdgesHelper(en, 0x359BDD);
            eh.material.linewidth = 1;
            eh.name = "envelope";

            this.scene.add(eh);
            this.scene.add(en);
        },


        setupScene: function()
        {
            var that = this;

            if (typeof this.scene === 'undefined')
            {
                this.camera = new THREE.PerspectiveCamera( 60, $('.threed-view').width() / window.innerHeight, 1, 10000 );
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

                //this.scene.add(pointLight);

                // renderer
                this.renderer = new THREE.WebGLRenderer( { antialias: false, alpha: true } );
                //				renderer.setPixelRatio( window.devicePixelRatio );

                this.renderer.setSize($('.threed-view').width() , window.innerHeight);

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

        removeSceneObject: function(ot)
        {
            var len = this.scene.children.length;
            while(len--) {
                if (this.scene.children[len].name == ot)
                    this.scene.remove(this.scene.children[len]);
            }
        },

/*
        updatePrinterItems: function()
        {
          this.$el.find('.printer-items').empty();
          if (this.printers.length == 0)
            $('button.print-settings-btn').addClass('disabled');
          else
            $('button.print-settings-btn').removeClass('disabled');

          this.printers.each(function(printer) {
            var p = this.loadView(new PrinterItem({printer: printer, selectedPrinter: app.selectedPrinter}), 'pitem'+printer.cid);
            this.$el.find('.printer-items').append(p.render());
          }, this);
        },
*/
        render: function()
        {
            this.$el.html(this.tpl({ project: this.model, profile: printProfile, printers: this.printers, selectedPrinter: app.selectedPrinter }));
            if (this.model.get('_id')) {
              this.setupScene();
              this.drawGrid();
              this.drawEnvelope();
              this.loadObject();
              if (this.renderer) {
                this.$el.find('.threed-view').prepend(this.renderer.domElement);
              }
            }

            //this.updatePrinterItems();

            var infil = this.$el.find('.infil')
              , itrack = infil.find('.track');

            this.$el.find('[data-toggle="tooltip"]').tooltip()
            return this.$el;
        }

    });

    return v;
});
