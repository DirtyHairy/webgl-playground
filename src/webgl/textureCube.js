define(['lodash', 'Q'],
    function(_, Q)
{
    'use strict';

    function TextureCube(webGl, parameters) {
        var me = this,
            gl = webGl.getContext();

        me._webGl = webGl;

        me._format = parameters.hasOwnProperty('format') ?
            parameters.format : gl.RGBA;
        me._type = parameters.hasOwnProperty('type') ?
            parameters.type : gl.UNSIGNED_BYTE;
        me._minFilter = parameters.hasOwnProperty('minFilter') ?
            parameters.minFilter : gl.LINEAR;
        me._maxFilter = parameters.hasOwnProperty('maxFilter') ?
            parameters.maxFilter : gl.LINEAR;
        me._wrapS = parameters.hasOwnProperty('wrapS') ? 
            parameters.wrapS : gl.CLAMP_TO_EDGE;
        me._wrapT = parameters.hasOwnProperty('wrapT') ?
            parameters.wrapT : gl.CLAMP_TO_EDGE;
        me._flipY = parameters.hasOwnProperty('flipY') ?
            parameters.flipY : false;

        me._glTexture = gl.createTexture();
        me.bind();

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, me._wrapS);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, me._wrapT);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, me._minFilter);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, me._maxFilter);

        me._faceReady = {};
        me._faceInitialized = {};
        _.each(['posx', 'negx', 'posy', 'negy', 'posz', 'negz'], function(face) {
            me._faceDeferreds[face] = Q.defer();
            me._faceInitialized[face] = false;
        });

        me._ready = Q.all(_(me._faceReady)
            .values()
            .map(function(deferred) {
                return deferred.promise;
            })
            .value()
        );

        if (me.mipmap()) {
            me._ready = me._ready
                .then(function() {
                    me._bind();
                    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
                });
        }
    }

    _.extend(TextureCube.prototype, {

        POSX: 'posx',
        NEGX: 'negx',
        POSY: 'posy',
        NEGY: 'negy',
        POSZ: 'posz',
        NEGZ: 'negz',

        bind: function() {
            var me = this,
                gl = me._webGl.getContext();

            gl.bindTexture(gl.TEXTURE_CUBE_MAP, me._glTexture);
        },

        mipmap: function() {
            var me = this,
                gl = me._webGl.getContext();

            return  me.minFilter === gl.NEAREST_MIPMAP_LINEAR || 
                    me.minFilter === gl.LINEAR_MIPMAP_LINEAR;
        },

        loadFace: function() {
            var me = this,
                gl = me._webGl.getContext();
        }

    });

    return TextureCube;
});
