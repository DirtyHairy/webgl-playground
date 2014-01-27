define(['jquery', 'underscore', 'webgl',
        'text!shaders/glow_point.vsh', 'text!shaders/glow_point.fsh',
        'text!shaders/glow_post.vsh', 'text!shaders/glow_blit.fsh',
        'text!shaders/glow_decay.fsh'],
    function($, _, WebGl, pointVshSource, pointFshSource, postVshSource,
        blitFshSource, decayFshSource)
{
    
    "use strict";
    
    var Renderer = function(canvas) {
        var me = this;
        
        me._canvas = canvas;
        
        me._webgl = new WebGl(me._canvas);
        
        me._pointShader = me._createShaderProgram(pointVshSource, pointFshSource);
        me._blitShader = me._createShaderProgram(postVshSource, blitFshSource);
        me._decayShader = me._createShaderProgram(postVshSource, decayFshSource);
        
        me._configureViewportDimensions();
        me._createVertexBuffers();
        me._createFrameBuffers();
        
        me.setPointSize(100);
        me.setBleedFactor(0.8);
        me.setExponentialDecay(0.98);
        me.setLinearDecay(0.005);
        
        me._position = {
            x: 0,
            y: 0
        };
        me._pointQueue = [];
    };
    
    _.extend(Renderer.prototype, {
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
        _position: null,
        
        _pointSize: null,
        _bleedFactor: null,
        _exponentialDecay: null,
        _linearDecay: null,
        
        _engaged: false,
        
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
            
                if (widthLocation) {
                    gl.uniform1f(widthLocation, gl.drawingBufferWidth);
                }
                if (heightLocation) {
                    gl.uniform1f(heightLocation, gl.drawingBufferHeight); 
                }
            });
        },
        
        getPointSize: function() {
            return this._pointSize;
        },
        
        setPointSize: function(size) {
            var me = this;
            
            if (size >= 0 && size <= 300) {
                me._pointSize = size;
                me._webgl.setUniformFloat(me._pointShader, size, 'u_pointSize');
            }
            
            return me._pointSize;
        },
        
        setBleedFactor: function(bleedFactor) {
            var me = this;
        
            if (bleedFactor >= 0 && bleedFactor <= 1) {
                me._bleedFactor = bleedFactor;
                me._webgl.setUniformFloat(me._decayShader, bleedFactor, 'u_bleedFactor');   
            }
            
            return me._bleedFactor;
        },
        
        getBleedFactor: function() {
            return this._bleedFactor;
        },
        
        setExponentialDecay: function(exponentialDecay) {
            var me = this;
        
            if (exponentialDecay >= 0 && exponentialDecay <= 1) {
                me._exponentialDecay = exponentialDecay;
                me._webgl.setUniformFloat(me._decayShader, exponentialDecay, 'u_exponentialDecay');
            }    
            
            return me._exponentialDecay;
        },
        
        getExponentialDecay: function() {
            return this._exponentialDecay;
        },
        
        setLinearDecay: function(linearDecay) {
            var me = this;
        
            if (linearDecay >= 0 && linearDecay <= 1) {
                me._linearDecay = linearDecay;
                me._webgl.setUniformFloat(me._decayShader, linearDecay, 'u_linearDecay');
            }
            
            return me._linearDecay;
        },
        
        getLinearDecay: function() {
            return this._linearDecay;
        },
        
        drawAt: function(x, y) {
            var me = this;
            
            if (typeof(x) === 'undefined') x = me._position.x;
            if (typeof(y) === 'undefined') y = me._position.y;
            
            me._pointQueue.push(x, y);
            
            return me;
        },
        
        engage: function() {
            var me = this;
            
            me._engaged = true;
            
            return me;
        },
        
        disengage: function() {
            var me = this;
            
            me._engaged = false;
            
            return me;
        },
        
        engaged: function() {
            return this._engaged;
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
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STREAM_DRAW);
            
            gl.useProgram(me._pointShader);
            webgl.bindBufferToAttribute(me._pointShader, me._vertexBuffer, 2, 'a_vertexPosition');
            gl.drawArrays(gl.POINTS, 0, points.length / 2);
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
                
                me._pointQueue.splice(0, me._pointQueue.length);
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
                if (me._engaged) {
                    me.drawAt();
                }
                me._draw();
                setTimeout(_.bind(me._animate, me), 33);
            };
            
            handler();
        },
        
        moveTo: function(x, y) {
            var me = this;
            
            me._position.x = x;
            me._position.y = y;
            
            return me;
        },
        
        drawTo: function(newx ,newy) {
            var me = this,
                oldx = me._position.x,
                oldy = me._position.y,
                deltax = newx - oldx,
                deltay = newy - oldy,
                dx = deltax >= 0 ? 1 : -1,
                dy = deltay >= 0 ? 1 : -1,
                x, y, slope;
            
            me.moveTo(newx, newy);
            
            if (deltax === deltay === 0) return me.drawAt();
            
            if (Math.abs(deltax) >= Math.abs(deltay)) {
                slope = deltay / deltax;
                for (x = oldx; x !== newx; x += dx) {
                    me._pointQueue.push(x, oldy + (x - oldx) * slope);
                }
            } else {
                slope = deltax / deltay;
                for (y = oldy; y !== newy; y += dy) {
                    me._pointQueue.push(oldx + (y - oldy) * slope, y);
                }
            }
            
            return me;
        },
        
        start: function() {
            var me = this;
            
            me._animate();
        }
    });
    
    return Renderer;
    
});
