precision mediump float;

uniform sampler2D u_blitTexture;
varying vec2 v_textureCoordinates;

void main() {
    gl_FragColor = texture2D(u_blitTexture, v_textureCoordinates);
}
