define([
  'app',
  'models/session',
  'models/profile',
  'models/materials',
  'views/project/PrintrbarView',
  'text!./templates/materials.html'
],

function(
  app,
  userModel,
  profileModel,
  materials,
  PrintrbarView,
  Tpl
)
{

  var v = Backbone.View.extend(
  {
    className: 'browser',
    events:
    {
      'click div.create-material': 'showCreateMaterialModal',
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
      /*
      var that = this
        , m = new ProjectModel()
        , pm = new EditProjectModal(m);

      pm.open(function(o)
      {
        if (o.get('id'))
          Backbone.history.navigate('project/'+o.get('id'), true)
      });
      */
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
        console.info(_headers);
        
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
      console.info(materials)
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
