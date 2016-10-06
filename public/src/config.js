require.config(
{
  deps: ["main"],

  paths: {
    underscore: '../bower_components/underscore/underscore',
    backbone: '../bower_components/backbone/backbone',
    jquery: '../bower_components/jquery/dist/jquery',
    //templates: 'templates',
    moment: '../bower_components/moment/moment',
    bootstrap: '../bower_components/bootstrap/dist/js/bootstrap',
    threejs: '../bower_components/threejs/build',
    growl: '../bower_components/bootstrap-growl-injectable/jquery.bootstrap-growl',
    localStorage: '../bower_components/backbone.localStorage/backbone.localStorage',
    bootbox: '../bower_components/bootbox.js/bootbox'
    //backbone_modelbinder: '../bower_components/backbone.modelBinder/Backbone.ModelBinder'
  },

  config: {
    babel: {
      sourceMaps: "inline", // One of [false, 'inline', 'both']. See https://babeljs.io/docs/usage/options/
      fileExtension: ".js" // Can be set to anything, like .es6 or .js. Defaults to .jsx
    }
  },

  shim: {
    "backbone": {
        deps: ["underscore", "jquery"],
        exports: "Backbone"
    },
    /*
    "backbone_modelbinde": {
        deps: "backbone"
    },
    */
    "underscore": {
        exports: "_"
    },
    "jquery": {
        exports: "$"
    },
    "bootstrap": {
        deps: ["jquery"],
        exports: 'bootstrap'
    },
    "growl": ["jquery"],
    "libs/STLLoader": ["threejs/three"],
    "libs/TrackballControls": ["threejs/three"],
    //"libs/TransformControls": ["threejs/three"],
    "libs/STLExporter": ["threejs/three"],
    "main": ["backbone", "bootstrap"]
  }

});
