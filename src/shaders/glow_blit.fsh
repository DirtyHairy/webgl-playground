#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

uniform sampler2D u_blitTexture;
varying vec2 v_textureCoordinates;

void main() {
    gl_FragColor = texture2D(u_blitTexture, v_textureCoordinates);
}
