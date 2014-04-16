'use strict';

var VectorTileLayer = require('./vectortilelayer');
var Protobuf = require('pbf');

module.exports = VectorTile;
function VectorTile(buffer, end) {
    if (!(buffer instanceof Protobuf)) {
        buffer = new Protobuf(buffer);
    }

    // Public
    this.layers = {};

    // Private
    this._buffer = buffer;

    var val, tag;
    if (typeof end === 'undefined') end = buffer.length;
    while (buffer.pos < end) {
        val = buffer.readVarint();
        tag = val >> 3;
        if (tag == 3) {
            var layer = this.readLayer();
            if (layer.length) {
                this.layers[layer.name] = layer;
            }
        } else {
            // console.warn('skipping tile tag ' + tag);
            buffer.skip(val);
        }
    }
}

VectorTile.prototype.readLayer = function() {
    var buffer = this._buffer;

    var bytes = buffer.readVarint();
    var end = buffer.pos + bytes;
    var layer = new VectorTileLayer(buffer, end);
    buffer.pos = end;
    return layer;
};

// Returns a dictionary of layers as individual GeoJSON feature collections, keyed by layer name
VectorTile.prototype.toGeoJSON = function () {
    var json = {};
    var layerNames = Object.keys(this.layers);

    for (var n=0; n < layerNames.length; n++) {
        json[layerNames[n]] = this.layers[layerNames[n]].toGeoJSON();
    }

    return json;
};
