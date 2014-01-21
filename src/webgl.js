define(['underscore', 'webglutils', 'glmatrix'],
    function(_, WebGLUtils)
{
    "use strict";
    
    var Gl = function(canvas) {
        var me = this;
        
        me._gl = WebGLUtils.setupWebGL(canvas);
    };
    
    _.extend(Gl.prototype, {
        _gl: null,
        
        getContext: function() {
            return this._gl;
        },
        
        createShaderFromSource: function(source, type) {
            var me = this,
                gl = me.getContext(),
                shader = gl.createShader(type);
        
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
        
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.log('shader compile failed!');
                console.log(gl.getShaderInfoLog(shader));
                console.log(source);
                
                gl.deleteShader(shader);
                
                throw new Error('shader compile failed');
            }
        
            return shader;
        },
        
        createAndLinkShaderProgram: function(vertexShader, fragmentShader) {
            var me = this,
                gl = me.getContext(),
                program = gl.createProgram();
        
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
        
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.log('program link failed!');
                console.log(gl.getProgramInfoLog(program));
                
                gl.deleteProgram(program);
                
                throw new Error('program link failed');
            }
        
            return program;
        },
        
        bindMatrixUniform: function(program, matrix, name) {
            var me = this,
                gl = me.getContext(),
                location = gl.getUniformLocation(program, name);
        
            if (location === null) throw new Error('unable to determine uniform location');
        
            gl.useProgram(program);
            gl.uniformMatrix4fv(location, false, matrix);
        },
        
        bindBufferToAttribute: function(program, buffer, itemSize, name) {
            var me = this,
                gl = this.getContext(),
                location = gl.getAttribLocation(program, name);
        
            if (location === null) throw new Error('Unable to determine attribute location');
        
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.vertexAttribPointer(location, itemSize, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(location);
        }
    });
    
    return Gl;
});