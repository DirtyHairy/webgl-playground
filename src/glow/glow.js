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
            
            me._canvas.mousedown(_.bind(me._onMouseEngage, me));
            me._canvas.mousemove(_.bind(me._onMouseMove, me))
            me._canvas.mouseup(_.bind(me._onMouseDisengage, me))
            me._canvas.mouseout(_.bind(me._onMouseDisengage, me));
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
        
        _onMouseDisengage: function() {
            var me = this;

            me._renderer.disengage();
        }
    });
    
    return Glow;
});