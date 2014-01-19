define(['underscore'],
    function(_)
{
    "use strict";
    
    var PointCollection = function() {
        var me = this;
        
        me._points = [];
    };
    
    _.extend(PointCollection.prototype, {
        _points: null,
        
        add: function(point, id) {
            var me = this;
            
            if (_.isArray(point)) {
                _.each(point, me.add, me);
                
            } else {
                if (typeof(id) === 'undefined') {
                    id = me._points.length;
                }
                
                me._points[id] = point;
                point.id = id;
            }
            
            return me;
        },
        
        get: function(id) {
            return this._points[id];
        },
        
        getAll: function() {
            return this._points;
        },
        
        normalize: function() {
            var me = this;
            
            _.each(me._points, function(point) {
                point.normalize();
            });
        }
    });
    
    return PointCollection;
});