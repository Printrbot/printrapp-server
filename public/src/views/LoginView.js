define([
  'app',
  'models/session',
  'text!templates/login.html'
],

function(
   app,
   sessionModel,
   Tpl
)
{
  var v = Backbone.View.extend(
  {
    className: 'col-xs-12 login',

    events: {
      'click button.login-btn': 'onFormSubmit',
      'click a.register-now': 'onRegisterClick',
      'keyup': 'onkeyup'
    },

    initialize: function(o)
    {
      this.tpl = _.template(Tpl);
    },

    onkeyup: function(e)
    {
      if (e.keyCode == 13) {
        this.onFormSubmit();
      }
    },

    onFormSubmit: function()
    {
      var hasError = false;
      if (!$('#login_email').val()) {
        $('#login_email').parent().addClass('has-error');
        hasError = true;
      } else {
        $('#login_email').parent().removeClass('has-error');
      }
      if (!$('#login_password').val()) {
        $('#login_password').parent().addClass('has-error');
        hasError = true;
      } else {
        $('#login_password').parent().removeClass('has-error');
      }

      if (hasError)
        return app.alert('alert', {'type':'error', text:'please fill out all form fields'});

      $('.login-form').slideUp('fast', function() {
        $('.loader').removeClass('hidden');

        // ajax post
        $.ajax({
          method: "POST",
          url: app.hostUrl + '/api/login',
          data: {
            email: $('#login_email').val(),
            passwd: $('#login_password').val()
          }
        })
        .done(function(msg) {
          sessionModel.set({authenticated: true, jwt: msg.jwt});
          sessionModel.save();
        })
        .fail(function( jqXHR, textStatus ) {
          app.alert('error', 'Invalid login, please try again');
          $('.login-form').show();
          $('.loader').hide();
        });
      });
    },

    onRegisterClick: function(e)
    {

    },

    render: function() {
      this.$el.html(this.tpl({}));
      return this.$el;
    }
  });

  return v;
});
