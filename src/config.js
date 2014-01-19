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
        jquery: '../bower_components/jquery/jquery.min',
        underscore: '../bower_components/lodash/dist/lodash.min',
        glmatrix: '../bower_components/gl-matrix/dist/gl-matrix-min',
        webglutils: '../vendor/webgl-utils',
        text: '../bower_components/text/text'
    }
});

if (window.main) window.main();