define([
  'app',

  'models/session',
  'models/profile'
],

function(
  app,

  sessionModel,
  profileModel
)
{
  var c = Backbone.Collection.extend({


    url: '/api/mmfactory/collections',
    sync: app.sync,


  });

  return new c;
});
