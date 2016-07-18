define([
  'app',
  'collections/projects',
  'text!./templates/search-bar.html'
],

function(
   app,
   projectsCollection,
   Tpl
)
{

    var v = Backbone.View.extend(
    {
        className: 'searchbar',

        events:
        {
            'keyup input.search-field': 'onSearch'
        },

        initialize: function(o)
        {
            this.tpl = _.template(Tpl);
        },

        onSearch: function(e)
        {
            var s = $(e.currentTarget).val().trim();
            var filtered = projectsCollection.filter(function(item) {
                return item.get("originalname").toLowerCase().indexOf(s.toLowerCase()) > -1
            });
            app.channel.trigger('filter-projects', filtered);
        },

        render: function()
        {
            this.$el.html(this.tpl({}));
            return this.$el;
        }
    });

    return v;
});
