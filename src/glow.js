define(['jquery', 'underscore', 'webgl',
        'text!shaders/glow_point.vsh', 'text!shaders/glow_point.fsh',
        'text!shaders/glow_post.vsh', 'text!shaders/glow_blit.fsh',
        'text!shaders/glow_decay.fsh'],
    function($, _, WebGl, pointVshSource, pointFshSource, postVshSource,
        blitFshSource, decayFshSource)
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
        _blitShader: null,
        _decayShader: null,
        
        _vertexBuffer: null,
        _postVertexBuffer: null,
        
        _textures: null,
        _depthBuffers: null,
        _frameBuffers: null,
        
        _blitIndex: 1,
        _decayIndex: 0,
        
        _pointQueue: null,
        
        _createShaderProgram: function(vshSource, fshSource) {
            var me = this,
                webgl = me._webgl,
                gl = webgl.getContext(),
                vertexShader = webgl.createShaderFromSource(vshSource, gl.VERTEX_SHADER),
                fragmentShader = webgl.createShaderFromSource(fshSource, gl.FRAGMENT_SHADER),
                shaderProgram = webgl.createAndLinkShaderProgram(vertexShader, fragmentShader);
            
            return shaderProgram;
        },
        
        _createVertexBuffers: function() {
            var me = this,
                webgl = me._webgl,
                gl = webgl.getContext(),
                postProcessingVertices = [
                        -1, -1,
                        -1, 1,
                        1, 1,
                        1, -1
                    ];
            
            me._vertexBuffer = gl.createBuffer();
            me._postVertexBuffer = gl.createBuffer();
            
            gl.bindBuffer(gl.ARRAY_BUFFER, me._postVertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(postProcessingVertices), gl.STATIC_DRAW);
        },
        
        _createTextures: function() {
            var me = this,
                gl = me._webgl.getContext(),
                texture;
            
            me._textures = [];
            
            for (var i = 0; i < 2; i++) {
                texture = gl.createTexture();
        
                gl.activeTexture(gl['TEXTURE' + i]);        
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.drawingBufferWidth,
                    gl.drawingBufferHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                    
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                
                me._textures.push(texture);
            }
        },
        
        _createDepthBuffers: function() {
            var me = this,
                gl = me._webgl.getContext(),
                renderbuffer;

            me._depthBuffers = [];

            for (var i = 0; i < 2; i++) {
                renderbuffer = gl.createRenderbuffer();
                
                gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
                    gl.drawingBufferWidth, gl.drawingBufferHeight);
                
                me._depthBuffers.push(renderbuffer);
            }
        },
        
        _createFrameBuffers: function() {
            var me = this,
                gl = me._webgl.getContext(),
                framebuffer;
            
            me._createTextures();
            me._createDepthBuffers();
            
            me._frameBuffers = [];
            
            for (var i = 0; i < 2; i++) {
                framebuffer = gl.createFramebuffer();
                
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
                    gl.TEXTURE_2D, me._textures[i], 0);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
                    gl.RENDERBUFFER, me._depthBuffers[i]);
                
                if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                    throw new Error('unable to setup frame buffers');
                }
                
                gl.clearColor(0, 0, 0, 1);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                
                me._frameBuffers.push(framebuffer);
            }
        },
        
        _configureViewportDimensions: function() {
            var me = this,
                gl = me._webgl.getContext();
            
            _.each([me._pointShader, me._blitShader, me._decayShader], function(shader) {
                var widthLocation = gl.getUniformLocation(shader, 'u_viewportWidth'),
                    heightLocation = gl.getUniformLocation(shader, 'u_viewportHeight');
            
                gl.useProgram(shader);
            
                gl.uniform1f(widthLocation, gl.drawingBufferWidth);
                gl.uniform1f(heightLocation, gl.drawingBufferHeight); 
            });
        },
        
        _setPointSize: function(size) {
            var me = this;
            
            me._webgl.setUniformFloat(me._pointShader, size, 'u_pointSize');
        },
        
        _setBleedFactor: function(bleedFactor) {
            var me = this;
            
            me._webgl.setUniformFloat(me._decayShader, bleedFactor, 'u_bleedFactor');
        },
        
        _setExponentialDecay: function(exponentialDecay) {
            var me = this;
            
            me._webgl.setUniformFloat(me._decayShader, exponentialDecay, 'u_exponentialDecay');
        },
        
        _setLinearDecay: function(linearDecay) {
            var me = this;
            
            me._webgl.setUniformFloat(me._decayShader, linearDecay, 'u_linearDecay');
        },
        
        _setBlitTexture: function(textureIndex) {
            var me = this,
                gl = me._webgl.getContext(),
                location = gl.getUniformLocation(me._blitShader, 'u_blitTexture');
            
            gl.useProgram(me._blitShader);
            gl.uniform1i(location, textureIndex);
        },
        
        _setDecayTexture: function(textureIndex) {
            var me = this,
                gl = me._webgl.getContext(),
                location = gl.getUniformLocation(me._decayShader, 'u_decayTexture');
            
            gl.useProgram(me._decayShader);
            gl.uniform1i(location, textureIndex);
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
        
        _blit: function() {
            var me = this,
                gl = me._webgl.getContext();
            
            me._setBlitTexture(me._blitIndex);
            
            gl.useProgram(me._blitShader);
            me._webgl.bindBufferToAttribute(me._blitShader, me._postVertexBuffer, 2, 'a_vertexPosition');
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        },
        
        _decay: function() {
            var me = this,
                gl = me._webgl.getContext();
            
            me._setDecayTexture(me._decayIndex);
            
            gl.useProgram(me._decayShader);
            me._webgl.bindBufferToAttribute(me._decayShader, me._postVertexBuffer, 2, 'a_vertexPosition');
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        },
        
        _draw: function() {
            var me = this,
                gl = me._webgl.getContext();
            gl.bindFramebuffer(gl.FRAMEBUFFER, me._frameBuffers[me._blitIndex]);
            
            me._decay();
            
            if (me._pointQueue && me._pointQueue.length > 0) {
                me._drawPoints(me._pointQueue);
                
                me._pointQueue = null;
            }
            
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            
            me._blit();
            
            me._swapBuffers();
        },
        
        _swapBuffers: function() {
            var me = this,
                tmp = me._blitIndex;
            
            me._blitIndex = me._decayIndex;
            me._decayIndex = tmp;
        },
        
        _animate: function() {
            var me = this;
            
            var handler = function() {
                me._draw();
                setTimeout(_.bind(me._animate, me), 33);
            };
            
            handler();
        },
        
        run: function() {
            var me = this;
            
            me._webgl = new WebGl(me._canvas);
            
            me._pointShader = me._createShaderProgram(pointVshSource, pointFshSource);
            me._blitShader = me._createShaderProgram(postVshSource, blitFshSource);
            me._decayShader = me._createShaderProgram(postVshSource, decayFshSource);
            
            me._configureViewportDimensions();
            me._createVertexBuffers();
            me._createFrameBuffers();
            
            me._setPointSize(100);
            me._setBleedFactor(0.8);
            me._setExponentialDecay(0.99);
            me._setLinearDecay(0.0005);
            
            me._pointQueue = [[100, 100], [200, 200], [300, 200]];
            me._animate();
        }
    });
    
    return Glow;
    
});