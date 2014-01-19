define(['underscore', 'geometry/point', 'geometry/pointCollection',
        'geometry/edge', 'geometry/triangle'],
    function(_, Point, PointCollection, Edge, Triangle) 
{
    "use strict";
    
    var points = new PointCollection(),
        polyhedra = [];
    
    function createRhombus() {
        var i;
        
        points.add([
            new Point(0, 0, 1),
            new Point(1, 0 ,0),
            new Point(0, 0, -1),
            new Point(-1, 0, 0),
            new Point(0, 1, 0),
            new Point(0, -1, 0)
        ]);
        
        var edges = [
            new Edge(points.get(0), points.get(1), points),
            new Edge(points.get(1), points.get(2), points),
            new Edge(points.get(2), points.get(3), points),
            new Edge(points.get(3), points.get(0), points),
        ];
        
        for (i = 0; i < 4; i++) {
            edges.push(new Edge(points.get(i), points.get(4), points));
        }
        
        for (i = 0; i < 4; i++) {
            edges.push(new Edge(points.get(i), points.get(5), points));
        }
        
        var triangles = [
            new Triangle(edges[0], edges[4], edges[5]),
            new Triangle(edges[1], edges[5], edges[6]),
            new Triangle(edges[2], edges[6], edges[7]),
            new Triangle(edges[3], edges[7], edges[4]),
            new Triangle(edges[0], edges[8], edges[9]),
            new Triangle(edges[1], edges[9], edges[10]),
            new Triangle(edges[2], edges[10], edges[11]),
            new Triangle(edges[3], edges[11], edges[8])
        ];
        
        return triangles;
    }
    
    function createPolyhedron(order) {
        if (order < 0 || order + 1 <= polyhedra.length) {
            return;
        }
        
        if (polyhedra.length === 0) {
            polyhedra[0] = createRhombus();
        }
        
        for (var i = 1; i <= order; i++) {
            polyhedra[i] = refinePolyhedron(polyhedra[i-1]);
        }
    }
    
    function refinePolyhedron(poly) {
        var newPoly = [];
        
        _.each(poly, function(triangle) {
            Array.prototype.push.apply(newPoly, triangle.getChildren());
        });
        
        points.normalize();
        
        return newPoly;
    }
    
    function getPolyhedron(order) {
        if (order < 0) {
            return null;
        }
        
        if (order + 1 > polyhedra.length) {
            createPolyhedron(order);
        }
        
        return polyhedra[order];
    }
    
    var Polyhedron = function(order) {
        var me = this;
        
        me._triangles = getPolyhedron(order);
    };
    
    _.extend(Polyhedron.prototype, {
        _triangles: null,
        
        getTriangles: function() {
            return this._triangles;
        },
        
        getPointCollection: function() {
            return points;
        }
    });
    
    return Polyhedron;
});