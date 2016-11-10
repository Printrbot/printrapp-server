define([
  'app',
  'models/session',
  'models/profile',
  'models/materials',
  'models/material',
  'views/project/PrintrbarView',
  './EditMaterialModal',
  'text!./templates/materials.html'
],

function(
  app,
  userModel,
  profileModel,
  materials,
  MaterialModel,
  PrintrbarView,
  EditMaterialModal,
  Tpl
)
{

  var v = Backbone.View.extend(
  {
    className: 'browser',
    events:
    {
      'click button.create-material': 'showCreateMaterialModal',
      'click .material-container table button': 'showEditMaterialModal',
      'click button.send-to-printer': 'sendToPrinter'
    },

    initialize: function(o)
    {
      this.tpl = _.template(Tpl);
      this.listenTo(materials, 'change:materials', function(e){
        this.render();
      }, this);

      if (!materials.get('_rev')) {
          materials.fetch();
      }
    },

    showCreateMaterialModal: function(e)
    {
      e.preventDefault();
      e.stopPropagation();

      var that = this
        , m = new MaterialModel()
        , pm = new EditMaterialModal({model:m, index:-1});

      pm.open(function(o)
      {
        that.render();
        /*
        if (o.get('id'))
          Backbone.history.navigate('materials/'+o.get('id'), true)
          */
      });
    },

    showEditMaterialModal: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var idx = $(e.currentTarget).attr('idx')
        , material = materials.get('materials')[idx]
        , that = this
        , m = new MaterialModel(material)
        , pm = new EditMaterialModal({model:m, index:idx});

      pm.open(function(o)
      {
        that.render();
      });
    },

    sendToPrinter: function(e)
    {
      var sp = profileModel.getSelectedPrinter();
      if (sp.status == 'online') {
        var url = "http://files.printrapp.com/u/"+materials.get('user')+'/data/matlib';
        var _headers = {};
        if (sp.password && sp.password.length > 0) {
          _headers.Authorization ="Basic " + sp.password;
        }
        $.ajax({
          url: 'http://'+profileModel.getSelectedPrinter().ip+'/fetch?url='+url+'&type=materials',
          cache: false,
          type: 'GET',
          headers: _headers,
          success: function(r){
            app.alert('info', 'Materials Sent to printer.');
          },
          error: function(r){
            app.alert('error', 'Sending Materials failed.');
          }
        });

        //$.get('http://'+profileModel.getSelectedPrinter().ip+'/fetch?id='+this.projectModel.get('idx')+'&url='+url+'&type=project');
        //console.info('http://'+profileModel.getSelectedPrinter().ip+'/fetch?id='+this.projectModel.get('idx')+'&url='+url+'&type=project');
        //app.alert('info', 'Project Sent to printer.');
      } else {
        app.alert('error', 'Printer is not available.');
      }
    },

    render: function()
    {
        this.$el.html(this.tpl({materials:materials.get('materials'), profile: profileModel}));
        var pbv = this.loadView(new PrintrbarView(), 'printrbarview');
        this.$el.find('.header').prepend(pbv.render());
        //var s = this.loadView(new SearchBarView(), 'searchbar');

        //this.$el.find('.search-block').append(s.render());

        //this.renderMaterialsGrid(this.materials);

        return this.$el;
    }
    });

    return v;
});
