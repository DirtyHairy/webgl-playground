precision mediump float;

void main() {
    if (length(gl_PointCoord - 0.5) > 0.25) discard;
    
    gl_FragColor = vec4(1., 1., 1., 1.);
}