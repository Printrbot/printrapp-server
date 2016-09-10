define([
    'app',
    'text!./templates/project-item-modal.html',
],
function(
    app,
    Tpl
)
{
    var v = Backbone.View.extend(
    {
        events:
        {
          'click button.edit': function() {
            this.show('div.edit');
          },
          'click button.print-settings': function() {
            this.show('div.print-settings');
          },
          'click button.cancel-print-settings': function() {
            this.show('div.read');
          },
          'click button.cancel-edit': function() {
            this.show('div.read');
          },
          'click button.save-print-settings': function() {

            this.model.set({
              'infill': $('select.infill').val(),
              'support': $('.print-support').is(':checked'),
              'brim': $('.print-brim').is(':checked'),
              'resolution': $('select.resolution').val()
            })

            this.model.save();
            app.alert('info', 'Print settings updated');
            this.show('div.read');
          },
          'click button.getgcode': 'getgcode',
          'click button.delete': 'delete',
          'click button.save': 'save',
          'keypress': function(e) {
            if (e.which == 13)
              this.save();
          }
        },

        show: function(cls) {
          this.$el.find('div.read').addClass('hidden');
          this.$el.find('div.print-settings').addClass('hidden');
          this.$el.find('div.edit').addClass('hidden');
          this.$el.find(cls).removeClass('hidden');
        },

        initialize: function(pm, pim)
        {
          this.projectModel = pm;
          this.model = pim;
          this.edit = false;
          this.template = _.template(Tpl);
        },

        open: function(callback)
        {
            $('body').append(this.render());
            $('#gass').modal();
            var t = this;
            $('#gass').on('hidden.bs.modal', function () {
              t.remove();
            })
            this.callback = callback;
        },

        delete: function()
        {
          // TODO: swap ugly alert box with bootbox or similar
          var that = this;
          if (confirm("Are you sure you want to delete this?")) {
            /*
            var items = _.filter(that.projectModel.get('items'), function(i) {
              return (i.get('_id') != that.model.get('_id'));
            });
            that.projectModel.set('items', items);
            */
            //that.projectModel.save();
            // delete the item from the server
            that.model.destroy({
              'success': function(model, response) {
                app.alert('info', 'Item successfully deleted');
                app.channel.trigger('project.item-removed', response);
                that.removeModal();
              },
              'error': function(err) {
                app.alert('error', 'Unable to delete the item')
              }
            });
          }
        },

        save: function()
        {
          if (!$('.name').val()) {
            $('.name').parent().addClass('has-error');
            return;
          }

          this.model.set('name', $('.name').val());

          var that = this;
          this.model.save({}, {
            'success': function(e) {
              that.callback(that.model);
              that.removeModal();
            },
            'error': function(e) {
              that.callback(false);
              that.removeModal();
            }
          });
        },

        removeModal: function()
        {
          $('#gass').modal('hide');
        },

        getgcode: function() {
          console.info(this.model)
          window.location = "http://files.printrapp.com/u/" +
                              this.model.get('user') + "/i/" +
                              this.model.get('_id') + "/" +
                              this.model.get('_id') + ".gco";
        },

        render: function()
        {
            this.$el.html(this.template({
              'model': this.model,
              'edit': this.edit
            }));


            return this.el;
        }
    });

    return v;
});
