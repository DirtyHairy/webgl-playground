define(['jquery', 'underscore', 'webgl',
        'text!shaders/glow_point.vsh', 'text!shaders/glow_point.fsh'],
    function($, _, WebGl, pointVshSource, pointFshSource)
{
    
    "use strict";
    
    var Glow = function(canvas) {
        var me = this;
        
        me._canvas = canvas;
    };
    
    _.extend(Glow.prototype, {
        _canvas: null,
        
        _webgl: null,
        
        _pointShader: null,
        
        _vertexBuffer: null,
        
        _createShaderProgram: function(vshSource, fshSource) {
            var me = this,
                webgl = me._webgl,
                gl = webgl.getContext(),
                vertexShader = webgl.createShaderFromSource(vshSource, gl.VERTEX_SHADER),
                fragmentShader = webgl.createShaderFromSource(fshSource, gl.FRAGMENT_SHADER),
                shaderProgram = webgl.createAndLinkShaderProgram(vertexShader, fragmentShader);
            
            return shaderProgram;
        },
        
        _createVertexBuffer: function() {
            var me = this,
                gl = me._webgl.getContext();
            
            me._vertexBuffer = gl.createBuffer();
        },
        
        _configureViewportDimensions: function() {
            var me = this,
                gl = me._webgl.getContext(),
                widthLocation = gl.getUniformLocation(me._pointShader, 'u_viewportWidth'),
                heightLocation = gl.getUniformLocation(me._pointShader, 'u_viewportHeight');
            
            gl.useProgram(me._pointShader);
            
            gl.uniform1f(widthLocation, gl.drawingBufferWidth);
            gl.uniform1f(heightLocation, gl.drawingBufferHeight);
        },
        
        _setPointSize: function(size) {
            var me = this,
                gl = me._webgl.getContext(),
                location = gl.getUniformLocation(me._pointShader, 'u_pointSize');
            
            gl.uniform1f(location, size);
        },
        
        _drawPoints: function(points) {
            var me = this,
                webgl = me._webgl,
                gl = webgl.getContext();
            
            gl.bindBuffer(gl.ARRAY_BUFFER, me._vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(_.flatten(points)), gl.STREAM_DRAW);
            
            gl.useProgram(me._pointShader);
            webgl.bindBufferToAttribute(me._pointShader, me._vertexBuffer, 2, 'a_vertexPosition');
            
            gl.drawArrays(gl.POINTS, 0, points.length);
        },
        
        _draw: function() {
            var me = this,
                gl = me._webgl.getContext();
                
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            me._setPointSize(70);
            me._drawPoints([[100, 100], [200, 200], [300, 200]]);
        },
        
        run: function() {
            var me = this;
            
            me._webgl = new WebGl(me._canvas);
            
            me._pointShader = me._createShaderProgram(pointVshSource, pointFshSource);
            me._configureViewportDimensions();
            me._createVertexBuffer();
            
            me._draw();
        }
    });
    
    return Glow;
    
});