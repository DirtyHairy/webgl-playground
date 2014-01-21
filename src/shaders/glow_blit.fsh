precision mediump float;

uniform sampler2D u_blitTexture;
uniform float u_viewportHeight;
uniform float u_viewportWidth;

void main() {
    gl_FragColor = texture2D(u_blitTexture,
        vec2(gl_FragCoord.x / u_viewportWidth, gl_FragCoord.y / u_viewportHeight));
}