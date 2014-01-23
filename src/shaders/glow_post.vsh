attribute vec2 a_vertexPosition;
varying vec2 v_textureCoordinates;

void main() {
    gl_Position = vec4(a_vertexPosition, 1.0, 1.0);
    v_textureCoordinates = (a_vertexPosition + 1.0) / 2.0;
}
