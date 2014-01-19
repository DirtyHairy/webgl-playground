attribute vec4 a_vertexPosition;
attribute vec4 a_vertexColor;

varying vec3 v_normal;
varying vec4 v_position;

uniform mat4 u_matrixVP;
uniform mat4 u_matrixM;

void main() {
    gl_Position = u_matrixVP * u_matrixM * a_vertexPosition;
    v_position = u_matrixM * a_vertexPosition;
    v_normal = (u_matrixM * vec4(a_vertexPosition.xyz, 0.0)).xyz;
}