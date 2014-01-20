attribute vec2 a_vertexPosition;

uniform float u_pointSize;
uniform float u_viewportHeight;
uniform float u_viewportWidth;

void main() {
    gl_Position = vec4(
        2.0 * a_vertexPosition.x / u_viewportWidth - 1.0,
        2.0 * a_vertexPosition.y / u_viewportHeight - 1.0,
        1.0, 1.0);
    gl_PointSize = u_pointSize;
}