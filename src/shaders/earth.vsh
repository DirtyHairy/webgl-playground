attribute vec4 a_vertexPosition;
attribute vec4 a_vertexColor;

varying vec3 v_normal;
varying vec4 v_position;
varying vec4 v_originalPosition;

uniform mat4 u_matrixVP;
uniform mat4 u_matrixM;

void main() {
    v_position = u_matrixM * a_vertexPosition;
    v_originalPosition = a_vertexPosition;
    gl_Position = u_matrixVP * v_position;
    v_normal = (u_matrixM * vec4(a_vertexPosition.xyz, 0.0)).xyz;
}
