define([
    'app',
    'bootbox',
    'text!./templates/edit-project-modal.html',
],
function(
    app,
    bootbox,
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
            this.model = pm;
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

        save: function()
        {
          if (!$('.name').val()) {
            $('.name').parent().addClass('has-error');
            return;
          }

          this.model.set('name', $('.name').val());
          this.model.set('description', $('.description').val());

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

        delete: function()
        {
          // TODO: swap ugly alert box with bootbox or similar
          var that = this;
          if (confirm("Are you sure you want to delete this project?")) {
            this.model.destroy({
                'success': function(e) {
                  app.alert('info', "Project deleted");
                  app.router.navigate('browser', true);
                  that.removeModal();
                },
                'error': function(e) {
                  console.info(e);
                  app.alert('error', 'Unable to delete the project');
                  that.removeModal();
                }
              }
            );
          }
        },

        cancel: function()
        {
            this.removeModal();
        },

        removeModal: function()
        {
            $('#gass').modal('hide');
        },

        render: function()
        {
            this.$el.html(this.template({
              'project': this.model
            }));

            return this.el;
        }
    });

    return v;
});
