define(['underscore', 'jquery', 'webgl', 'geometry', 'glmatrix',
        'text!shaders/sphere.vsh', 'text!shaders/sphere.fsh'],
    function(_, $, WebGl, geometry, glmatrix, vshSource, fshSource)
{
    "use strict";

    var Sphere = function(canvas, complexityPicker) {
        var me = this;
        
        me._canvas = canvas;
        me._complexityPicker = complexityPicker && $(complexityPicker);
    };
    
    _.extend(Sphere.prototype, {
        _canvas: null,
        
        _webGl: null,
        _shaderProgram: null,
        
        _vertexBuffer: null,
        _elementBuffers: null,
        _triangleCounts: null,
        
        _polyhedronIndex: null,
      
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
        
        _createPolyhedra: function() {
            var me = this,
                gl = me._webGl.getContext(),
                polyhedra = [],
                i;
                
            for (i = 0; i <= 5; i++) {
                polyhedra.push(new geometry.Polyhedron(i));
            }
            
            var vertices = [];
            _.each(_.last(polyhedra).getPointCollection().getAll(), function(point) {
                vertices.push(point.x, point.y, point.z);
            });
            
            me._vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, me._vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
            
            var elements, elementBuffer;
            me._elementBuffers = [];
            me._triangleCounts = [];
            
            for (i =0; i <= 5; i++) {
                elements = [];
                
                _.each(polyhedra[i].getTriangles(), function(triangle) {
                    var p = triangle.getPoints();
                    
                    elements.push(p[0].id, p[1].id, p[2].id);
                });
                
                elementBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);
                
                me._elementBuffers[i] = elementBuffer;
                me._triangleCounts[i] = polyhedra[i].getTriangles().length;
            }
        },
        
        _bindVertices: function (triangles) {
            var me = this;
            
            me._webGl.bindBufferToAttribute(me._shaderProgram, me._vertexBuffer, 3, 'a_vertexPosition');
        },
       
        _draw: function(triangles) {
            var me = this,
                gl = me._webGl.getContext();
            
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            gl.drawElements(gl.TRIANGLES, 3 * me._triangleCounts[me._polyhedronIndex], gl.UNSIGNED_SHORT, 0);
        },
        
        _animate: function(triangles) {
            var me = this,
                velocityX = 300 / 2000,
                velocityY = 90 / 2000,
                velocityZ = 45 / 2000,
                velocityLight = 10 / 1000,
                ticks = (new Date()).getTime();
            
            function handler() {
                var newTicks = (new Date()).getTime(),
                    delta = newTicks - ticks,
                    lightAngle = 2 * Math.PI / 360 * delta * velocityLight;
                
                me._setupMatrixM(delta*velocityX, delta*velocityY, delta*velocityZ);
                me._setLightPosition(2 * Math.sin(lightAngle), 2 * Math.cos(lightAngle), -0.5);

                me._draw(triangles);
                
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
        
        _selectPolyhedron: function(index) {
            var me = this,
                gl = me._webGl.getContext();
            
            if (me._elementBuffers[index]) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, me._elementBuffers[index]);
                me._polyhedronIndex = index;
            }
        },
        
        _updatePolyhedronIndex: function() {
            var me = this;
            
            me._selectPolyhedron(me._complexityPicker.val());
        },
        
        run: function() {
            var me = this;
            
            me._webGl = new WebGl(me._canvas);
            
            var gl = me._webGl.getContext();
            
            me._shaderProgram = me._createShaderProgram(),
            
            gl.enable(gl.DEPTH_TEST);
            gl.useProgram(me._shaderProgram);
            
            me._createPolyhedra();
            
            me._bindVertices();
            me._selectPolyhedron(5);
            
            if (me._complexityPicker) {
                me._complexityPicker.change(_.bind(me._updatePolyhedronIndex, me));
                me._updatePolyhedronIndex();
            }
            
            me._setupMatrixVP();
        
            me._animate();
        }
    });
    
    return Sphere;
});