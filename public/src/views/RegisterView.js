define([
  'app',
  'models/printer_types',
  'text!templates/register.html'
],

function(
   app,
   printerTypes,
   Tpl
)
{

    var v = Backbone.View.extend(
    {
        className: 'col-xs-12 login',

        events: {
          'click button.register-btn': 'onFormSubmit',
          'keypress': function(e) {
            if (e.which == 13)
              this.onFormSubmit(e);
          }
        },

        initialize: function(o)
        {
            this.tpl = _.template(Tpl);
            this.hasErrors = false;

            this.listenTo(printerTypes, 'change:_id', function(e) {
              this.render();
            })
        },

        validateEmpty: function(o)
        {
          var e = $('#'+o);
          if (!e.val()) {
            e.parent().addClass('has-error');
            this.hasErrors = true;
          } else {
            e.parent().removeClass('has-error');
          }
        },

        onFormSubmit: function()
        {
          this.hasErrors = false;

          var required = ['first_name', 'last_name', 'email', 'password', 'serial'];
          _.each(required, function(e) {
            this.validateEmpty(e);
          }, this)

          if (this.hasErrors)
            return app.alert('error', 'Please fill out all required fields and try again');

          var printer = printerTypes.filterByType($('#printer_model').val());

          // disable submit button
          $('.register-btn').prop("disabled",true);
            // ajax post
            $.ajax({
              method: "POST",
              url: app.hostUrl + '/api/register',
              data: {
                first_name: $('#first_name').val(),
                last_name: $('#last_name').val(),
                email: $('#email').val(),
                password: $('#password').val(),
                serial: $('#serial').val()
              }
            })
            .done(function(msg) {

                $('.register-btn').prop("disabled",false);

                if (msg.status == "error") {
                  app.alert('error', msg.message);
                  return
                }

                if (msg.status == "success") {
                  app.alert('info', "Success, please check your email");
                };

                Backbone.history.navigate('login', true);
            })
            .fail(function( jqXHR, textStatus ) {
                app.alert('error', 'There was a problem submitting this form. Please check your data and try again.');
                $('.register-btn').prop("disabled",false);
            });

        },

        onRegisterClick: function(e)
        {


        },

        render: function() {

            this.$el.html(this.tpl({printers: printerTypes}));
            return this.$el;
        }
    });

    return v;
});
