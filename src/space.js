define(['underscore', 'jquery', 'q', 'webgl', 'geometry', 'glmatrix',
        'text!shaders/space.vsh', 'text!shaders/space.fsh'],
    function(_, $, Q, WebGl, geometry, glmatrix, vshSource, fshSource)
{
    'use strict';

    function Space(canvas) {
        this._canvas = canvas;
    }

    _.extend(Space.prototype, {
        _canvas: null,
        _shaderProgram: null,

        _createShaderProgram: function() {
            var me = this,
                webGl = me._webGl,
                gl = webGl.getContext(),
                vertexShader = webGl.createShaderFromSource(vshSource, gl.VERTEX_SHADER),
                fragmentShader = webGl.createShaderFromSource(fshSource, gl.FRAGMENT_SHADER),
                program = webGl.createAndLinkShaderProgram(vertexShader, fragmentShader);

            return program;
        },

        _loadTexture: function() {
            var me = this,
                gl = me._webGl.getContext(),
                texture = me._webGl.createTextureCube({
                    minFilter: gl.LINEAR,
                    maxFilter: gl.LINEAR,
                    textureUnit: 0,
                    flipY: false
                });

                texture
                    .loadFace(texture.NEGX, 'res/sky/sky_negx.png')
                    .loadFace(texture.POSX, 'res/sky/sky_posx.png')
                    .loadFace(texture.POSY, 'res/sky/sky_posy.png')
                    .loadFace(texture.NEGY, 'res/sky/sky_negy.png')
                    .loadFace(texture.POSZ, 'res/sky/sky_posz.png')
                    .loadFace(texture.NEGZ, 'res/sky/sky_negz.png');

                return texture.ready();
        },

        _prepareBuffers: function() {
            var gl = this._webGl.getContext();

            this._vertexBuffer = gl.createBuffer();
            this._directionBuffer = gl.createBuffer();

            this._webGl.bindBufferToAttribute(this._shaderProgram, this._vertexBuffer, 2, 'a_vertexPosition');
            this._webGl.bindBufferToAttribute(this._shaderProgram, this._directionBuffer, 3, 'a_directionVector');
        },

        _loadVertices: function() {
            var gl = this._webGl.getContext();

            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -1, 1,   -1, -1,   1, 1,   1, -1
            ]), gl.STATIC_DRAW);
        },

        _loadDirections: function() {
            var gl = this._webGl.getContext(),
                aspect = gl.drawingBufferWidth / gl.drawingBufferHeight,
                dy = Math.tan(30 / 180 * Math.PI),
                dx = dy * aspect;

            gl.bindBuffer(gl.ARRAY_BUFFER, this._directionBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                -dx, dy, 1,   -dx, -dy, 1,   dx, dy, 1,   dx, -dy, 1
            ]), gl.STATIC_DRAW);
        },

        _setupRotationMatrix: function(angleX, angleY, angleZ) {
            var me = this,
                matrix = glmatrix.mat4.create(),
                deg2rad = 2 * Math.PI / 360;

            glmatrix.mat4.identity(matrix);
            glmatrix.mat4.rotateX(matrix, matrix, angleX * deg2rad);
            glmatrix.mat4.rotateY(matrix, matrix, angleY * deg2rad);
            glmatrix.mat4.rotateZ(matrix, matrix, angleZ * deg2rad);

            me._webGl.bindMatrixUniform(me._shaderProgram, matrix, 'u_rotationMatrix');
        },

        _setupUniforms: function() {
            var me = this,
                gl = me._webGl.getContext(),
                location = gl.getUniformLocation(me._shaderProgram, 'u_textureUnit');

            gl.uniform1i(location, me._texture.getTextureUnit());
        },

        _draw: function() {
            var me = this,
                gl = me._webGl.getContext();

            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        },


        _animate: function() {
            var me = this,
                velocityX = 30 / 16000,
                velocityY = 90 / 16000,
                velocityZ = 45 / 16000,
                ticks = (new Date()).getTime();

            function handler() {
                var newTicks = (new Date()).getTime(),
                    delta = newTicks - ticks;

                me._setupRotationMatrix(delta*velocityX, delta*velocityY, delta*velocityZ);

                me._draw();

                window.requestAnimFrame(handler);
            }

            handler();
        },

        _updateCanvasSize: function() {
            this._canvas.width = window.innerWidth;
            this._canvas.height = window.innerHeight;
            this._webGl.getContext().viewport(0, 0, this._canvas.width, this._canvas.height);
            this._loadDirections();
        },

        run: function() {
            var me = this;

            me._webGl = new WebGl(me._canvas);
            var gl = me._webGl.getContext();

            me._shaderProgram = me._createShaderProgram();
            gl.useProgram(me._shaderProgram);
            me._prepareBuffers();
            me._loadVertices();
            me._updateCanvasSize();

            window.addEventListener('resize', function() {
                me._updateCanvasSize();
            });

            me._loadTexture()
                .then(function() {
                    me._animate();
                });
            }
    });

    return Space;
});
