define(['underscore', 'jquery', 'q', 'webgl', 'geometry', 'glmatrix',
        'text!shaders/earth.vsh', 'text!shaders/earth.fsh'],
    function(_, $, Q, WebGl, geometry, glmatrix, vshSource, fshSource)
{
    'use strict';

    var Earth = function(canvas) {
        var me = this;
        
        me._canvas = canvas;
    };
    
    _.extend(Earth.prototype, {
        _canvas: null,
        
        _webGl: null,
        _shaderProgram: null,
        
        _vertexBuffer: null,
        _elementBuffer: null,
        _triangleCount: null,
        _texture: null,
        
        _createShaderProgram: function() {
            var me = this,
                webGl = me._webGl,
                gl = webGl.getContext(),
                vertexShader = webGl.createShaderFromSource(vshSource, gl.VERTEX_SHADER),
                fragmentShader = webGl.createShaderFromSource(fshSource, gl.FRAGMENT_SHADER),
                program = webGl.createAndLinkShaderProgram(vertexShader, fragmentShader);
    
            return program;
        },
        
        _setupMatrixVP: function() {
            var me = this,
                webGl = me._webGl,
                gl = webGl.getContext(),
                matrix = glmatrix.mat4.create(),
                aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
        
            glmatrix.mat4.perspective(matrix, 45, aspect, 0.1, 100);
            webGl.bindMatrixUniform(me._shaderProgram, matrix, 'u_matrixVP');
        },
        
        _setupMatrixM: function(angleX, angleY, angleZ) {
            var me = this,
                matrix = glmatrix.mat4.create(),
                deg2rad = 2 * Math.PI / 360;
        
            glmatrix.mat4.identity(matrix);
            glmatrix.mat4.translate(matrix, matrix, [0, 0, -3]);
            glmatrix.mat4.rotateX(matrix, matrix, angleX * deg2rad);
            glmatrix.mat4.rotateY(matrix, matrix, angleY * deg2rad);
            glmatrix.mat4.rotateZ(matrix, matrix, angleZ * deg2rad);
            glmatrix.mat4.translate(matrix, matrix, [0.2, 0.2, -0.2]);
        
            me._webGl.bindMatrixUniform(me._shaderProgram, matrix, 'u_matrixM');
        },
        
        _loadEarthTexture: function() {
            var me = this,
                gl = me._webGl.getContext();

            var texture = me._webGl.createTextureCube({
                minFilter: gl.LINEAR_MIPMAP_LINEAR,
                maxFilter: gl.LINEAR
            });

            texture
                .loadFace(texture.NEGX, 'res/earth/negx.jpg')
                .loadFace(texture.POSX, 'res/earth/posx.jpg')
                .loadFace(texture.NEGY, 'res/earth/negy.jpg')
                .loadFace(texture.POSY, 'res/earth/posy.jpg')
                .loadFace(texture.NEGZ, 'res/earth/negz.jpg')
                .loadFace(texture.POSZ, 'res/earth/posz.jpg');

            me._texture = texture;

            return texture.ready();
        },

        _createSphere: function() {
            var me = this,
                gl = me._webGl.getContext(),
                sphere = new geometry.Polyhedron(5);
               
            var vertices = [];
            _.each(sphere.getPointCollection().getAll(), function(point) {
                vertices.push(point.x, point.y, point.z);
            });
            
            me._vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, me._vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            
            var elements = [];
            _.each(sphere.getTriangles(), function(triangle) {
                var p = triangle.getPoints();

                elements.push(p[0].id, p[1].id, p[2].id);
            });

            me._elementBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, me._elementBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);

            me._triangleCount = sphere.getTriangles().length;
        },
        
        _bindVertices: function () {
            var me = this;
            
            me._webGl.bindBufferToAttribute(me._shaderProgram, me._vertexBuffer, 3, 'a_vertexPosition');
        },
       
        _draw: function() {
            var me = this,
                gl = me._webGl.getContext();
            
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
            gl.drawElements(gl.TRIANGLES, 3 * me._triangleCount, gl.UNSIGNED_SHORT, 0);
        },
        
        _animate: function() {
            var me = this,
                velocityX = 300 / 8000,
                velocityY = 90 / 8000,
                velocityZ = 45 / 8000,
                velocityLight = 10 / 1000,
                ticks = (new Date()).getTime();
            
            function handler() {
                var newTicks = (new Date()).getTime(),
                    delta = newTicks - ticks,
                    lightAngle = 2 * Math.PI / 360 * delta * velocityLight;
                
                me._setupMatrixM(delta*velocityX, delta*velocityY, delta*velocityZ);
                me._setLightPosition(2 * Math.sin(lightAngle), 2 * Math.cos(lightAngle), -0.5);

                me._draw();
                
                window.requestAnimFrame(handler);
            }
            
            handler();
        },
        
        _setLightPosition: function(x, y, z) {
            var me = this,
                gl = me._webGl.getContext(),
                location = gl.getUniformLocation(me._shaderProgram, 'u_lightPosition');
                
            gl.uniform3f(location, x, y, z);
        },

        _setTextureUnit: function() {
            var me = this,
                gl = me._webGl.getContext(),
                location = gl.getUniformLocation(me._shaderProgram, 'u_textureUnit');
                
            gl.uniform1i(location, me._texture.getTextureUnit());
        },

        run: function() {
            var me = this;
            
            me._webGl = new WebGl(me._canvas);
            
            var gl = me._webGl.getContext();
            
            me._shaderProgram = me._createShaderProgram();
            
            gl.enable(gl.DEPTH_TEST);
            gl.useProgram(me._shaderProgram);
            
            me._loadEarthTexture().then(function() {

                me._createSphere();
                me._bindVertices();
                me._setTextureUnit();
                me._setupMatrixVP();

                me._animate();

            });
        }
    });
    
    return Earth;
});
