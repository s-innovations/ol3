goog.provide('ol.source.TileCanvas');
goog.provide('ol.TileCanvasFunctionType');

goog.require('ol.Tile');
goog.require('ol.TileCache');
goog.require('ol.TileCoord');
goog.require('ol.TileState');
goog.require('ol.dom');
goog.require('ol.source.Tile');
goog.require('ol.tilecoord');
goog.require('ol.tilegrid.TileGrid');




/**
 * A function filling the canvas element (`{HTMLCanvasElement}`)
 * used by the source as an image. The arguments passed to the function are:
 * {@link ol.Extent} the image extent, `{number}` the image resolution,
 * `{number}` the device pixel ratio, {@link ol.Size} the image size, and
 * {@link ol.proj.Projection} the image projection. The canvas returned by
 * this function is cached by the source. The this keyword inside the function
 * references the {@link ol.source.ImageCanvas}.
 *
 * @typedef {function(this:ol.source.TileCanvas, CanvasRenderingContext2D, ol.Extent, ol.TileCoord, number,number)}
 * @api
 */
ol.TileCanvasFunctionType;

/**
 * @constructor
 * @extends {ol.Tile}
 * @param {ol.TileCoord} tileCoord Tile coordinate.
 * @param {ol.tilegrid.TileGrid} tileGrid Tile grid.
 * @param {ol.TileCanvasFunctionType} canvasFunction Canvas Drawing Function
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
   * @type {ol.tilegrid.TileGrid}
   */
  this.tileGrid_ = tileGrid;

  /**
   * @private
   * @type {Object.<number, HTMLCanvasElement>}
   */
  this.canvasByContext_ = {};

  this.coordTransform_ = this.tileGrid_.createTileCoordTransform();
   /**
   * @private
   * @type {ol.TileCanvasFunctionType}
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
    var coord =  this.getTileCoord();
    
    this.canvasFunction_(context,
      this.tileGrid_.getTileCoordExtent(coord),
      this.coordTransform_(coord,null),
      this.tileGrid_.getTileCoordResolution(coord),
      tileSize);

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
   * @type {ol.TileCanvasFunctionType}
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
