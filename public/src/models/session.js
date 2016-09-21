define([
    'localStorage'
],
function(
  localStorage
)
{
  var m = Backbone.Model.extend(
  {
    id: 'user',

    localStorage: new Backbone.LocalStorage('user'),

    defaults: {
      authenticated: false,
      jwt: null
    },

    getId: function()
    {
      if (this.get('authenticated')) {
        var jwt = this.get('jwt').split(".");
        var data = JSON.parse(atob(jwt[1]));
        return data.id;
      }
    },

    initialize: function()
    {

    },

    parse: function(e)
    {
      if (e && e.constructor === Array && e.length > 0)
        e = e[0];

      return e
    }
  })

  return new m();
});
