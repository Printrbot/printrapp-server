define([

],
function(
)
{
    var m = Backbone.Model.extend(
    {
        urlRoot: '/api/profile/',
        id: null,

        defaults: {
          first_name: null,
          last_name: null,
          printers: [],
        },

        getSelectedPrinter: function() {
          if (this.attributes.printers.length == 0) return false;
          var sp = _.findWhere(this.attributes.printers, {'selected': true});
          return sp ? sp : this.attributes.printers[0];
        },

        addPrinter: function(printer) {
          var p = this.get('printers');
          p.push(printer);
          this.set({printers: p});
        },

        getPrinterStatus: function(printer) {
          var sp = this.getSelectedPrinter()
          if (sp && sp.status) {
            return sp.status;
          }
          else {
            return 'checking...'
          }
        },

        selectPrinter: function(name) {
          if (this.attributes.printers.length == 0) return false;
          var ps = this.attributes.printers;
          _.each(ps, function(p) {
            if (p.name == name) {
              p.selected = true;
            } else {
              delete p.selected;
            }
          });
          this.set('printers', ps);
          this.save();
        }

    })

    return new m();
});
