precision mediump float;

varying vec4 v_directionVector;

uniform samplerCube u_textureUnit;

void main() {
    gl_FragColor = vec4(textureCube(u_textureUnit, v_directionVector.xyz).rgb, 1.0);
}
