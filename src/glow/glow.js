define(['underscore', 'jquery', 'glow/renderer'],
    function(_, $, Renderer)
{
    "use strict";
    
    var Glow = function(canvas, controls) {
        var me = this;
        
        me._renderer = new Renderer(canvas);
        me._canvas = $(canvas);
        
        if (controls) {
            me._bindControl(controls.radius,
                _.bind(me._renderer.getPointSize, me._renderer),
                _.bind(me._renderer.setPointSize, me._renderer)
            );
            me._bindControl(controls.bleed,
                _.bind(me._renderer.getBleedFactor, me._renderer),
                _.bind(me._renderer.setBleedFactor, me._renderer)
            );
            me._bindControl(controls.exponentialDecay,
                _.bind(me._getExponentialDecay, me),
                _.bind(me._setExponentialDecay, me)
            );
            me._bindControl(controls.linearDecay,
                _.bind(me._renderer.getLinearDecay, me._renderer),
                _.bind(me._renderer.setLinearDecay, me._renderer)
            );
        }
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
        
        _bindControl: function(elt, getter, setter) {
            if (!elt) return;
            
            var display = elt.find('span'),
                control = elt.find('input');
        
            display.html(getter());
            control.val(getter());
            
            control.change(function() {
                var value = setter($(this).val());
                    
                display.html(value);
                $(this).val(value);
            });
        },
        
        _setExponentialDecay: function(factor) {
            var me = this;
            
            me._renderer.setExponentialDecay(Math.pow(0.5, factor));
            return me._getExponentialDecay();
        },
        
        _getExponentialDecay: function() {
            var me = this,
            factor = me._renderer.getExponentialDecay();
            
            return Number(-1.0 * Math.log(factor) / Math.log(2.0)).toFixed(2);
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