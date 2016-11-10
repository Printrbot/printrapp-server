define([
    'app',
    'bootbox',
    'models/materials',
    'text!./templates/edit-materials-modal.html',
],
function(
    app,
    bootbox,
    materials,
    Tpl
)
{
    var v = Backbone.View.extend(
    {
        events:
        {
          'click button.cancel': 'cancel',
          'click button.save': 'save',
          'click button.delete': 'delete',
          'keypress': function(e) {
            if (e.which == 13)
              this.save();
          }
        },

        initialize: function(pm)
        {
          this.model = pm.model;
          this.index = pm.index;
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
          var r = ['name','type','brand']
            , hasError = false;

          _.each(r, function(i) {
            if (!$('.'+i).val()) {
              $('.'+i).parent().addClass('has-error');
              hasError = true;
            }
          });

          if ($('.print_temperature').val() > 275 || $('.print_temperature').val() < 100) {
            $('.print_temperature').parent().addClass('has-error');
            hasError = true;
          }

          if ($('.speed').val() < 10 || $('.speed').val() > 150) {
            $('.speed').parent().addClass('has-error');
            hasError = true;
          }

          if (hasError) return;

          this.model.set('name', $('.name').val());
          this.model.set('type', $('.type').val());
          this.model.set('brand', $('.brand').val());
          this.model.set('print_temperature', $('.print_temperature').val());
          this.model.set('speed', $('.speed').val()/100);
          this.model.set('fan', $('.fan').is(':checked'));
          this.model.set('retraction', $('.retraction').is(':checked'));

          var that = this;

          var mm = materials.get('materials');

          if (this.index == -1) {
            mm.push(this.model.attributes);
          } else {
            mm[this.index] = this.model.attributes;
          }

          materials.set('materials', mm);
          materials.save({}, {
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

        delete: function(o)
        {
          //bootbox.alert("<h1>Importing Project</h1><br/><p>Project import started. It may take few minutes before all files are imported shows up in your projects list.")
          // TODO: swap ugly alert box with bootbox or similar
          var that = this;
          bootbox.confirm("Are you sure you want to delete this material?", function(e) {
            if (e) {
              if (that.index) {
                var _mm = materials.get('materials');
                delete _mm[that.index];
                _mm = _.filter(_mm, function(_m) {
                  return _m;
                })

                materials.set('materials', _mm);
                materials.save();
                app.alert('info', "Material deleted");
              }
            }
            that.removeModal();
          });

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
              'material': this.model,
              'types': materials.get('material_types')
            }));

            return this.el;
        }
    });

    return v;
});
