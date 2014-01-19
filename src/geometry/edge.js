define(['underscore', 'geometry/point'],
    function(_, Point)
{
    "use strict";
    
    var Edge = function(p1, p2, pointCollection) {
        var me = this;
        
        me._p1 = p1;
        me._p2 = p2;
        me._pointCollection = pointCollection;
    };
    
    _.extend(Edge.prototype, {
        _p1: null,
        _p2: null,
        _pointCOllection: null,
        
        _center: null,
        _child1: null,
        _child2: null,
        
        getP1: function() {
            return this._p1;
        },
        
        getP2: function() {
            return this._p2;
        },
        
        getPointCollection: function() {
            return this._pointCollection;
        },
        
        intersect: function(otherEdge) {
            var me = this;
            
            if (me._p1.id === otherEdge._p1.id) return me._p1;
            if (me._p1.id === otherEdge._p2.id) return me._p1;
            if (me._p2.id === otherEdge._p1.id) return me._p2;
            if (me._p2.id === otherEdge._p2.id) return me._p2;
            
            return null;
        },
        
        getCenter: function() {
            var me = this;
            
            if (!me._center) {
                me._divide();
            }
            
            return me._center;
        },
        
        _divide: function() {
            var me = this;
            
            me._center = new Point(
                (me._p1.x + me._p2.x) / 2,
                (me._p1.y + me._p2.y) / 2,
                (me._p1.z + me._p2.z) / 2
            );
            
            me._pointCollection.add(me._center);
            
            me._child1 = new Edge(me._p1, me._center, me._pointCollection);
            me._child2 = new Edge(me._center, me._p2, me._pointCollection);
        },
        
        getChildAt: function(point) {
            var me = this;
            
            if (!me._center) {
                me._divide();
            }
            
            if (point.id === me._p1.id) return me._child1;
            if (point.id === me._p2.id) return me._child2;
            
            return null;
        }
    });
    
    return Edge;
});