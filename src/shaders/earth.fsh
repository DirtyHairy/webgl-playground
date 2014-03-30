precision mediump float;

varying vec4 v_position;
varying vec3 v_normal;
varying vec4 v_originalPosition;

uniform vec3 u_lightPosition;
uniform samplerCube u_textureUnit;

void main() {
    vec3 lightDistance =  v_position.xyz / v_position.w - u_lightPosition;
    float lightFactor = 0.1 + max(
        -dot(v_normal, lightDistance) / length(v_normal) / length(lightDistance), 0.0);

    gl_FragColor = vec4(lightFactor / 1.1 *
        textureCube(u_textureUnit, v_originalPosition.xyz / v_originalPosition.w).rgb, 1.0);
}
