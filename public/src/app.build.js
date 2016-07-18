({
    appDir: "../",
    baseUrl: "src",
    dir: "../../public-build/",
    removeCombined: true,

    optimize: "uglify",

    inlineText: true,

    paths: {
      underscore: '../bower_components/underscore/underscore',
      backbone: '../bower_components/backbone/backbone',
      jquery: '../bower_components/jquery/dist/jquery',
      //templates: 'templates',
      moment: '../bower_components/moment/moment',
      bootstrap: '../bower_components/bootstrap/dist/js/bootstrap',
      threejs: '../bower_components/threejs/build',
      growl: '../bower_components/bootstrap-growl-injectable/jquery.bootstrap-growl',
      localStorage: '../bower_components/backbone.localStorage/backbone.localStorage'
    },

    modules: [
        {
            name: "main"
        }
    ]
})
