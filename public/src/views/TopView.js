define([
  'app',
  'models/session',
  'printers',
  'views/LoginView',
  'views/RegisterView',
  'views/SidebarView',
  'views/UserView',
  'views/ProfilebarView',
  'views/browser/BrowserView',
  'views/printers/PrintersView',
  'views/printers/RegisterPrinterView',
  'views/jobs/JobsView',
  'views/project/ProjectView',
  'views/browser/SearchBarView'
],

function(
   app,
   sessionModel,
   printers,
   LoginView,
   RegisterView,
   SidebarView,
   UserView,
   ProfilebarView,
   BrowserView,
   PrintersView,
   RegisterPrinterView,
   JobsView,
   ProjectView,
   SearchBarView
)
{

  var v = Backbone.View.extend(
  {
    id: 'topView',

    className: 'index-view container-fluid',

    initialize: function()
    {
      this.listenTo(sessionModel, 'change:authenticated', this.render)
      printers.scan(sessionModel.get('printers'));
    },

    events: {
    },

    render: function()
    {
      if (app.protected == true && !sessionModel.get('authenticated')) {
        Backbone.history.navigate('login', true);
      }

      this.$el.html('<div class="container-fluid"><div class="row"><div class="sidebar-wrapper"></div><div class="col-sm-12 page"></div></div></div>');
      var e = this.$el.find('.page');
      var sb = this.$el.find('.sidebar-wrapper');

      if (sessionModel.get('authenticated')) {
        var s = this.loadView(new SidebarView({"printers":printers}), 'sidebar');
        this.$el.find('.sidebar-wrapper').html(s.render());

        //var p = this.loadView(new ProfilebarView(), 'profile_bar');
        //e.append(p.render());
      }

      if (app.selectedView == 'login') {
        var v = this.loadView(new LoginView(), 'login');
        e.append(v.render());
      }
      else if (app.selectedView == 'register') {
        var v = this.loadView(new RegisterView(), 'register');
        e.append(v.render());
      }
      else if (app.selectedView == 'project') {
        var v = this.loadView(new ProjectView({"printers":printers}), 'login');
        e.append(v.render());
      }
      else if (app.selectedView == 'browser') {
        var b = this.loadView(new BrowserView(), 'browser');
        e.append(b.render());
      }
      else if (app.selectedView == 'printers') {
        var b = this.loadView(new PrintersView(), 'printers');
        e.append(b.render());
      }
      else if (app.selectedView == 'register-printer') {
        var b = this.loadView(new RegisterPrinterView(), 'register-printer');
        e.append(b.render());
      }
      else if (app.selectedView == 'jobs') {
        var b = this.loadView(new JobsView(), 'jobs');
        e.append(b.render());
      }
      else if (app.selectedView == 'user') {
        var b = this.loadView(new UserView(), 'user');
        e.append(b.render());
      }
      return this.$el;
    }
  });
  return v;
});
