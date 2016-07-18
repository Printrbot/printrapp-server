define([
  'app',
  'models/profile',
  'text!templates/profilebar.html'
],

function(
   app,
   profileModel,
   Tpl
)
{

    var v = Backbone.View.extend(
    {
        className: 'profilebar hidden-xs',

        events: {

        },

        initialize: function(o)
        {
            this.tpl = _.template(Tpl);
            profileModel.bind('change', function(c) {
          		this.render();
          	}, this);

        },

        render: function() {
            this.$el.html(this.tpl({ profile: profileModel }));
            return this.$el;
        }
    });

    return v;
});
