define([
  'app',
  'models/profile',
  'views/project/PrinterModal',
  'text!./templates/printrbar.html'
],

function(
  app,
  profileModel,
  PrinterModal,
  Tpl
)
{
  var v = Backbone.View.extend({
    className: 'printrbar',


    initialize: function(o) {
      this.tpl = _.template(Tpl);
      this.listenTo(profileModel, 'change', function(e){
        this.render();
      }, this);
    },

    render: function() {
      this.$el.html(this.tpl({ profile: profileModel, selectedPrinter: profileModel.getSelectedPrinter()  }));
      return this.$el;
    }
  });
  return v;
});
