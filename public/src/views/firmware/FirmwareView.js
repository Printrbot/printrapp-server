define([
  'app',
  'models/session',
  'views/printers/PrinterItem',
  'views/project/PrintrbarView',
  'text!./templates/firmware.html'
],

function(
  app,
  userModel,
  PrinterItem,
  PrintrbarView,
  Tpl
)
{

  var v = Backbone.View.extend(
  {
    className: 'firmware',
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

    render: function() {
        this.$el.html(this.tpl({}));
        var pbv = this.loadView(new PrintrbarView(), 'printrbarview');
        this.$el.find('.header').prepend(pbv.render());
        return this.$el;
    }
  });

  return v;
});
