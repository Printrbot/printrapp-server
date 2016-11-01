define([
  'app',
  'views/TopView'
],

function(
  app,
  TopView
)
{
  var AppRouter = Backbone.Router.extend(
  {
    initialize: function()
    {
      var that = this;
      this.topView = new TopView({el: $('#topView')});
    },

    routes:
    {
      '/': 'showBrowser',
      '': 'showBrowser',
      'browser':'showBrowser',
      'login':'showLogin',
      'register':'showRegister',
      'user':'showUser',
      'printers':'showPrinters',
      'printer/register': 'showRegisterPrinter',
      'jobs':'showJobs',
      'project/:id':'showProject',
      'thingiverse': 'showThingiverse',
      'materials': 'showMaterials',
      'thingiverse/:id': 'showThingiverse',
      'thingiverse/collection/:tvcid': 'showThingiverseCollection',
      'thingiverse/thing/:pid': 'showThingiverseThing',
      'logout':'logOut'
    },

    showLogin: function(e)
    {
      app.selectedView = 'login';
      app.protected = false;
      this.topView.render();
    },

    showRegister: function(e)
    {
      app.selectedView = 'register';
      app.protected = false;
      this.topView.render();
    },

    showUser: function(e)
    {
      app.selectedView = 'user';
      app.protected = true;
      this.topView.render();
    },

    showBrowser: function(e)
    {
      app.selectedView = 'browser';
      app.protected = true;
      this.topView.render();
    },

    showMaterials: function(e)
    {
      app.selectedView = 'materials';
      app.protected = true;
      this.topView.render();
    },

    showPrinters: function(e)
    {
      app.selectedView = 'printers';
      app.protected = true;
      this.topView.render();
    },

    showThingiverse: function(e)
    {
      app.selectedView = 'thingiverse';
      app.protected = true;
      this.topView.render();
    },

    showThingiverseCollection: function(tvcid)
    {
      if (!tvcid)
        Backbone.history.navigate('thingiverse', true)
      app.selectedView = 'thingiverse-collection';
      app.protected = true;
      app.selectedThingiverseCollection = tvcid
      this.topView.render();
    },

    showThingiverseThing: function(pid)
    {
      if (!pid)
        Backbone.history.navigate('thingiverse', true)

      app.selectedView = 'thingiverse-thing';
      app.protected = true;
      app.selectedThingiverseThing = pid;
      this.topView.render();
    },

    showRegisterPrinter: function(e)
    {
      app.selectedView = 'register-printer';
      app.protected = true;
      this.topView.render();
    },

    showJobs: function(e)
    {
      app.selectedView = 'jobs';
      app.protected = true;
      this.topView.render();
    },

    showProject: function(pid)
    {
      if (!pid)
        Backbone.history.navigate('browser', true)
      app.selectedView = 'project';
      app.protected = true;
      app.selectedProject = pid
      this.topView.render();
    },
    logOut: function()
    {
      app.logout();
    }
  });

  return AppRouter;
});
