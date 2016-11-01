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
      'click button.save': 'save',
      'click button.delete': 'delete'
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

    validateIp: function(ipaddress) {
      if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
        return true;
      }
      return false;
    },

    delete: function(e) {
      e.stopPropagation();
      e.preventDefault();

      var sp = profileModel.getSelectedPrinter();

      var ps = _.filter(profileModel.get('printers'), function(p) {
        return p.id != sp.id;
      }, this)

      profileModel.set('printers', ps);
      profileModel.save();
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

      if (!this.validateIp($('input.ip').val())) {
        $('input.ip').parent().addClass('has-error');
        valid = false;
      }

      if (!valid) return;
      this.printer.name = $('input.name').val();
      this.printer.ip = $('input.ip').val();

      if ($('input.password').val()) {
        if (this.printer.password != $('input.password').val()) {
          var passtoken = (this.printer.info && this.printer.info.name) ? this.printer.info.name : 'printrbot';
          passtoken += ':' + $('input.password').val();
          this.printer.password = btoa(passtoken);
        }
      } else {
        this.printer.password = "";
      }

      var ps = profileModel.get('printers');

      if (this.printer.id) {

      } else {
        ps = _.map(ps, function(_p) {
          return  _.omit(_p, 'selected');
        })
        this.printer.selected = true;
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
