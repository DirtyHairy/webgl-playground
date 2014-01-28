define(['underscore', 'jquery', 'glow/renderer'],
    function(_, $, Renderer)
{
    "use strict";
    
    var Glow = function(canvas) {
        var me = this;
        
        me._renderer = new Renderer(canvas);
        me._canvas = $(canvas);
    };
    
    _.extend(Glow.prototype, {
        _renderer: null,
        _canvas: null,
        
        run: function() {
            var me = this;
         
            me._renderer
                .drawAt(100, 100)
                .drawAt(200, 200)
                .drawAt(300, 200)
                .drawAt(500, 200)
                .moveTo(640, 480)
                .drawTo(300, 350);

            me._renderer.start();
            
            me._canvas
                .mousedown(_.bind(me._onMouseEngage, me))
                .mousemove(_.bind(me._onMouseMove, me))
                .on('touchstart', _.bind(me._onTouchEngage, me))
                .on('touchmove', _.bind(me._onTouchMove, me));
            $(document)
                .mouseup(_.bind(me._onDisengage, me))
                .on('touchend', _.bind(me._onDisengage, me));
        },
        
        _onMouseEngage: function(evt) {
            var me = this,
                offset = me._canvas.offset();
            
            me._renderer.moveTo(evt.pageX - offset.left,
                me._canvas.height() - evt.pageY + offset.top);
            me._renderer.engage();
        },
        
        _onMouseMove: function(evt) {
            var me = this;
            
            if (me._renderer.engaged()) {
                var offset = me._canvas.offset();
                
                me._renderer.drawTo(evt.pageX - offset.left,
                    me._canvas.height() - evt.pageY + offset.top);
            }
        },
        
        _onDisengage: function(evt) {
            var me = this;

            me._renderer.disengage();
            evt.preventDefault();
        },
        
        _onTouchEngage: function(evt) {
            var me = this,
                touch = me._getTouch(evt.originalEvent);
            
            if (touch) {
                var offset = me._canvas.offset();
                
                me._renderer.moveTo(touch.pageX - offset.left,
                    me._canvas.height() - touch.pageY + offset.top);
                me._renderer.engage();
                
                evt.preventDefault();
            }
            
        },
        
        _onTouchMove: function(evt) {
            var me = this,
                touch = me._getTouch(evt.originalEvent);
            
            if (touch) {
                var offset = me._canvas.offset();
                
                me._renderer.drawTo(touch.pageX - offset.left,
                    me._canvas.height() - touch.pageY + offset.top);
                    
                evt.preventDefault();
            }
        },
        
        _getTouch: function(evt) {
            return evt.touches.length === 1 ? evt.touches[0] : null;
        }
    });
    
    return Glow;
});