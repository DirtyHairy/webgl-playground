precision mediump float;

uniform sampler2D u_decayTexture;
uniform float u_viewportHeight;
uniform float u_viewportWidth;
uniform float u_bleedFactor;
uniform float u_exponentialDecay;
uniform float u_linearDecay;

float getBrightness(float x, float y) {
    return (
            x >= 0.0 && y >= 0.0 &&
            x < u_viewportWidth && y < u_viewportHeight
        ) ?
        texture2D(u_decayTexture,vec2(
            x / u_viewportWidth, y / u_viewportHeight
        )).r :
        0.0;
}

void main() {
    float   x = gl_FragCoord.x,
            y = gl_FragCoord.y;
            
    float   factorCenter = 1.0 - u_bleedFactor,
            factorBorder = u_bleedFactor / 8.0;
            
    float   brightness = factorCenter * getBrightness(x, y) +
            factorBorder * (
                getBrightness(x-1.0, y-1.0) + getBrightness(x-1.0, y) +
                getBrightness(x-1.0, y+1.0) + getBrightness(x, y-1.0) +
                getBrightness(x, y+1.0) + getBrightness(x+1.0, y-1.0) +
                getBrightness(x+1.0, y) + getBrightness(x+1.0, y+1.0)
            );
    
    brightness *= u_exponentialDecay;
    brightness -= u_linearDecay;
    
    brightness = max(min(brightness, 1.0), 0.0);

    gl_FragColor = vec4(brightness, brightness, brightness, 1.0);
}