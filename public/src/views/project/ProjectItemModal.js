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
            this.$el.find('div.read').addClass('hidden');
            this.$el.find('div.edit').removeClass('hidden');
          },
          'click button.delete': 'delete'
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

        removeModal: function()
        {
          $('#gass').modal('hide');
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
