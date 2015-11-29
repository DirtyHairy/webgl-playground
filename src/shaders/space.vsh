attribute vec2 a_vertexPosition;
attribute vec4 a_directionVector;

uniform mat4 u_rotationMatrix;

varying vec4 v_directionVector;

void main() {
    gl_Position = vec4(a_vertexPosition, 1.0, 1.0);
    v_directionVector = u_rotationMatrix * a_directionVector;
}
