define(['underscore'],
    function(_)
{
    "use strict";
    
    var Point = function(x, y, z, id) {
        var me = this;
        
        me.x = x;
        me.y = y;
        me.z = z;
        
        if (typeof(id) !== 'undefined') {
            me.id = id;
        }
    };
    
    _.extend(Point.prototype, {
        x: null,
        y: null,
        z: null,
        id : null,
        
        normalize: function() {
            var me = this,
                norm = Math.sqrt(me.x*me.x + me.y*me.y + me.z*me.z);
            
            if (norm > 0) {
                me.x /= norm;
                me.y /= norm;
                me.z /= norm;   
            }
        }
    });
    
    return Point;
});