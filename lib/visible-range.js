/*!
* Photo Sphere Viewer 4.2.1
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2021 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('photo-sphere-viewer'), require('three')) :
  typeof define === 'function' && define.amd ? define(['photo-sphere-viewer', 'three'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, (global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.VisibleRangePlugin = factory(global.PhotoSphereViewer, global.THREE)));
}(this, (function (photoSphereViewer, THREE) { 'use strict';

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  /**
   * @typedef {Object} PSV.plugins.VisibleRangePlugin.Options
   * @property {double[]|string[]} [latitudeRange] - latitude range as two angles
   * @property {double[]|string[]} [longitudeRange] - longitude range as two angles
   * @property {boolean} [usePanoData] - use panoData as visible range, you can also manually call `setRangesFromPanoData`
   */

  /**
   * @summary Locks visible longitude and/or latitude
   * @extends PSV.plugins.AbstractPlugin
   * @memberof PSV.plugins
   */

  var VisibleRangePlugin = /*#__PURE__*/function (_AbstractPlugin) {
    _inheritsLoose(VisibleRangePlugin, _AbstractPlugin);

    /**
     * @param {PSV.Viewer} psv
     * @param {PSV.plugins.VisibleRangePlugin.Options} options
     */
    function VisibleRangePlugin(psv, options) {
      var _this;

      _this = _AbstractPlugin.call(this, psv) || this;
      /**
       * @member {PSV.plugins.VisibleRangePlugin.Options}
       * @private
       */

      _this.config = {
        latitudeRange: null,
        longitudeRange: null,
        usePanoData: false
      };

      if (options) {
        _this.config.usePanoData = !!options.usePanoData;

        _this.setLatitudeRange(options.latitudeRange);

        _this.setLongitudeRange(options.longitudeRange);
      }

      _this.psv.on(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, _assertThisInitialized(_this));

      _this.psv.on(photoSphereViewer.CONSTANTS.CHANGE_EVENTS.GET_ANIMATE_POSITION, _assertThisInitialized(_this));

      _this.psv.on(photoSphereViewer.CONSTANTS.CHANGE_EVENTS.GET_ROTATE_POSITION, _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @package
     */


    var _proto = VisibleRangePlugin.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED, this);
      this.psv.off(photoSphereViewer.CONSTANTS.CHANGE_EVENTS.GET_ANIMATE_POSITION, this);
      this.psv.off(photoSphereViewer.CONSTANTS.CHANGE_EVENTS.GET_ROTATE_POSITION, this);

      _AbstractPlugin.prototype.destroy.call(this);
    }
    /**
     * @private
     */
    // eslint-disable-next-line consistent-return
    ;

    _proto.handleEvent = function handleEvent(e) {
      if (e.type === photoSphereViewer.CONSTANTS.CHANGE_EVENTS.GET_ANIMATE_POSITION) {
        var _this$applyRanges = this.applyRanges(e.value),
            rangedPosition = _this$applyRanges.rangedPosition;

        return rangedPosition;
      } else if (e.type === photoSphereViewer.CONSTANTS.CHANGE_EVENTS.GET_ROTATE_POSITION) {
        var _this$applyRanges2 = this.applyRanges(e.value),
            _rangedPosition = _this$applyRanges2.rangedPosition,
            sidesReached = _this$applyRanges2.sidesReached;

        if (photoSphereViewer.utils.intersect(['left', 'right'], sidesReached).length > 0 && this.psv.isAutorotateEnabled()) {
          this.__reverseAutorotate();

          return e.value;
        }

        return _rangedPosition;
      } else if (e.type === photoSphereViewer.CONSTANTS.EVENTS.PANORAMA_LOADED) {
        if (this.config.usePanoData) {
          this.setRangesFromPanoData();
        }
      }
    }
    /**
     * @summary Changes the latitude range
     * @param {double[]|string[]} range - latitude range as two angles
     */
    ;

    _proto.setLatitudeRange = function setLatitudeRange(range) {
      // latitude range must have two values
      if (range && range.length !== 2) {
        photoSphereViewer.utils.logWarn('latitude range must have exactly two elements'); // eslint-disable-next-line no-param-reassign

        range = null;
      } // latitude range must be ordered
      else if (range && range[0] > range[1]) {
          photoSphereViewer.utils.logWarn('latitude range values must be ordered'); // eslint-disable-next-line no-param-reassign

          range = [range[1], range[0]];
        } // latitude range is between -PI/2 and PI/2


      if (range) {
        this.config.latitudeRange = range.map(function (angle) {
          return photoSphereViewer.utils.parseAngle(angle, true);
        });
      } else {
        this.config.latitudeRange = null;
      }

      if (this.psv.prop.ready) {
        this.psv.rotate(this.psv.getPosition());
      }
    }
    /**
     * @summary Changes the longitude range
     * @param {double[]|string[]} range - longitude range as two angles
     */
    ;

    _proto.setLongitudeRange = function setLongitudeRange(range) {
      // longitude range must have two values
      if (range && range.length !== 2) {
        photoSphereViewer.utils.logWarn('longitude range must have exactly two elements'); // eslint-disable-next-line no-param-reassign

        range = null;
      } // longitude range is between 0 and 2*PI


      if (range) {
        this.config.longitudeRange = range.map(function (angle) {
          return photoSphereViewer.utils.parseAngle(angle);
        });
      } else {
        this.config.longitudeRange = null;
      }

      if (this.psv.prop.ready) {
        this.psv.rotate(this.psv.getPosition());
      }
    }
    /**
     * @summary Changes the latitude and longitude ranges according the current panorama cropping data
     */
    ;

    _proto.setRangesFromPanoData = function setRangesFromPanoData() {
      this.setLatitudeRange(this.getPanoLatitudeRange());
      this.setLongitudeRange(this.getPanoLongitudeRange());
    }
    /**
     * @summary Gets the latitude range defined by the viewer's panoData
     * @returns {double[]|null}
     * @private
     */
    ;

    _proto.getPanoLatitudeRange = function getPanoLatitudeRange() {
      var p = this.psv.prop.panoData;

      if (p.croppedHeight === p.fullHeight && p.croppedY === 0) {
        return null;
      } else {
        var latitude = function latitude(y) {
          return Math.PI * (1 - y / p.fullHeight) - Math.PI / 2;
        };

        return [latitude(p.croppedY), latitude(p.croppedY + p.croppedHeight)];
      }
    }
    /**
     * @summary Gets the longitude range defined by the viewer's panoData
     * @returns {double[]|null}
     * @private
     */
    ;

    _proto.getPanoLongitudeRange = function getPanoLongitudeRange() {
      var p = this.psv.prop.panoData;

      if (p.croppedWidth === p.fullWidth && p.croppedX === 0) {
        return null;
      } else {
        var longitude = function longitude(x) {
          return 2 * Math.PI * (x / p.fullWidth) - Math.PI;
        };

        return [longitude(p.croppedX), longitude(p.croppedX + p.croppedWidth)];
      }
    }
    /**
     * @summary Apply "longitudeRange" and "latitudeRange"
     * @param {PSV.Position} position
     * @returns {{rangedPosition: PSV.Position, sidesReached: string[]}}
     * @private
     */
    ;

    _proto.applyRanges = function applyRanges(position) {
      var rangedPosition = {
        longitude: position.longitude,
        latitude: position.latitude
      };
      var sidesReached = [];
      var range;
      var offset;

      if (this.config.longitudeRange) {
        range = photoSphereViewer.utils.clone(this.config.longitudeRange);
        offset = THREE.Math.degToRad(this.psv.prop.hFov) / 2;
        range[0] = photoSphereViewer.utils.parseAngle(range[0] + offset);
        range[1] = photoSphereViewer.utils.parseAngle(range[1] - offset);

        if (range[0] > range[1]) {
          // when the range cross longitude 0
          if (position.longitude > range[1] && position.longitude < range[0]) {
            if (position.longitude > range[0] / 2 + range[1] / 2) {
              // detect which side we are closer too
              rangedPosition.longitude = range[0];
              sidesReached.push('left');
            } else {
              rangedPosition.longitude = range[1];
              sidesReached.push('right');
            }
          }
        } else if (position.longitude < range[0]) {
          rangedPosition.longitude = range[0];
          sidesReached.push('left');
        } else if (position.longitude > range[1]) {
          rangedPosition.longitude = range[1];
          sidesReached.push('right');
        }
      }

      if (this.config.latitudeRange) {
        range = photoSphereViewer.utils.clone(this.config.latitudeRange);
        offset = THREE.Math.degToRad(this.psv.prop.vFov) / 2;
        range[0] = photoSphereViewer.utils.parseAngle(Math.min(range[0] + offset, range[1]), true);
        range[1] = photoSphereViewer.utils.parseAngle(Math.max(range[1] - offset, range[0]), true);

        if (position.latitude < range[0]) {
          rangedPosition.latitude = range[0];
          sidesReached.push('bottom');
        } else if (position.latitude > range[1]) {
          rangedPosition.latitude = range[1];
          sidesReached.push('top');
        }
      }

      return {
        rangedPosition: rangedPosition,
        sidesReached: sidesReached
      };
    }
    /**
     * @summary Reverses autorotate direction with smooth transition
     * @private
     */
    ;

    _proto.__reverseAutorotate = function __reverseAutorotate() {
      var _this2 = this;

      var newSpeed = -this.psv.config.autorotateSpeed;
      var range = this.config.longitudeRange;
      this.config.longitudeRange = null;
      new photoSphereViewer.Animation({
        properties: {
          speed: {
            start: this.psv.config.autorotateSpeed,
            end: 0
          }
        },
        duration: 300,
        easing: 'inSine',
        onTick: function onTick(properties) {
          _this2.psv.config.autorotateSpeed = properties.speed;
        }
      }).then(function () {
        return new photoSphereViewer.Animation({
          properties: {
            speed: {
              start: 0,
              end: newSpeed
            }
          },
          duration: 300,
          easing: 'outSine',
          onTick: function onTick(properties) {
            _this2.psv.config.autorotateSpeed = properties.speed;
          }
        });
      }).then(function () {
        _this2.config.longitudeRange = range;
      });
    };

    return VisibleRangePlugin;
  }(photoSphereViewer.AbstractPlugin);

  VisibleRangePlugin.id = 'visible-range';

  return VisibleRangePlugin;

})));
//# sourceMappingURL=visible-range.js.map
