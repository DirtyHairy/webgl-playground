/* global requirejs */

requirejs.config({
    baseUrl: 'src',
    shim: {
        jquery: {
            exports: '$'
        },
        underscore: {
            exports: '_'
        },
        webglutils: {
            exports: 'WebGLUtils'
        }
    },
    paths: {
        jquery: '../bower_components/jquery/dist/jquery.min',
        underscore: '../bower_components/lodash/dist/lodash.min',
        glmatrix: '../bower_components/gl-matrix/dist/gl-matrix-min',
        webglutils: '../vendor/webgl-utils',
        text: '../bower_components/text/text',
        q: '../bower_components/q/q'
    },
    waitSeconds: 20
});

if (window.main) window.main();
