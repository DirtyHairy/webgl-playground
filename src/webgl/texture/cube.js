define(['underscore', 'q'],
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

        me.setTextureUnit(parameters.hasOwnProperty('textureUnit') ?
            parameters.textureUnit : 0);
        me.bind();

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, me._wrapS);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, me._wrapT);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, me._minFilter);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, me._maxFilter);

        me._faceDeferreds = {};
        _.each(['posx', 'negx', 'posy', 'negy', 'posz', 'negz'], function(face) {
            me._faceDeferreds[face] = Q.defer();
        });

        me._ready = Q.all(_(me._faceDeferreds)
            .values()
            .map(function(deferred) {
                return deferred.promise;
            })
            .value()
        );

        if (me.mipmap()) {
            me._ready = me._ready
                .then(function() {
                    me.bind();
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

        _format: null,
        _type: null,
        _minFilter: null,
        _maxFilter: null,
        _wrapS: null,
        _wrapT: null,
        _flipY: null,

        _ready: null,
        _faceDeferreds: null,
        _glTexture: null,

        _textureUnit: null,
        _textureUnitEnum: null,

        setTextureUnit: function(unit) {
            var me = this,
                gl = me._webGl.getContext();

            me._textureUnit = unit;
            me._textureUnitEnum = gl['TEXTURE' + unit];

            return me;
        },

        getTextureUnit: function() {
            return this._textureUnit;
        },

        bind: function() {
            var me = this,
                gl = me._webGl.getContext();

            gl.activeTexture(me._textureUnitEnum);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, me._glTexture);

            return this;
        },

        mipmap: function() {
            var me = this,
                gl = me._webGl.getContext();

            return  me._minFilter === gl.NEAREST_MIPMAP_LINEAR ||
                    me._minFilter === gl.LINEAR_MIPMAP_LINEAR;
        },

        _faceConstant: function(face) {
            var me = this,
                gl = me._webGl.getContext();

            switch (face) {
                case me.POSX: return gl.TEXTURE_CUBE_MAP_POSITIVE_X;
                case me.NEGX: return gl.TEXTURE_CUBE_MAP_NEGATIVE_X;
                case me.POSY: return gl.TEXTURE_CUBE_MAP_POSITIVE_Y;
                case me.NEGY: return gl.TEXTURE_CUBE_MAP_NEGATIVE_Y;
                case me.POSZ: return gl.TEXTURE_CUBE_MAP_POSITIVE_Z;
                case me.NEGZ: return gl.TEXTURE_CUBE_MAP_NEGATIVE_Z;
            }

            return undefined;
        },

        loadFace: function(face, url, flipY) {
            var me = this,
                gl = me._webGl.getContext();

            if (typeof(flipY) === "undefined") {
                flipY = me._flipY;
            }

            var image = new Image();
            image.onload = function() {
                me.bind();
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
                gl.texImage2D(me._faceConstant(face), 0,
                    me._format, me._format, me._type, image);

                me._faceDeferreds[face].resolve();
            };

            image.src = url;

            return this;
        },

        loadAllFaces: function(url) {
            var me = this,
                gl = me._webGl.getContext();

            var image = new Image();
            image.onload = function() {
                var faceWidth = Math.floor(this.width / 4),
                    faceHeight = Math.floor(this.height / 3),
                    canvas = document.createElement('canvas'),
                    ctx = canvas.getContext('2d');

                canvas.width = faceWidth;
                canvas.height = faceHeight;

                me.bind();

                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, me._flipY);

                function blit(ix, iy) {
                    ctx.drawImage(image,
                        ix * faceWidth, iy * faceHeight, faceWidth, faceHeight,
                        0, 0, faceWidth, faceHeight);
                }

                function loadTexture(face) {
                    gl.texImage2D(face, 0, me._format, me._format, me._type, canvas);
                }

                blit(1, 0);
                loadTexture(gl.TEXTURE_CUBE_MAP_POSITIVE_Y);
                blit(0, 1);
                loadTexture(gl.TEXTURE_CUBE_MAP_NEGATIVE_X);
                blit(1, 1);
                loadTexture(gl.TEXTURE_CUBE_MAP_POSITIVE_Z);
                blit(2, 1);
                loadTexture(gl.TEXTURE_CUBE_MAP_POSITIVE_X);
                blit(3, 1);
                loadTexture(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);
                blit(1, 2);
                loadTexture(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);

                _.forEach(me._faceDeferreds, function(deferred) {
                    deferred.resolve();
                });
            };

            image.src = url;
        },

        ready: function() {
            return this._ready;
        }
    });

    return TextureCube;
});
