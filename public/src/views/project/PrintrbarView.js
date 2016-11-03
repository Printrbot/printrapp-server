define([
  'app',
  'printers',
  'models/profile',
  'views/project/PrinterModal',
  'text!./templates/printrbar.html'
],

function(
  app,
     printers,
  profileModel,
  PrinterModal,
  Tpl
)
{
  var v = Backbone.View.extend({
    className: 'printrbar',

    events: {
      'click .add-printer': 'addPrinter',
      'click .select-printer': 'selectPrinter',
      'click .edit-printer': 'editPrinter',
      'click .delete-printer': 'deletePrinter'
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
