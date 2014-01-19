define(['geometry/point', 'geometry/pointCollection', 'geometry/edge',
        'geometry/triangle', 'geometry/polyhedron'],
    function(Point, PointCollection, Edge, Triangle, Polyhedron)
{
    "use strict";
    
    return {
        Point: Point,
        PointCollection: PointCollection,
        Edge: Edge,
        Triangle: Triangle,
        Polyhedron: Polyhedron
    };
});