define(['underscore', 'geometry/edge'],
    function(_, Edge)
{
    "use strict";
    
    /*
     *        p2
     *         *
     *       /  \
     *   e1 *c1c2* e2
     *     /   c3  \
     * p1 -----*---- p3
     *        e3
     */
     
    var Triangle = function(e1, e2, e3) {
        var me = this;
        
        me._e1 = e1;
        me._e2 = e2;
        me._e3 = e3;
        
        me._p2 = me._e1.intersect(me._e2);
        me._p3 = me._e2.intersect(me._e3);
        me._p1 = me._e3.intersect(me._e1);
    };
    
    _.extend(Triangle.prototype, {
        _e1: null,
        _e2: null,
        _e3: null,
        
        _p1: null,
        _p2: null,
        _p3: null,
        
        _children: null,
        
        getPoints: function() {
            var me = this;
            
            return [me._p1, me._p2, me._p3];
        },
        
        _divide: function() {
            var me = this,
                points = me.getPointCollection(),
                c1 = me._e1.getCenter(),
                c2 = me._e2.getCenter(),
                c3 = me._e3.getCenter(),
                f1 = new Edge(c1, c2, points),
                f2 = new Edge(c2, c3, points),
                f3 = new Edge(c3, c1, points);
            
            me._children = [
                new Triangle(me._e1.getChildAt(me._p1), f3, me._e3.getChildAt(me._p1)),
                new Triangle(me._e1.getChildAt(me._p2), me._e2.getChildAt(me._p2), f1),
                new Triangle(f2, me._e2.getChildAt(me._p3), me._e3.getChildAt(me._p3)),
                new Triangle(f1, f2, f3)
            ];
        },
        
        getChildren: function() {
            var me = this;
            
            if (!me._children) {
                me._divide();
            }
            
            return me._children;
        },
        
        getPointCollection: function() {
            return this._e1.getPointCollection();
        }
    });
    
    return Triangle;
});