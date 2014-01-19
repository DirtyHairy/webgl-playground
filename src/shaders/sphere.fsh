precision mediump float;

varying vec4 v_position;
varying vec3 v_normal;

uniform vec3 u_lightPosition;

void main() {
    vec3 lightDistance = v_position.xyz / v_position.w - u_lightPosition;
    float lightFactor = 0.05 + max(
        -dot(v_normal, lightDistance) / length(v_normal) / length(lightDistance), 0.0);

    gl_FragColor = vec4(lightFactor / 1.05  * vec3(1.0, 1.0, 1.0), 1.0);
}