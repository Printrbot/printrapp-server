define([
    'app'
],
function(
    app
)
{
    var m = Backbone.Model.extend(
    {
        //urlRoot: '/api/printer-models/',
        //id: 'printer-models',
        defaults: {
          // printer
          'nozzle-diameter': 0.4,
          'print-center': "70,70",
          //'z-offset': 0,
          // fillament
          'filament-diameter': 1.75,
          'temperature': 205,
          'first-layer-temperature': 205,
          //'bed-temperature': 0,
          //'first-layer-bed-temperature': 0,
          // speed
          'travel-speed': 60,
          'perimeter-speed': 45,
          'small-perimeter-speed': 30,
          'infill-speed': 50,
          'solid-infill-speed': 30,
          'top-solid-infill-speed': 30,
          'bridge-speed': 40,
          'gap-fill-speed': 30,
          'first-layer-speed': 30,
          // acceleration

          // accuracy options
          'layer-height': 0.2,
          'first-layer-height': 0.3,
          'infill-every-layers': 1,
          'solid-infill-every-layers': 0,
          // print options
          'perimeters': 3,
          'top-solid-layers': 5,
          'bottom-solid-layers': 3,
          'fill-density': 20,
          'fill-angle': 45,
          'fill-pattern': 'line',
          //'before-layer-gcode ': '',
          //'layer-gcode': '',
          //'toolchange-gcode': '',
          'seam-position': 'aligned', // random/nearest/aligned
          'external-perimeters-first': 0,
          'only-retract-when-crossing-perimeters': 1,
          'solid-infill-below-area': 70,
          'infill-only-where-needed': 0,
          'infill-first': 0,
          // quality (slower slicing)
          'extra-perimeters': 1,
          'avoid-crossing-perimeters': 0,
          'thin-walls': 1,
          'overhangs': 1,
          // support material

          'raft-layers': 0,

          // Retraction options
          'retract-length': 1,
          'retract-speed': 20,
          'retract-restart-extra': 0,
          'retract-before-travel': 2,
          'retract-lift': 0,
          'retract-layer-change': 1,
          // cooling
          'cooling': 1,
          'min-fan-speed': 30,
          'max-fan-speed': 100,
          'bridge-fan-speed': 100,
          'min-print-speed': 30,
          'disable-fan-first-layers': 3,
          'fan-always-on': 0,
          //skirt
          'skirts': 3,
          'skirt-distance': 6,
          'skirt-height': 1,
          'min-skirt-length': 10,
          'brim-width': 0,
          // transform options
          'scale': 1,
          'rotate': 0,
          'duplicate': 1,
          'duplicate-grid': '1,1',
          'duplicate-distance': 6,
          'xy-size-compensation': 0,
          //
        },

        materials: {
          'PLA': {
            'temperature': 205,
            'first-layer-temperature': 205,
            'retract-length': 1,
            'perimeter-speed': 45,
            'small-perimeter-speed': 30,
            'infill-speed': 45,
            'solid-infill-speed': 45,
            'top-solid-infill-speed': 30,
            'bridge-speed': 40,
            'gap-fill-speed': 35,
            'first-layer-speed': 30
          },
          'NinjaFlex': {
            'temperature': 230,
            'first-layer-temperature': 230,
            'retract-length': 0,
            'perimeter-speed': 30,
            'small-perimeter-speed': 25,
            'infill-speed': 30,
            'solid-infill-speed': 30,
            'top-solid-infill-speed': 30,
            'bridge-speed': 30,
            'gap-fill-speed': 30,
            'first-layer-speed': 25,
            'extrusion-multiplier': 1.2
          },
          'SemiFlex': {
            'temperature': 230,
            'first-layer-temperature': 230,
            'retract-length': 0,
            'perimeter-speed': 30,
            'small-perimeter-speed': 25,
            'infill-speed': 30,
            'solid-infill-speed': 30,
            'top-solid-infill-speed': 30,
            'bridge-speed': 30,
            'gap-fill-speed': 30,
            'first-layer-speed': 25,
            'extrusion-multiplier': 1.2
          },
          'Nylon': {
            'temperature': 235,
            'first-layer-temperature': 235,
            'bed-temperature': 85,
            'first-layer-bed-temperature': 85,
            'perimeter-speed': 30,
            'small-perimeter-speed': 15,
            'infill-speed': 30,
            'solid-infill-speed': 30,
            'top-solid-infill-speed': 30,
            'bridge-speed': 30,
            'gap-fill-speed': 20,
            'first-layer-speed': 30,
            'min-fan-speed': 0,
            'max-fan-speed': 0,
            'brim-width':5
          },
          'ABS': {
            'temperature': 245,
            'first-layer-temperature': 245,
            'bed-temperature': 85,
            'first-layer-bed-temperature': 85,
            'perimeter-speed': 30,
            'small-perimeter-speed': 15,
            'infill-speed': 30,
            'solid-infill-speed': 30,
            'top-solid-infill-speed': 30,
            'bridge-speed': 30,
            'gap-fill-speed': 20,
            'first-layer-speed': 30,
            'min-fan-speed': 0,
            'max-fan-speed': 0,
            'brim-width':5
          },
          'Woodfill': {
            'temperature': 220,
            'first-layer-temperature': 220,
            'perimeter-speed': 30,
            'small-perimeter-speed': 15,
            'infill-speed': 30,
            'solid-infill-speed': 30,
            'top-solid-infill-speed': 30,
            'bridge-speed': 30,
            'gap-fill-speed': 20,
            'first-layer-speed': 30
          },
          'Bronze': {
            'temperature': 220,
            'first-layer-temperature': 220,
            'perimeter-speed': 30,
            'small-perimeter-speed': 15,
            'infill-speed': 30,
            'solid-infill-speed': 30,
            'top-solid-infill-speed': 30,
            'bridge-speed': 30,
            'gap-fill-speed': 20,
            'first-layer-speed': 30
          },
          'Copper': {
            'temperature': 220,
            'first-layer-temperature': 220,
            'perimeter-speed': 30,
            'small-perimeter-speed': 15,
            'infill-speed': 30,
            'solid-infill-speed': 30,
            'top-solid-infill-speed': 30,
            'bridge-speed': 30,
            'gap-fill-speed': 20,
            'first-layer-speed': 30
          },
          'Stainless': {
            'temperature': 220,
            'first-layer-temperature': 220,
            'perimeter-speed': 30,
            'small-perimeter-speed': 15,
            'infill-speed': 30,
            'solid-infill-speed': 30,
            'top-solid-infill-speed': 30,
            'bridge-speed': 30,
            'gap-fill-speed': 20,
            'first-layer-speed': 30
          },

        },

        acceleration: {
          'perimeter-acceleration': 0,
          'infill-acceleration': 0,
          'bridge-acceleration': 0,
          'first-layer-acceleration': 0,
          'default-acceleration': 0
        },

        support: {
          'support-material': 1,
          'support-material-speed': 40,
          'support-material-threshold': 0,
          'support-material-pattern': 'pillars',
          'support-material-spacing': 2.5,
          'support-material-angle': 0,
          'support-material-contact-distance': 0.2,
          'support-material-interface-layers': 3,
          'support-material-extrusion-width': 0
          //'dont-support-bridges': 1,
        },

        initialize: function()
        {

        }
    })

    return new m();
});
