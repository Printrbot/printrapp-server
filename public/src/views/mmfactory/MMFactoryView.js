define([
  'app',
  'models/project',
  'models/session',
  'models/profile',
  'collections/mmfcollections',
  './MMFCollectionThumbView',
  'text!./templates/mmfactory.html'
],

function(
  app,
  ProjectModel,
  sessionModel,
  profileModel,
  mmfCollections,
  MMFCollectionThumbView,
  Tpl
)
{

  var v = Backbone.View.extend(
  {
    className: 'mmfactory',
    mmfConnected: false,
    mmfConnecting: false,

    events: {
      'click .login-mmf-btn': 'getMMFAccess'
    },

    initialize: function(o) {
      var that = this;
      this.tpl = _.template(Tpl);
      this.listenTo(mmfCollections, 'sync', function(e) {
        this.mmfConnected = true;
        this.mmfConnecting = false;
        this.render();
      }, this);

      if (profileModel.get('mmfactory')) {
        this.mmfConnecting = true;
        mmfCollections.fetch({
          error: function(err, e) {
            if (e.status == 401) {
              that.mmfConnecting = false;
              profileModel.set('mmfactory', null);
              that.render();
            }
          }
        });
      }
    },

    getMMFAccess: function(e) {
      var l = $('.mmf-username').val()
        , p = $('.mmf-password').val()
        , e = false
        , that = this;

      if (!l) {
        $('.mmf-username').parent().addClass('has-error');
        e = true;
      } else {
        $('.mmf-username').parent().removeClass('has-error');
      }
      if (!p) {
        $('.mmf-password').parent().addClass('has-error');
        e = true;
      } else {
        $('.mmf-password').parent().removeClass('has-error');
      }

      if (e) {
        app.alert("error", "Please provide login credentials first");
        return;
      }

      $('.login-mmf-btn').attr('disabled', true);

      $.ajax({
        method: "POST",
        url: app.hostUrl + '/api/mmfactory/authenticate',
        cache: false,
        dataType: 'json',
        data: {
          username: $('.mmf-username').val(),
          password: $('.mmf-password').val()
        },
        headers: {
          'authorization': 'Bearer '+sessionModel.get('jwt')
        }
      })
      .done(function(msg) {
        profileModel.set({mmfactory: msg});
        that.mmfConnecting = true;
        that.render();
        mmfCollections.fetch();
      })
      .fail(function( jqXHR, textStatus ) {
        app.alert('error', 'Invalid username or password. If you do not have MyMiniFactory account yet, click on the link below to create one.');
        $('.login-mmf-btn').attr('disabled', false);
      });


    },

    render: function() {
      this.$el.html(this.tpl({ profile: profileModel, mmfConnected: this.mmfConnected, mmfConnecting: this.mmfConnecting  }));

      var co = this.$el.find('.mmf-collections');
      if (mmfCollections.models.length > 0) {
        _.each(mmfCollections.models, function(c) {
          var v = this.loadView(new MMFCollectionThumbView({'model':c, ctype: 'collection'}), 'mmfc'+c.cid);
          co.append(v.render());
        }, this);
      }

      return this.$el;
    }
  });

  return v;
});
