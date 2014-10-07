goog.provide('ol.source.TileCanvas');

goog.require('ol.Tile');
goog.require('ol.TileCache');
goog.require('ol.TileCoord');
goog.require('ol.TileState');
goog.require('ol.dom');
goog.require('ol.source.Tile');
goog.require('ol.tilecoord');
goog.require('ol.tilegrid.TileGrid');



/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @private
 */
ol.CanvasTile_ = function(tileCoord, tileGrid, canvasFunction) {

  goog.base(this, tileCoord, ol.TileState.LOADED);

  /**
   * @private
   * @type {number}
   */
  this.tileSize_ = tileGrid.getTileSize(tileCoord[0]);

  /**
   * @private
   * @type {Object.<number, HTMLCanvasElement>}
   */
  this.canvasByContext_ = {};

   /**
   * @private
   * @type {ol.CanvasFunctionType}
   */
  this.canvasFunction_ = canvasFunction;

};
goog.inherits(ol.CanvasTile_, ol.Tile);


/**
 * @inheritDoc
 */
ol.CanvasTile_.prototype.getImage = function(opt_context) {
  var key = goog.isDef(opt_context) ? goog.getUid(opt_context) : -1;
  if (key in this.canvasByContext_) {
    return this.canvasByContext_[key];
  } else {

    var tileSize = this.tileSize_;
    var context = ol.dom.createCanvasContext2D(tileSize, tileSize);

    this.canvasFunction_(context,this.getTileCoord());

    this.canvasByContext_[key] = context.canvas;
    return context.canvas;

  }
};



/**
 * @classdesc
 * A pseudo tile source, which does not fetch tiles from a server, but renders
 * a grid outline for the tile grid/projection along with the coordinates for
 * each tile. See examples/canvas-tiles for an example.
 *
 * Uses Canvas context2d, so requires Canvas support.
 *
 * @constructor
 * @extends {ol.source.Tile}
 * @param {olx.source.TileDebugOptions} options Debug tile options.
 * @api
 */
ol.source.TileCanvas = function(options) {

  goog.base(this, {
    opaque: false,
    projection: options.projection,
    tileGrid: options.tileGrid
  });

  /**
   * @private
   * @type {ol.TileCache}
   */
  this.tileCache_ = new ol.TileCache();

   /**
   * @private
   * @type {ol.CanvasFunctionType}
   */
  this.canvasFunction_ = options.canvasFunction;

};
goog.inherits(ol.source.TileCanvas, ol.source.Tile);


/**
 * @inheritDoc
 */
ol.source.TileCanvas.prototype.canExpireCache = function() {
  return this.tileCache_.canExpireCache();
};


/**
 * @inheritDoc
 */
ol.source.TileCanvas.prototype.expireCache = function(usedTiles) {
  this.tileCache_.expireCache(usedTiles);
};


/**
 * @inheritDoc
 */
ol.source.TileCanvas.prototype.getTile = function(z, x, y) {
  var tileCoordKey = this.getKeyZXY(z, x, y);
  if (this.tileCache_.containsKey(tileCoordKey)) {
    return /** @type {!ol.CanvasTile_} */ (this.tileCache_.get(tileCoordKey));
  } else {
    var tile = new ol.CanvasTile_([z, x, y], this.tileGrid, this.canvasFunction_);
    this.tileCache_.set(tileCoordKey, tile);
    return tile;
  }
};
