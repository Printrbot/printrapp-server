define([
  'app',
  'models/session',
  'text!./templates/materials.html'
],

function(
  app,
  userModel,
  Tpl
)
{

  var v = Backbone.View.extend(
  {
    className: 'browser',
    events:
    {
        'click div.create-material': 'showCreateMaterialModal',
        'keyup input.search-field': 'onSearch'
    },

    initialize: function(o)
    {
        this.tpl = _.template(Tpl);

        this.listenTo(app.channel, 'filter-material', function(e) {
          this.renderMaterialGrid(e);
        })


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

        onSearch: function(e)
        {/*
            this.search = $(e.currentTarget).val().trim();
            var s = this.search;
            this.filtered = materialsCollection.filter(function(item) {
                return item.get("name").indexOf(s) > -1
            });
            */
        },

        renderMaterialsGrid: function(projects)
        {
/*
          var pb = this.$el.find('.materials-pan');

          var pbc = pb.find('div.create-material').clone();
          pb.empty();

          pb.append(pbc);

          _.each(this.pendingProjects, function(p) {
              pb.append(new ProjectThumbView({'model':p}).render());
          });

          _.each(projects, function(p) {
              var v = this.loadView(new ProjectThumbView({'model':p}), 'pt'+p.cid);
              pb.append(v.render());
          }, this);
*/
        },

        render: function()
        {
            this.$el.html(this.tpl({}));

            //var s = this.loadView(new SearchBarView(), 'searchbar');

            //this.$el.find('.search-block').append(s.render());

            //this.renderMaterialsGrid(this.materials);

            return this.$el;
        }
    });

    return v;
});
