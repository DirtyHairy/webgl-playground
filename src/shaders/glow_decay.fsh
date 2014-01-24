#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

varying vec2 v_textureCoordinates;

uniform sampler2D u_decayTexture;
uniform float u_viewportHeight;
uniform float u_viewportWidth;
uniform float u_bleedFactor;
uniform float u_exponentialDecay;
uniform float u_linearDecay;

float getBrightness(float s, float t) {
    return (
            s >= 0.0 && t >= 0.0 &&
            s <= 1.0 && t <= 1.0
        ) ?
        texture2D(u_decayTexture,vec2(s, t)).r : 0.0;
}

void main() {
    float   s = v_textureCoordinates.s,
            t = v_textureCoordinates.t,
            ds = 1.0 / u_viewportWidth,
            dt = 1.0 / u_viewportHeight;
            
    float   factorCenter = 1.0 - u_bleedFactor,
            factorBorder = u_bleedFactor / 8.0;

    float   brightness = factorCenter * getBrightness(s, t) +
            factorBorder * (
                getBrightness(s-ds, t-dt) + getBrightness(s-ds, t) +
                getBrightness(s-ds, t+dt) + getBrightness(s, t-dt) +
                getBrightness(s, t+dt) + getBrightness(s+ds, t-dt) +
                getBrightness(s+ds, t) + getBrightness(s+ds, t+dt)
            );
  
    brightness *= u_exponentialDecay;
    brightness -= u_linearDecay;

    brightness = max(min(brightness, 1.0), 0.0);

    gl_FragColor = vec4(brightness, brightness, brightness, 1.0);
}
