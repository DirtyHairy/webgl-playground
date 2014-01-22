precision mediump float;

uniform sampler2D u_decayTexture;
uniform float u_viewportHeight;
uniform float u_viewportWidth;

void main() {
    vec3 color = 0.95 * texture2D(u_decayTexture,
        vec2(gl_FragCoord.x / u_viewportWidth, gl_FragCoord.y / u_viewportHeight)).rgb;
    
    gl_FragColor = vec4(color, 1.0);
}