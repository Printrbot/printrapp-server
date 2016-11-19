define([
  'app',
  'text!templates/resetpassword.html'
],

function(
   app,
   Tpl
)
{

    var v = Backbone.View.extend(
    {
        className: 'col-xs-12 resetpassword',

        events: {
          'click button.reset-btn': 'onFormSubmit',
          'keypress': function(e) {
            if (e.which == 13)
              this.onFormSubmit(e);
          }
        },

        initialize: function(o)
        {
            this.tpl = _.template(Tpl);
            this.hasErrors = false;
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

          var required = ['email'];
          _.each(required, function(e) {
            this.validateEmpty(e);
          }, this)

          if (this.hasErrors)
            return app.alert('error', 'Please fill out all required fields and try again');

          // disable submit button
          $('.reset-btn').prop("disabled",true);
            // ajax post
            $.ajax({
              method: "POST",
              url: app.hostUrl + '/api/sendpasswordreset',
              data: {
                email: $('#email').val()
              }
            })
            .done(function(msg) {
              $('.register-btn').prop("disabled",false);
              if (msg.status == "error") {
                app.alert('error', msg.message);
                $('.reset-btn').prop("disabled",false);
                return
              }
              if (msg.status == "success") {
                app.alert('info', "Success, please check your email");
              };
              Backbone.history.navigate('login', true);
            })
            .fail(function( jqXHR, textStatus ) {
              app.alert('error', 'There was a problem submitting this form. Please check your data and try again.');
              $('.reset-btn').prop("disabled",false);
            });

        },

        onRegisterClick: function(e)
        {


        },

        render: function() {

            this.$el.html(this.tpl());
            return this.$el;
        }
    });

    return v;
});
