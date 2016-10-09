define([
  'app',
  'models/profile',
  'text!views/project/templates/printer-modal.html',
],
function(
  app,
  profileModel,
  Tpl
)
{
  var v = Backbone.View.extend(
  {
    events:
    {
      'click button.cancel': 'cancel',
      'click button.save': 'save'
    },

    initialize: function(pm)
    {
      this.template = _.template(Tpl);
      if (pm) {
        this.printer = pm
      } else {
        this.printer = {
          "name": "",
          "ip": ""
        }
      }
    },

    open: function(callback)
    {
      $('body').append(this.render());
      $('#printer-profile').modal();
      var t = this;
      $('#printer-profile').on('hidden.bs.modal', function () {
        t.remove();
      })
      this.callback = callback;
    },

    save: function(e) {
      var that = this;
      e.stopPropagation();
      e.preventDefault();

      var valid = true;
      if (!$('input.name').val()) {
        $('input.name').parent().addClass('has-error');
        valid = false;
      }
      if (!$('input.ip').val()) {
        $('input.ip').parent().addClass('has-error');
        valid = false;
      }
      if (!valid) return;
      this.printer.name = $('input.name').val();
      this.printer.ip = $('input.ip').val();

      var ps = profileModel.get('printers');
      ps = _.map(ps, function(_p) {
        return  _.omit(_p, 'selected');
      })
      this.printer.selected = true;

      if (this.printer.id) {
        // update
        debugger
      } else {
        this.printer.id =  ps.length + 1;
        ps.push(this.printer);
      }

      profileModel.set('printers', ps);

      profileModel.save({}, {
        'success': function(e) {
          that.callback(that.printer);
          that.removeModal();
        },
        'error': function(e) {
          that.callback(false);
          that.removeModal();
        }
      });
    },

    cancel: function()
    {
      this.removeModal();
    },

    removeModal: function()
    {
      $('#printer-profile').modal('hide');
    },

    render: function()
    {
      var that = this;
      this.$el.html(this.template({
        printer: this.printer
      }));

      return this.el;
    }
  });

  return v;
});
