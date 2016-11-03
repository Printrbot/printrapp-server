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
    },

    initialize: function(o)
    {
      this.tpl = _.template(Tpl);
      this.listenTo(materials, 'change:_rev', function(e){
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

    render: function()
    {
      console.info(materials)
        this.$el.html(this.tpl({materials:materials.get('materials')}));
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
