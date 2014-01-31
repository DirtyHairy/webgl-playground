define(['underscore'],
    function (_)
{
    "use strict";

    var Observable = function() {
        var me = this;
        
        me._listeners = {};
        me._relays = [];
    };

    _.extend(Observable.prototype, {
        _listeners: null,
        _relays: null,

        /**
         * Attach event listeners. Arguments are an associative array of event
         * <-> handler pairs, scope is the execution scope if the handlers.
         */
        attachListeners: function (listeners, scope) {
            var me = this;

            _.each(listeners, function (handler, evt) {
                if (!me._listeners[evt]) me._listeners[evt] = [];

                me._listeners[evt].push({
                    callback: handler,
                    scope: scope
                });
            });
        },

        attachRelay: function(handler, scope) {
            var me = this;
            
            me._relays.push({
                handler: handler,
                scope: scope
            });
        },

        /**
         * Detach event handlers. Signature is identical to attachListeners.
         * IMPORTANT: Both scope and handler must match those passed during
         * registration.
         */
        detachListeners: function (listeners, scope) {
            var me = this;

            _.each(listeners, function (handler, evt) {
                if (!me._listeners[evt]) return;

                me._listeners[evt] = _.reject(me._listeners[evt],
                    function (listener) {
                        return listener.callback === handler && listener.scope === scope;
                    }
                );
            });
        },

        detachRelay: function(handler, scope) {
            var me = this;
            
            me._relays = _.reject(me._relays, function(relay) {
                return handler === relay.handler && scope === relay.scope;
            });
        },

        /**
         * Detach all handlers registered with a given scope.
         */
        detachAllListeners: function (scope) {
            var me = this;

            _.each(me._listeners, function (listeners, evt) {
                me._listeners[evt] = _.reject(me._listeners[evt],
                    function (listener) {
                        return listener.scope === scope;
                    }
                );
            });
        },

        detachAllRelays: function(scope) {
            var me = this;
            
            me._relays = _.reject(me._relays, function(relay) {
                return scope === relay.scope;
            });
        },
        
        detachAll: function(scope) {
            var me = this;
            
            me.detachAllListeners(scope);
            me.detachAllRelays(scope);
        },

        /**
         * Trigger an event. First argument is the event name, all other
         * arguments are directly passed to the handler. The sender is available as last argument.
         */
        fireEvent: function () {
            var me = this;
            
            me._handleListeners.apply(me, arguments);
            me._handleRelays.apply(me, arguments);
        },
        
        _handleListeners: function(evt) {
            var me = this;
            
            if (!me._listeners[evt]) {
                return;
            }
            
            var args = Array.prototype.slice.call(arguments, 1);
            args.push(me);
            
            _.each(me._listeners[evt], function(listener) {
                listener.callback.apply(listener.scope, args);
            });
        },
        
        _handleRelays: function(evt) {
            var me = this;
            
            if (me._relays.length === 0) {
                return;
            }
            
            var args = Array.prototype.slice.call(arguments);
            args.push(me);
            
            _.each(me._relays, function(relay) {
                relay.handler.apply(relay.scope, args);
            });
        },

        /**
         * Destructor: detach all listeners
         */
        destroy: function () {
            var me = this;

            me._listeners = {};
            me._relays = [];
        }
    });

    return Observable;
});