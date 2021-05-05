/*!
* Photo Sphere Viewer 4.2.1
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2021 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('uevent')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'uevent'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.PhotoSphereViewer = {}, global.THREE, global.uEvent));
}(this, (function (exports, THREE, uevent) { 'use strict';

  /**
   * @namespace PSV.constants
   */

  /**
   * @summary Number of pixels bellow which a mouse move will be considered as a click
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */
  var MOVE_THRESHOLD = 4;
  /**
   * @summary Delay in milliseconds between two clicks to consider a double click
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var DBLCLICK_DELAY = 300;
  /**
   * @summary Delay in milliseconds to emulate a long touch
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var LONGTOUCH_DELAY = 500;
  /**
   * @summary Delay in milliseconds to for the two fingers overlay to appear
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var TWOFINGERSOVERLAY_DELAY = 100;
  /**
   * @summary Duration in milliseconds of the "ctrl zoom" overlay
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var CTRLZOOM_TIMEOUT = 2000;
  /**
   * @summary Time size of the mouse position history used to compute inertia
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var INERTIA_WINDOW = 300;
  /**
   * @summary Radius of the THREE.SphereGeometry, Half-length of the THREE.BoxGeometry
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var SPHERE_RADIUS = 100;
  /**
   * @summary Number of vertice of the THREE.SphereGeometry
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var SPHERE_VERTICES = 64;
  /**
   * @summary Number of vertices of each side of the THREE.BoxGeometry
   * @memberOf PSV.constants
   * @type {number}
   * @constant
   */

  var CUBE_VERTICES = 8;
  /**
   * @summary Order of cube textures for arrays
   * @memberOf PSV.constants
   * @type {number[]}
   * @constant
   */

  var CUBE_MAP = [0, 2, 4, 5, 3, 1];
  /**
   * @summary Order of cube textures for maps
   * @memberOf PSV.constants
   * @type {string[]}
   * @constant
   */

  var CUBE_HASHMAP = ['left', 'right', 'top', 'bottom', 'back', 'front'];
  /**
   * @summary Property name added to viewer element
   * @memberOf PSV.constants
   * @type {string}
   * @constant
   */

  var VIEWER_DATA = 'photoSphereViewer';
  /**
   * @summary Available actions
   * @memberOf PSV.constants
   * @enum {string}
   * @constant
   */

  var ACTIONS = {
    ROTATE_LAT_UP: 'rotateLatitudeUp',
    ROTATE_LAT_DOWN: 'rotateLatitudeDown',
    ROTATE_LONG_RIGHT: 'rotateLongitudeRight',
    ROTATE_LONG_LEFT: 'rotateLongitudeLeft',
    ZOOM_IN: 'zoomIn',
    ZOOM_OUT: 'zoomOut',
    TOGGLE_AUTOROTATE: 'toggleAutorotate'
  };
  /**
   * @summary Available events names
   * @memberOf PSV.constants
   * @enum {string}
   * @constant
   */

  var EVENTS = {
    /**
     * @event autorotate
     * @memberof PSV
     * @summary Triggered when the automatic rotation is enabled/disabled
     * @param {boolean} enabled
     */
    AUTOROTATE: 'autorotate',

    /**
     * @event before-render
     * @memberof PSV
     * @summary Triggered before a render, used to modify the view
     * @param {number} timestamp - time provided by requestAnimationFrame
     */
    BEFORE_RENDER: 'before-render',

    /**
     * @event before-rotate
     * @memberOf PSV
     * @summary Triggered before a rotate operation, can be cancelled
     * @param {PSV.ExtendedPosition}
     */
    BEFORE_ROTATE: 'before-rotate',

    /**
     * @event click
     * @memberof PSV
     * @summary Triggered when the user clicks on the viewer (everywhere excluding the navbar and the side panel)
     * @param {PSV.ClickData} data
     */
    CLICK: 'click',

    /**
     * @event close-panel
     * @memberof PSV
     * @summary Triggered when the panel is closed
     * @param {string} [id]
     */
    CLOSE_PANEL: 'close-panel',

    /**
     * @event config-changed
     * @memberOf PSV
     * @summary Triggered after a call to setOption/setOptions
     * @param {string[]} name of changed options
     */
    CONFIG_CHANGED: 'config-changed',

    /**
     * @event dblclick
     * @memberof PSV
     * @summary Triggered when the user double clicks on the viewer. The simple `click` event is always fired before `dblclick`
     * @param {PSV.ClickData} data
     */
    DOUBLE_CLICK: 'dblclick',

    /**
     * @event fullscreen-updated
     * @memberof PSV
     * @summary Triggered when the fullscreen mode is enabled/disabled
     * @param {boolean} enabled
     */
    FULLSCREEN_UPDATED: 'fullscreen-updated',

    /**
     * @event hide-notification
     * @memberof PSV
     * @summary Triggered when the notification is hidden
     */
    HIDE_NOTIFICATION: 'hide-notification',

    /**
     * @event hide-overlay
     * @memberof PSV
     * @summary Triggered when the overlay is hidden
     * @param {string} [id]
     */
    HIDE_OVERLAY: 'hide-overlay',

    /**
     * @event hide-tooltip
     * @memberof PSV
     * @summary Triggered when the tooltip is hidden
     * @param {*} Data associated to this tooltip
     */
    HIDE_TOOLTIP: 'hide-tooltip',

    /**
     * @event open-panel
     * @memberof PSV
     * @summary Triggered when the panel is opened
     * @param {string} [id]
     */
    OPEN_PANEL: 'open-panel',

    /**
     * @event panorama-loaded
     * @memberof PSV
     * @summary Triggered when a panorama image has been loaded
     */
    PANORAMA_LOADED: 'panorama-loaded',

    /**
     * @event position-updated
     * @memberof PSV
     * @summary Triggered when the view longitude and/or latitude changes
     * @param {PSV.Position} position
     */
    POSITION_UPDATED: 'position-updated',

    /**
     * @event ready
     * @memberof PSV
     * @summary Triggered when the panorama image has been loaded and the viewer is ready to perform the first render
     */
    READY: 'ready',

    /**
     * @event render
     * @memberof PSV
     * @summary Triggered on each viewer render, **this event is triggered very often**
     */
    RENDER: 'render',

    /**
     * @event show-notification
     * @memberof PSV
     * @summary Triggered when the notification is shown
     */
    SHOW_NOTIFICATION: 'show-notification',

    /**
     * @event show-overlay
     * @memberof PSV
     * @summary Triggered when the overlay is shown
     * @param {string} [id]
     */
    SHOW_OVERLAY: 'show-overlay',

    /**
     * @event show-tooltip
     * @memberof PSV
     * @summary Triggered when the tooltip is shown
     * @param {*} Data associated to this tooltip
     * @param {PSV.components.Tooltip} Instance of the tooltip
     */
    SHOW_TOOLTIP: 'show-tooltip',

    /**
     * @event size-updated
     * @memberof PSV
     * @summary Triggered when the viewer size changes
     * @param {PSV.Size} size
     */
    SIZE_UPDATED: 'size-updated',

    /**
     * @event stop-all
     * @memberof PSV
     * @summary Triggered when all current animations are stopped
     */
    STOP_ALL: 'stop-all',

    /**
     * @event zoom-updated
     * @memberof PSV
     * @summary Triggered when the zoom level changes
     * @param {number} zoomLevel
     */
    ZOOM_UPDATED: 'zoom-updated'
  };
  /**
   * @summary Available change events names
   * @memberOf PSV.constants
   * @enum {string}
   * @constant
   */

  var CHANGE_EVENTS = {
    /**
     * @event get-animate-position
     * @memberof PSV
     * @param {Position} position
     * @returns {Position}
     * @summary Called to alter the target position of an animation
     */
    GET_ANIMATE_POSITION: 'get-animate-position',

    /**
     * @event get-rotate-position
     * @memberof PSV
     * @param {Position} position
     * @returns {Position}
     * @summary Called to alter the target position of a rotation
     */
    GET_ROTATE_POSITION: 'get-rotate-position'
  };
  /**
   * @summary Internal identifiers for various stuff
   * @memberOf PSV.constants
   * @enum {string}
   * @constant
   */

  var IDS = {
    MENU: 'menu',
    TWO_FINGERS: 'twoFingers',
    CTRL_ZOOM: 'ctrlZoom',
    ERROR: 'error'
  };
  /* eslint-disable */
  // @formatter:off

  /**
   * @summary Collection of easing functions
   * @memberOf PSV.constants
   * @see {@link https://gist.github.com/frederickk/6165768}
   * @type {Object<string, Function>}
   * @constant
   */

  var EASINGS = {
    linear: function linear(t) {
      return t;
    },
    inQuad: function inQuad(t) {
      return t * t;
    },
    outQuad: function outQuad(t) {
      return t * (2 - t);
    },
    inOutQuad: function inOutQuad(t) {
      return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    inCubic: function inCubic(t) {
      return t * t * t;
    },
    outCubic: function outCubic(t) {
      return --t * t * t + 1;
    },
    inOutCubic: function inOutCubic(t) {
      return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    inQuart: function inQuart(t) {
      return t * t * t * t;
    },
    outQuart: function outQuart(t) {
      return 1 - --t * t * t * t;
    },
    inOutQuart: function inOutQuart(t) {
      return t < .5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t;
    },
    inQuint: function inQuint(t) {
      return t * t * t * t * t;
    },
    outQuint: function outQuint(t) {
      return 1 + --t * t * t * t * t;
    },
    inOutQuint: function inOutQuint(t) {
      return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t;
    },
    inSine: function inSine(t) {
      return 1 - Math.cos(t * (Math.PI / 2));
    },
    outSine: function outSine(t) {
      return Math.sin(t * (Math.PI / 2));
    },
    inOutSine: function inOutSine(t) {
      return .5 - .5 * Math.cos(Math.PI * t);
    },
    inExpo: function inExpo(t) {
      return Math.pow(2, 10 * (t - 1));
    },
    outExpo: function outExpo(t) {
      return 1 - Math.pow(2, -10 * t);
    },
    inOutExpo: function inOutExpo(t) {
      return (t = t * 2 - 1) < 0 ? .5 * Math.pow(2, 10 * t) : 1 - .5 * Math.pow(2, -10 * t);
    },
    inCirc: function inCirc(t) {
      return 1 - Math.sqrt(1 - t * t);
    },
    outCirc: function outCirc(t) {
      return Math.sqrt(1 - (t - 1) * (t - 1));
    },
    inOutCirc: function inOutCirc(t) {
      return (t *= 2) < 1 ? .5 - .5 * Math.sqrt(1 - t * t) : .5 + .5 * Math.sqrt(1 - (t -= 2) * t);
    }
  }; // @formatter:on

  /* eslint-enable */

  var constants = /*#__PURE__*/Object.freeze({
    __proto__: null,
    MOVE_THRESHOLD: MOVE_THRESHOLD,
    DBLCLICK_DELAY: DBLCLICK_DELAY,
    LONGTOUCH_DELAY: LONGTOUCH_DELAY,
    TWOFINGERSOVERLAY_DELAY: TWOFINGERSOVERLAY_DELAY,
    CTRLZOOM_TIMEOUT: CTRLZOOM_TIMEOUT,
    INERTIA_WINDOW: INERTIA_WINDOW,
    SPHERE_RADIUS: SPHERE_RADIUS,
    SPHERE_VERTICES: SPHERE_VERTICES,
    CUBE_VERTICES: CUBE_VERTICES,
    CUBE_MAP: CUBE_MAP,
    CUBE_HASHMAP: CUBE_HASHMAP,
    VIEWER_DATA: VIEWER_DATA,
    ACTIONS: ACTIONS,
    EVENTS: EVENTS,
    CHANGE_EVENTS: CHANGE_EVENTS,
    IDS: IDS,
    EASINGS: EASINGS
  });

  /**
   * @summary Toggles a CSS class
   * @memberOf PSV.utils
   * @param {HTMLElement|SVGElement} element
   * @param {string} className
   * @param {boolean} [active] - forced state
   */
  function toggleClass(element, className, active) {
    // manual implementation for IE11 and SVGElement
    if (!element.classList) {
      var currentClassName = element.getAttribute('class') || '';
      var currentActive = currentClassName.indexOf(className) !== -1;
      var regex = new RegExp('(?:^|\\s)' + className + '(?:\\s|$)');

      if ((active === undefined || active) && !currentActive) {
        currentClassName += currentClassName.length > 0 ? ' ' + className : className;
      } else if (!active) {
        currentClassName = currentClassName.replace(regex, ' ');
      }

      element.setAttribute('class', currentClassName);
    } else if (active === undefined) {
      element.classList.toggle(className);
    } else if (active && !element.classList.contains(className)) {
      element.classList.add(className);
    } else if (!active) {
      element.classList.remove(className);
    }
  }
  /**
   * @summary Adds one or several CSS classes to an element
   * @memberOf PSV.utils
   * @param {HTMLElement} element
   * @param {string} className
   */

  function addClasses(element, className) {
    if (className) {
      className.split(' ').forEach(function (name) {
        toggleClass(element, name, true);
      });
    }
  }
  /**
   * @summary Removes one or several CSS classes to an element
   * @memberOf PSV.utils
   * @param {HTMLElement} element
   * @param {string} className
   */

  function removeClasses(element, className) {
    if (className) {
      className.split(' ').forEach(function (name) {
        toggleClass(element, name, false);
      });
    }
  }
  /**
   * @summary Searches if an element has a particular parent at any level including itself
   * @memberOf PSV.utils
   * @param {HTMLElement} el
   * @param {HTMLElement} parent
   * @returns {boolean}
   */

  function hasParent(el, parent) {
    var test = el;

    do {
      if (test === parent) {
        return true;
      }

      test = test.parentNode;
    } while (test);

    return false;
  }
  /**
   * @summary Gets the closest parent (can by itself)
   * @memberOf PSV.utils
   * @param {HTMLElement|SVGElement} el
   * @param {string} selector
   * @returns {HTMLElement}
   */

  function getClosest(el, selector) {
    var matches = el.matches || el.msMatchesSelector;
    var test = el; // When el is document or window, the matches does not exist

    if (!matches) {
      return null;
    }

    do {
      if (matches.bind(test)(selector)) {
        return test;
      }

      test = test instanceof SVGElement ? test.parentNode : test.parentElement;
    } while (test);

    return null;
  }
  /**
   * @summary Map between keyboard events `keyCode|which` and `key`
   * @memberOf PSV.utils
   * @type {Object<int, string>}
   * @readonly
   * @private
   */

  var KEYMAP = {
    13: 'Enter',
    17: 'Control',
    27: 'Escape',
    32: ' ',
    33: 'PageUp',
    34: 'PageDown',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    46: 'Delete',
    107: '+',
    109: '-'
  };
  /**
   * @summary Map for non standard keyboard events `key` for IE and Edge
   * @see https://github.com/shvaikalesh/shim-keyboard-event-key
   * @type {Object<string, string>}
   * @readonly
   * @private
   */

  var MS_KEYMAP = {
    Add: '+',
    Del: 'Delete',
    Down: 'ArrowDown',
    Esc: 'Escape',
    Left: 'ArrowLeft',
    Right: 'ArrowRight',
    Spacebar: ' ',
    Subtract: '-',
    Up: 'ArrowUp'
  };
  /**
   * @summary Returns the key name of a KeyboardEvent
   * @memberOf PSV.utils
   * @param {KeyboardEvent} evt
   * @returns {string}
   */

  function getEventKey(evt) {
    var key = evt.key || KEYMAP[evt.keyCode || evt.which];

    if (key && MS_KEYMAP[key]) {
      key = MS_KEYMAP[key];
    }

    return key;
  }
  /**
   * @summary Detects if fullscreen is enabled
   * @memberOf PSV.utils
   * @param {HTMLElement} elt
   * @returns {boolean}
   */

  function isFullscreenEnabled(elt) {
    /* eslint-disable-next-line max-len */
    return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) === elt;
  }
  /**
   * @summary Enters fullscreen mode
   * @memberOf PSV.utils
   * @param {HTMLElement} elt
   */

  function requestFullscreen(elt) {
    /* eslint-disable-next-line max-len */
    (elt.requestFullscreen || elt.mozRequestFullScreen || elt.webkitRequestFullscreen || elt.msRequestFullscreen).call(elt);
  }
  /**
   * @summary Exits fullscreen mode
   * @memberOf PSV.utils
   */

  function exitFullscreen() {
    /* eslint-disable-next-line max-len */
    (document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
  }
  /**
   * @summary Gets an element style
   * @memberOf PSV.utils
   * @param {HTMLElement} elt
   * @param {string} prop
   * @returns {*}
   */

  function getStyle(elt, prop) {
    return window.getComputedStyle(elt, null)[prop];
  }
  /**
   * @summary Normalize mousewheel values accross browsers
   * @memberOf PSV.utils
   * @description From Facebook's Fixed Data Table
   * {@link https://github.com/facebookarchive/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js}
   * @copyright Facebook
   * @param {WheelEvent} event
   * @returns {{spinX: number, spinY: number, pixelX: number, pixelY: number}}
   */

  function normalizeWheel(event) {
    var PIXEL_STEP = 10;
    var LINE_HEIGHT = 40;
    var PAGE_HEIGHT = 800;
    var spinX = 0;
    var spinY = 0;
    var pixelX = 0;
    var pixelY = 0; // Legacy

    if ('detail' in event) {
      spinY = event.detail;
    }

    if ('wheelDelta' in event) {
      spinY = -event.wheelDelta / 120;
    }

    if ('wheelDeltaY' in event) {
      spinY = -event.wheelDeltaY / 120;
    }

    if ('wheelDeltaX' in event) {
      spinX = -event.wheelDeltaX / 120;
    } // side scrolling on FF with DOMMouseScroll


    if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
      spinX = spinY;
      spinY = 0;
    }

    pixelX = spinX * PIXEL_STEP;
    pixelY = spinY * PIXEL_STEP;

    if ('deltaY' in event) {
      pixelY = event.deltaY;
    }

    if ('deltaX' in event) {
      pixelX = event.deltaX;
    }

    if ((pixelX || pixelY) && event.deltaMode) {
      // delta in LINE units
      if (event.deltaMode === 1) {
        pixelX *= LINE_HEIGHT;
        pixelY *= LINE_HEIGHT;
      } // delta in PAGE units
      else {
          pixelX *= PAGE_HEIGHT;
          pixelY *= PAGE_HEIGHT;
        }
    } // Fall-back if spin cannot be determined


    if (pixelX && !spinX) {
      spinX = pixelX < 1 ? -1 : 1;
    }

    if (pixelY && !spinY) {
      spinY = pixelY < 1 ? -1 : 1;
    }

    return {
      spinX: spinX,
      spinY: spinY,
      pixelX: pixelX,
      pixelY: pixelY
    };
  }

  /**
   * @summary Ensures that a number is in a given interval
   * @memberOf PSV.utils
   * @param {number} x
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function bound(x, min, max) {
    return Math.max(min, Math.min(max, x));
  }
  /**
   * @summary Checks if a value is an integer
   * @memberOf PSV.utils
   * @param {*} value
   * @returns {boolean}
   */

  function isInteger(value) {
    if (Number.isInteger) {
      return Number.isInteger(value);
    }

    return typeof value === 'number' && Number.isFinite(value) && Math.floor(value) === value;
  }
  /**
   * @summary Computes the sum of an array
   * @memberOf PSV.utils
   * @param {number[]} array
   * @returns {number}
   */

  function sum(array) {
    return array.reduce(function (a, b) {
      return a + b;
    }, 0);
  }
  /**
   * @summary Computes the distance between two points
   * @memberOf PSV.utils
   * @param {PSV.Point} p1
   * @param {PSV.Point} p2
   * @returns {number}
   */

  function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }
  /**
   * @summary Compute the shortest offset between two longitudes
   * @memberOf PSV.utils
   * @param {number} from
   * @param {number} to
   * @returns {number}
   */

  function getShortestArc(from, to) {
    var tCandidates = [0, // direct
    Math.PI * 2, // clock-wise cross zero
    -Math.PI * 2 // counter-clock-wise cross zero
    ];
    return tCandidates.reduce(function (value, candidate) {
      var newCandidate = to - from + candidate;
      return Math.abs(newCandidate) < Math.abs(value) ? newCandidate : value;
    }, Infinity);
  }
  /**
   * @summary Computes the angle between the current position and a target position
   * @memberOf PSV.utils
   * @param {PSV.Position} position1
   * @param {PSV.Position} position2
   * @returns {number}
   */

  function getAngle(position1, position2) {
    return Math.acos(Math.cos(position1.latitude) * Math.cos(position2.latitude) * Math.cos(position1.longitude - position2.longitude) + Math.sin(position1.latitude) * Math.sin(position2.latitude));
  }
  /**
   * Returns the distance between two points on a sphere of radius one
   * @memberOf PSV.utils
   * @param {number[]} p1
   * @param {number[]} p2
   * @returns {number}
   */

  function greatArcDistance(p1, p2) {
    var λ1 = p1[0],
        φ1 = p1[1];
    var λ2 = p2[0],
        φ2 = p2[1];
    var x = (λ2 - λ1) * Math.cos((φ1 + φ2) / 2);
    var y = φ2 - φ1;
    return Math.sqrt(x * x + y * y);
  }

  /**
   * @summary Transforms a string to dash-case{@link https://github.com/shahata/dasherize}
   * @memberOf PSV.utils
   * @param {string} str
   * @returns {string}
   */
  function dasherize(str) {
    return str.replace(/[A-Z](?:(?=[^A-Z])|[A-Z]*(?=[A-Z][^A-Z]|$))/g, function (s, i) {
      return (i > 0 ? '-' : '') + s.toLowerCase();
    });
  }
  /**
   * @summary Returns a function, that, when invoked, will only be triggered at most once during a given window of time.
   * @memberOf PSV.utils
   * @copyright underscore.js - modified by Clément Prévost {@link http://stackoverflow.com/a/27078401}
   * @param {Function} func
   * @param {number} wait
   * @returns {Function}
   */

  function throttle(func, wait) {
    /* eslint-disable */
    var self, args, result;
    var timeout;
    var previous = 0;

    var later = function later() {
      previous = Date.now();
      timeout = undefined;
      result = func.apply(self, args);

      if (!timeout) {
        self = args = null;
      }
    };

    return function () {
      var now = Date.now();

      if (!previous) {
        previous = now;
      }

      var remaining = wait - (now - previous);
      self = this;
      args = arguments;

      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = undefined;
        }

        previous = now;
        result = func.apply(self, args);

        if (!timeout) {
          self = args = null;
        }
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }

      return result;
    };
    /* eslint-enable */
  }
  /**
   * @summary Test if an object is a plain object
   * @memberOf PSV.utils
   * @description Test if an object is a plain object, i.e. is constructed
   * by the built-in Object constructor and inherits directly from Object.prototype
   * or null. Some built-in objects pass the test, e.g. Math which is a plain object
   * and some host or exotic objects may pass also.
   * {@link http://stackoverflow.com/a/5878101/1207670}
   * @param {*} obj
   * @returns {boolean}
   */

  function isPlainObject(obj) {
    // Basic check for Type object that's not null
    if (typeof obj === 'object' && obj !== null) {
      // If Object.getPrototypeOf supported, use it
      if (typeof Object.getPrototypeOf === 'function') {
        var proto = Object.getPrototypeOf(obj);
        return proto === Object.prototype || proto === null;
      } // Otherwise, use internal class
      // This should be reliable as if getPrototypeOf not supported, is pre-ES5


      return Object.prototype.toString.call(obj) === '[object Object]';
    } // Not an object


    return false;
  }
  /**
   * @summary Merges the enumerable attributes of two objects
   * @memberOf PSV.utils
   * @description Replaces arrays and alters the target object.
   * @copyright Nicholas Fisher <nfisher110@gmail.com>
   * @param {Object} target
   * @param {Object} src
   * @returns {Object} target
   */

  function deepmerge(target, src) {
    /* eslint-disable */
    var first = src;
    return function merge(target, src) {
      if (Array.isArray(src)) {
        if (!target || !Array.isArray(target)) {
          target = [];
        } else {
          target.length = 0;
        }

        src.forEach(function (e, i) {
          target[i] = merge(null, e);
        });
      } else if (typeof src === 'object') {
        if (!target || Array.isArray(target)) {
          target = {};
        }

        Object.keys(src).forEach(function (key) {
          if (typeof src[key] !== 'object' || !src[key] || !isPlainObject(src[key])) {
            target[key] = src[key];
          } else if (src[key] != first) {
            if (!target[key]) {
              target[key] = merge(null, src[key]);
            } else {
              merge(target[key], src[key]);
            }
          }
        });
      } else {
        target = src;
      }

      return target;
    }(target, src);
    /* eslint-enable */
  }
  /**
   * @summary Deeply clones an object
   * @memberOf PSV.utils
   * @param {Object} src
   * @returns {Object}
   */

  function clone(src) {
    return deepmerge(null, src);
  }
  /**
   * @summery Test of an object is empty
   * @memberOf PSV.utils
   * @param {object} obj
   * @returns {boolean}
   */

  function isEmpty(obj) {
    return !obj || Object.keys(obj).length === 0 && obj.constructor === Object;
  }
  /**
   * @summary Loops over enumerable properties of an object
   * @memberOf PSV.utils
   * @param {Object} object
   * @param {Function} callback
   */

  function each(object, callback) {
    Object.keys(object).forEach(function (key) {
      callback(object[key], key);
    });
  }
  /**
   * @summary Returns the intersection between two arrays
   * @memberOf PSV.utils
   * @template T
   * @param {T[]} array1
   * @param {T[]} array2
   * @returns {T[]}
   */

  function intersect(array1, array2) {
    return array1.filter(function (value) {
      return array2.indexOf(value) !== -1;
    });
  }
  /**
   * @summary Returns if a valu is null or undefined
   * @param {*} val
   * @return {boolean}
   */

  function isNil(val) {
    return val === null || val === undefined;
  }
  /**
   * @summary Returns the first non null non undefined parameter
   * @memberOf PSV.utils
   * @param {*} values
   * @return {*}
   */

  function firstNonNull() {
    for (var _len = arguments.length, values = new Array(_len), _key = 0; _key < _len; _key++) {
      values[_key] = arguments[_key];
    }

    for (var _i = 0, _values = values; _i < _values.length; _i++) {
      var val = _values[_i];

      if (!isNil(val)) {
        return val;
      }
    }

    return undefined;
  }

  /**
   * @summary Custom error used in the lib
   * @param {string} message
   * @constructor
   * @memberOf PSV
   */
  function PSVError(message) {
    this.message = message; // Use V8's native method if available, otherwise fallback

    if ('captureStackTrace' in Error) {
      Error.captureStackTrace(this, PSVError);
    } else {
      this.stack = new Error().stack;
    }
  }

  PSVError.prototype = Object.create(Error.prototype);
  PSVError.prototype.name = 'PSVError';
  PSVError.prototype.constructor = PSVError;

  /**
   * @summary Displays a warning in the console
   * @memberOf PSV.utils
   * @param {string} message
   */

  function logWarn(message) {
    console.warn("PhotoSphereViewer: " + message);
  }
  /**
   * @summary Checks if an object is a {PSV.ExtendedPosition}, ie has x/y or longitude/latitude
   * @memberOf PSV.utils
   * @param {object} object
   * @returns {boolean}
   */

  function isExtendedPosition(object) {
    return [['x', 'y'], ['longitude', 'latitude']].some(function (_ref) {
      var key1 = _ref[0],
          key2 = _ref[1];
      return object[key1] !== undefined && object[key2] !== undefined;
    });
  }
  /**
   * @summary Returns the value of a given attribute in the panorama metadata
   * @memberOf PSV.utils
   * @param {string} data
   * @param {string} attr
   * @returns (number)
   */

  function getXMPValue(data, attr) {
    // XMP data are stored in children
    var result = data.match('<GPano:' + attr + '>(.*)</GPano:' + attr + '>');

    if (result !== null) {
      var val = parseInt(result[1], 10);
      return isNaN(val) ? null : val;
    } // XMP data are stored in attributes


    result = data.match('GPano:' + attr + '="(.*?)"');

    if (result !== null) {
      var _val = parseInt(result[1], 10);

      return isNaN(_val) ? null : _val;
    }

    return null;
  }
  /**
   * @readonly
   * @private
   * @type {{top: string, left: string, bottom: string, center: string, right: string}}
   */

  var CSS_POSITIONS = {
    top: '0%',
    bottom: '100%',
    left: '0%',
    right: '100%',
    center: '50%'
  };
  /**
   * @summary Translate CSS values like "top center" or "10% 50%" as top and left positions
   * @memberOf PSV.utils
   * @description The implementation is as close as possible to the "background-position" specification
   * {@link https://developer.mozilla.org/en-US/docs/Web/CSS/background-position}
   * @param {string|object} value
   * @returns {PSV.Point}
   */

  function parsePosition(value) {
    if (!value) {
      return {
        x: 0.5,
        y: 0.5
      };
    }

    if (typeof value === 'object') {
      return value;
    }

    var tokens = value.toLocaleLowerCase().split(' ').slice(0, 2);

    if (tokens.length === 1) {
      if (CSS_POSITIONS[tokens[0]] !== undefined) {
        tokens = [tokens[0], 'center'];
      } else {
        tokens = [tokens[0], tokens[0]];
      }
    }

    var xFirst = tokens[1] !== 'left' && tokens[1] !== 'right' && tokens[0] !== 'top' && tokens[0] !== 'bottom';
    tokens = tokens.map(function (token) {
      return CSS_POSITIONS[token] || token;
    });

    if (!xFirst) {
      tokens.reverse();
    }

    var parsed = tokens.join(' ').match(/^([0-9.]+)% ([0-9.]+)%$/);

    if (parsed) {
      return {
        x: parseFloat(parsed[1]) / 100,
        y: parseFloat(parsed[2]) / 100
      };
    } else {
      return {
        x: 0.5,
        y: 0.5
      };
    }
  }
  /**
   * @summary Parses an speed
   * @memberOf PSV.utils
   * @param {string|number} speed - The speed, in radians/degrees/revolutions per second/minute
   * @returns {number} radians per second
   * @throws {PSV.PSVError} when the speed cannot be parsed
   */

  function parseSpeed(speed) {
    var parsed;

    if (typeof speed === 'string') {
      var speedStr = speed.toString().trim(); // Speed extraction

      var speedValue = parseFloat(speedStr.replace(/^(-?[0-9]+(?:\.[0-9]*)?).*$/, '$1'));
      var speedUnit = speedStr.replace(/^-?[0-9]+(?:\.[0-9]*)?(.*)$/, '$1').trim(); // "per minute" -> "per second"

      if (speedUnit.match(/(pm|per minute)$/)) {
        speedValue /= 60;
      } // Which unit?


      switch (speedUnit) {
        // Degrees per minute / second
        case 'dpm':
        case 'degrees per minute':
        case 'dps':
        case 'degrees per second':
          parsed = THREE.Math.degToRad(speedValue);
          break;
        // Radians per minute / second

        case 'rdpm':
        case 'radians per minute':
        case 'rdps':
        case 'radians per second':
          parsed = speedValue;
          break;
        // Revolutions per minute / second

        case 'rpm':
        case 'revolutions per minute':
        case 'rps':
        case 'revolutions per second':
          parsed = speedValue * Math.PI * 2;
          break;
        // Unknown unit

        default:
          throw new PSVError('Unknown speed unit "' + speedUnit + '"');
      }
    } else {
      parsed = speed;
    }

    return parsed;
  }
  /**
   * @summary Parses an angle value in radians or degrees and returns a normalized value in radians
   * @memberOf PSV.utils
   * @param {string|number} angle - eg: 3.14, 3.14rad, 180deg
   * @param {boolean} [zeroCenter=false] - normalize between -Pi - Pi instead of 0 - 2*Pi
   * @param {boolean} [halfCircle=zeroCenter] - normalize between -Pi/2 - Pi/2 instead of -Pi - Pi
   * @returns {number}
   * @throws {PSV.PSVError} when the angle cannot be parsed
   */

  function parseAngle(angle, zeroCenter, halfCircle) {
    if (zeroCenter === void 0) {
      zeroCenter = false;
    }

    if (halfCircle === void 0) {
      halfCircle = zeroCenter;
    }

    var parsed;

    if (typeof angle === 'string') {
      var match = angle.toLowerCase().trim().match(/^(-?[0-9]+(?:\.[0-9]*)?)(.*)$/);

      if (!match) {
        throw new PSVError('Unknown angle "' + angle + '"');
      }

      var value = parseFloat(match[1]);
      var unit = match[2];

      if (unit) {
        switch (unit) {
          case 'deg':
          case 'degs':
            parsed = THREE.Math.degToRad(value);
            break;

          case 'rad':
          case 'rads':
            parsed = value;
            break;

          default:
            throw new PSVError('Unknown angle unit "' + unit + '"');
        }
      } else {
        parsed = value;
      }
    } else if (typeof angle === 'number' && !isNaN(angle)) {
      parsed = angle;
    } else {
      throw new PSVError('Unknown angle "' + angle + '"');
    }

    parsed = (zeroCenter ? parsed + Math.PI : parsed) % (Math.PI * 2);

    if (parsed < 0) {
      parsed += Math.PI * 2;
    }

    return zeroCenter ? bound(parsed - Math.PI, -Math.PI / (halfCircle ? 2 : 1), Math.PI / (halfCircle ? 2 : 1)) : parsed;
  }

  /**
   * @namespace PSV.utils
   */

  var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    toggleClass: toggleClass,
    addClasses: addClasses,
    removeClasses: removeClasses,
    hasParent: hasParent,
    getClosest: getClosest,
    getEventKey: getEventKey,
    isFullscreenEnabled: isFullscreenEnabled,
    requestFullscreen: requestFullscreen,
    exitFullscreen: exitFullscreen,
    getStyle: getStyle,
    normalizeWheel: normalizeWheel,
    bound: bound,
    isInteger: isInteger,
    sum: sum,
    distance: distance,
    getShortestArc: getShortestArc,
    getAngle: getAngle,
    greatArcDistance: greatArcDistance,
    dasherize: dasherize,
    throttle: throttle,
    isPlainObject: isPlainObject,
    deepmerge: deepmerge,
    clone: clone,
    isEmpty: isEmpty,
    each: each,
    intersect: intersect,
    isNil: isNil,
    firstNonNull: firstNonNull,
    logWarn: logWarn,
    isExtendedPosition: isExtendedPosition,
    getXMPValue: getXMPValue,
    parsePosition: parsePosition,
    parseSpeed: parseSpeed,
    parseAngle: parseAngle
  });

  /**
   * @callback OnTick
   * @summary Function called for each animation frame with computed properties
   * @memberOf PSV.Animation
   * @param {Object.<string, number>} properties - current values
   * @param {float} progress - 0 to 1
   */

  /**
   * @summary Interpolation helper for animations
   * @memberOf PSV
   * @description
   * Implements the Promise API with an additional "cancel" and "finally" methods.
   * The promise is resolved when the animation is complete and rejected if the animation is cancelled.
   * @example
   * new Animation({
   *     properties: {
   *         width: {start: 100, end: 200}
   *     },
   *     duration: 5000,
   *     onTick: (properties) => element.style.width = `${properties.width}px`;
   * })
   */

  var Animation = /*#__PURE__*/function () {
    /**
     * @param {Object} options
     * @param {Object.<string, Object>} options.properties
     * @param {number} options.properties[].start
     * @param {number} options.properties[].end
     * @param {number} options.duration
     * @param {number} [options.delay=0]
     * @param {string} [options.easing='linear']
     * @param {PSV.Animation.OnTick} options.onTick - called on each frame
     */
    function Animation(options) {
      var _this = this;

      this.__cancelled = false;
      this.__resolved = false;
      this.__promise = new Promise(function (resolve, reject) {
        _this.__resolve = resolve;
        _this.__reject = reject;
      });

      if (options) {
        if (!options.easing || typeof options.easing === 'string') {
          options.easing = EASINGS[options.easing || 'linear'];
        }

        this.__start = null;
        this.options = options;

        if (options.delay) {
          this.__delayTimeout = setTimeout(function () {
            _this.__delayTimeout = null;
            window.requestAnimationFrame(function (t) {
              return _this.__run(t);
            });
          }, options.delay);
        } else {
          window.requestAnimationFrame(function (t) {
            return _this.__run(t);
          });
        }
      }
    }
    /**
     * @summary Main loop for the animation
     * @param {number} timestamp
     * @private
     */


    var _proto = Animation.prototype;

    _proto.__run = function __run(timestamp) {
      var _this2 = this;

      // the animation has been cancelled
      if (this.__cancelled) {
        return;
      } // first iteration


      if (this.__start === null) {
        this.__start = timestamp;
      } // compute progress


      var progress = (timestamp - this.__start) / this.options.duration;
      var current = {};

      if (progress < 1.0) {
        // interpolate properties
        each(this.options.properties, function (prop, name) {
          if (prop) {
            current[name] = prop.start + (prop.end - prop.start) * _this2.options.easing(progress);
          }
        });
        this.options.onTick(current, progress);
        window.requestAnimationFrame(function (t) {
          return _this2.__run(t);
        });
      } else {
        // call onTick one last time with final values
        each(this.options.properties, function (prop, name) {
          if (prop) {
            current[name] = prop.end;
          }
        });
        this.options.onTick(current, 1.0);
        window.requestAnimationFrame(function () {
          _this2.__resolved = true;

          _this2.__resolve();
        });
      }
    }
    /**
     * @summary Animation chaining
     * @param {Function} [onFulfilled] - Called when the animation is complete, can return a new animation
     * @param {Function} [onRejected] - Called when the animation is cancelled
     * @returns {PSV.Animation}
     */
    ;

    _proto.then = function then(onFulfilled, onRejected) {
      var _this3 = this;

      if (onFulfilled === void 0) {
        onFulfilled = null;
      }

      if (onRejected === void 0) {
        onRejected = null;
      }

      var p = new Animation(); // Allow cancellation to climb up the promise chain

      p.__promise.then(null, function () {
        return _this3.cancel();
      });

      this.__promise.then(function () {
        return p.__resolve(onFulfilled ? onFulfilled() : undefined);
      }, function () {
        return p.__reject(onRejected ? onRejected() : undefined);
      });

      return p;
    }
    /**
     * @summary Alias to `.then(null, onRejected)`
     * @param {Function} onRejected - Called when the animation has been cancelled
     * @returns {PSV.Animation}
     */
    ;

    _proto.catch = function _catch(onRejected) {
      return this.then(undefined, onRejected);
    }
    /**
     * @summary Alias to `.then(onFinally, onFinally)`
     * @param {Function} onFinally - Called when the animation is either complete or cancelled
     * @returns {PSV.Animation}
     */
    ;

    _proto.finally = function _finally(onFinally) {
      return this.then(onFinally, onFinally);
    }
    /**
     * @summary Cancels the animation
     */
    ;

    _proto.cancel = function cancel() {
      if (!this.__cancelled && !this.__resolved) {
        this.__cancelled = true;

        this.__reject();

        if (this.__delayTimeout) {
          window.cancelAnimationFrame(this.__delayTimeout);
          this.__delayTimeout = null;
        }
      }
    }
    /**
     * @summary Returns a resolved animation promise
     * @returns {PSV.Animation}
     */
    ;

    Animation.resolve = function resolve() {
      var p = Promise.resolve();

      p.cancel = function () {};

      p.finally = function (onFinally) {
        return p.then(onFinally, onFinally);
      };

      return p;
    };

    return Animation;
  }();

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

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
   * @namespace PSV.components
   */

  /**
   * @summary Base component class
   * @memberof PSV.components
   * @abstract
   */
  var AbstractComponent = /*#__PURE__*/function () {
    /**
     * @param {PSV.Viewer | PSV.components.AbstractComponent} parent
     * @param {string} className - CSS class added to the component's container
     */
    function AbstractComponent(parent, className) {
      /**
       * @summary Reference to main controller
       * @type {PSV.Viewer}
       * @readonly
       */
      this.psv = parent.psv || parent;
      /**
       * @member {PSV.Viewer|PSV.components.AbstractComponent}
       * @readonly
       */

      this.parent = parent;
      this.parent.children.push(this);
      /**
       * @summary All child components
       * @type {PSV.components.AbstractComponent[]}
       * @readonly
       * @package
       */

      this.children = [];
      /**
       * @summary Internal properties
       * @member {Object}
       * @protected
       * @property {boolean} visible - Visibility of the component
       */

      this.prop = {
        visible: true
      };
      /**
       * @member {HTMLElement}
       * @readonly
       */

      this.container = document.createElement('div');
      this.container.className = className;
      this.parent.container.appendChild(this.container);
    }
    /**
     * @summary Destroys the component
     * @protected
     */


    var _proto = AbstractComponent.prototype;

    _proto.destroy = function destroy() {
      this.parent.container.removeChild(this.container);
      var childIdx = this.parent.children.indexOf(this);

      if (childIdx !== -1) {
        this.parent.children.splice(childIdx, 1);
      }

      this.children.slice().forEach(function (child) {
        return child.destroy();
      });
      this.children.length = 0;
      delete this.container;
      delete this.parent;
      delete this.psv;
      delete this.prop;
    }
    /**
     * @summary Refresh UI
     * @description Must be be a very lightweight operation
     * @package
     */
    ;

    _proto.refreshUi = function refreshUi() {
      var _this = this;

      this.children.every(function (child) {
        child.refreshUi();
        return _this.psv.prop.uiRefresh === true;
      });
    }
    /**
     * @summary Displays or hides the component
     */
    ;

    _proto.toggle = function toggle() {
      if (this.isVisible()) {
        this.hide();
      } else {
        this.show();
      }
    }
    /**
     * @summary Hides the component
     */
    ;

    _proto.hide = function hide() {
      this.container.style.display = 'none';
      this.prop.visible = false;
    }
    /**
     * @summary Displays the component
     */
    ;

    _proto.show = function show() {
      this.container.style.display = '';
      this.prop.visible = true;
    }
    /**
     * @summary Check if the component is visible
     * @returns {boolean}
     */
    ;

    _proto.isVisible = function isVisible() {
      return this.prop.visible;
    };

    return AbstractComponent;
  }();

  /**
   * @namespace PSV.buttons
   */

  /**
   * @summary Base navbar button class
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.buttons
   * @abstract
   */

  var AbstractButton = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(AbstractButton, _AbstractComponent);

    /**
     * @summary Unique identifier of the button
     * @member {string}
     * @readonly
     * @static
     */

    /**
     * @summary SVG icon name injected in the button
     * @member {string}
     * @readonly
     * @static
     */

    /**
     * @summary SVG icon name injected in the button when it is active
     * @member {string}
     * @readonly
     * @static
     */

    /**
     * @param {PSV.components.Navbar} navbar
     * @param {string} [className] - Additional CSS classes
     * @param {boolean} [collapsable=false] - `true` if the button can be moved to menu when the navbar is too small
     */
    function AbstractButton(navbar, className, collapsable) {
      var _this;

      if (className === void 0) {
        className = '';
      }

      if (collapsable === void 0) {
        collapsable = false;
      }

      _this = _AbstractComponent.call(this, navbar, 'psv-button ' + className) || this;
      /**
       * @override
       * @property {string} id - Unique identifier of the button
       * @property {boolean} enabled
       * @property {boolean} supported
       * @property {boolean} collapsed
       * @property {boolean} active
       * @property {number} width
       */

      _this.prop = _extends({}, _this.prop, {
        id: _this.constructor.id,
        collapsable: collapsable,
        enabled: true,
        supported: true,
        collapsed: false,
        active: false,
        width: _this.container.offsetWidth
      });

      if (_this.constructor.icon) {
        _this.__setIcon(_this.constructor.icon);
      }

      if (_this.prop.id && _this.psv.config.lang[_this.prop.id]) {
        _this.container.title = _this.psv.config.lang[_this.prop.id];
      }

      _this.container.addEventListener('click', function (e) {
        if (_this.prop.enabled) {
          _this.onClick();
        }

        e.stopPropagation();
      });

      return _this;
    }
    /**
     * @package
     */


    var _proto = AbstractButton.prototype;

    _proto.checkSupported = function checkSupported() {
      var _this2 = this;

      var supportedOrObject = this.isSupported();

      if (isPlainObject(supportedOrObject)) {
        if (supportedOrObject.initial === false) {
          this.hide();
          this.prop.supported = false;
        }

        supportedOrObject.promise.then(function (supported) {
          if (!_this2.prop) {
            return; // the component has been destroyed
          }

          _this2.prop.supported = supported;

          if (!supported && _this2.prop.visible) {
            _this2.hide();
          } else if (supported && !_this2.prop.visible) {
            _this2.show();
          }
        });
      } else if (!supportedOrObject) {
        this.hide();
        this.prop.supported = false;
      }
    }
    /**
     * @summary Checks if the button can be displayed
     * @returns {boolean|{initial: boolean, promise: Promise<boolean>}}
     */
    ;

    _proto.isSupported = function isSupported() {
      return true;
    }
    /**
     * @summary Changes the active state of the button
     * @param {boolean} [active] - forced state
     */
    ;

    _proto.toggleActive = function toggleActive(active) {
      this.prop.active = active !== undefined ? active : !this.prop.active;
      toggleClass(this.container, 'psv-button--active', this.prop.active);

      if (this.constructor.iconActive) {
        this.__setIcon(this.prop.active ? this.constructor.iconActive : this.constructor.icon);
      }
    }
    /**
     * @override
     */
    ;

    _proto.show = function show(refresh) {
      if (refresh === void 0) {
        refresh = true;
      }

      if (!this.isVisible()) {
        this.prop.visible = true;

        if (!this.prop.collapsed) {
          this.container.style.display = '';
        }

        if (refresh) {
          this.psv.refreshUi("show button " + this.prop.id);
        }
      }
    }
    /**
     * @override
     */
    ;

    _proto.hide = function hide(refresh) {
      if (refresh === void 0) {
        refresh = true;
      }

      if (this.isVisible()) {
        this.prop.visible = false;
        this.container.style.display = 'none';

        if (refresh) {
          this.psv.refreshUi("hide button " + this.prop.id);
        }
      }
    }
    /**
     * @summary Disables the button
     */
    ;

    _proto.disable = function disable() {
      this.container.classList.add('psv-button--disabled');
      this.prop.enabled = false;
    }
    /**
     * @summary Enables the button
     */
    ;

    _proto.enable = function enable() {
      this.container.classList.remove('psv-button--disabled');
      this.prop.enabled = true;
    }
    /**
     * @summary Collapses the button in the navbar menu
     */
    ;

    _proto.collapse = function collapse() {
      this.prop.collapsed = true;
      this.container.style.display = 'none';
    }
    /**
     * @summary Uncollapses the button from the navbar menu
     */
    ;

    _proto.uncollapse = function uncollapse() {
      this.prop.collapsed = false;

      if (this.prop.visible) {
        this.container.style.display = '';
      }
    }
    /**
     * @summary Set the button icon
     * @param {string} icon SVG
     * @param {HTMLElement} [container] - default is the main button container
     * @private
     */
    ;

    _proto.__setIcon = function __setIcon(icon, container) {
      if (container === void 0) {
        container = this.container;
      }

      if (icon) {
        container.innerHTML = icon; // classList not supported on IE11, className is read-only !!!!

        container.querySelector('svg').setAttribute('class', 'psv-button-svg');
      } else {
        container.innerHTML = '';
      }
    }
    /**
     * @summary Action when the button is clicked
     * @private
     * @abstract
     */
    ;

    _proto.onClick = function onClick() {
      throw new PSVError("onClick not implemented for button \"" + this.prop.id + "\".");
    };

    return AbstractButton;
  }(AbstractComponent);
  AbstractButton.id = null;
  AbstractButton.icon = null;
  AbstractButton.iconActive = null;

  var playActive = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 41 41\"><path fill=\"currentColor\" d=\"M40.5 14.1c-.1-.1-1.2-.5-2.898-1-.102 0-.202-.1-.202-.2C34.5 6.5 28 2 20.5 2S6.6 6.5 3.7 12.9c0 .1-.1.1-.2.2-1.7.6-2.8 1-2.9 1l-.6.3v12.1l.6.2c.1 0 1.1.399 2.7.899.1 0 .2.101.2.199C6.3 34.4 12.9 39 20.5 39c7.602 0 14.102-4.6 16.9-11.1 0-.102.1-.102.199-.2 1.699-.601 2.699-1 2.801-1l.6-.3V14.3l-.5-.2zM6.701 11.5C9.7 7 14.8 4 20.5 4c5.8 0 10.9 3 13.8 7.5.2.3-.1.6-.399.5-3.799-1-8.799-2-13.6-2-4.7 0-9.5 1-13.2 2-.3.1-.5-.2-.4-.5zM25.1 20.3L18.7 24c-.3.2-.7 0-.7-.5v-7.4c0-.4.4-.6.7-.4l6.399 3.8c.301.1.301.6.001.8zm9.4 8.901A16.421 16.421 0 0 1 20.5 37c-5.9 0-11.1-3.1-14-7.898-.2-.302.1-.602.4-.5 3.9 1 8.9 2.1 13.6 2.1 5 0 9.9-1 13.602-2 .298-.1.5.198.398.499z\"/><!--Created by Nick Bluth from the Noun Project--></svg>\n";

  var play = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 41 41\"><path fill=\"currentColor\" d=\"M40.5 14.1c-.1-.1-1.2-.5-2.899-1-.101 0-.2-.1-.2-.2C34.5 6.5 28 2 20.5 2S6.6 6.5 3.7 12.9c0 .1-.1.1-.2.2-1.7.6-2.8 1-2.9 1l-.6.3v12.1l.6.2c.1 0 1.1.4 2.7.9.1 0 .2.1.2.199C6.3 34.4 12.9 39 20.5 39c7.601 0 14.101-4.6 16.9-11.1 0-.101.1-.101.2-.2 1.699-.6 2.699-1 2.8-1l.6-.3V14.3l-.5-.2zM20.5 4c5.8 0 10.9 3 13.8 7.5.2.3-.1.6-.399.5-3.8-1-8.8-2-13.6-2-4.7 0-9.5 1-13.2 2-.3.1-.5-.2-.4-.5C9.7 7 14.8 4 20.5 4zm0 33c-5.9 0-11.1-3.1-14-7.899-.2-.301.1-.601.4-.5 3.9 1 8.9 2.1 13.6 2.1 5 0 9.9-1 13.601-2 .3-.1.5.2.399.5A16.422 16.422 0 0 1 20.5 37zm18.601-12.1c0 .1-.101.3-.2.3-2.5.9-10.4 3.6-18.4 3.6-7.1 0-15.6-2.699-18.3-3.6C2.1 25.2 2 25 2 24.9V16c0-.1.1-.3.2-.3 2.6-.9 10.6-3.6 18.2-3.6 7.5 0 15.899 2.7 18.5 3.6.1 0 .2.2.2.3v8.9z\"/><path fill=\"currentColor\" d=\"M18.7 24l6.4-3.7c.3-.2.3-.7 0-.8l-6.4-3.8c-.3-.2-.7 0-.7.4v7.4c0 .5.4.7.7.5z\"/><!--Created by Nick Bluth from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar autorotate button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var AutorotateButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(AutorotateButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function AutorotateButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-autorotate-button', true) || this;

      _this.psv.on(EVENTS.AUTOROTATE, _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = AutorotateButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.AUTOROTATE, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.AUTOROTATE:
          this.toggleActive(e.args[0]);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles autorotate
     */
    ;

    _proto.onClick = function onClick() {
      this.psv.toggleAutorotate();
    };

    return AutorotateButton;
  }(AbstractButton);
  AutorotateButton.id = 'autorotate';
  AutorotateButton.icon = play;
  AutorotateButton.iconActive = playActive;

  /**
   * @summary Navigation bar custom button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var CustomButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(CustomButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     * @param {PSV.NavbarCustomButton} config
     */
    function CustomButton(navbar, config) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-custom-button', config.collapsable !== false) || this;
      /**
       * @member {Object}
       * @readonly
       * @private
       */

      _this.config = config;

      if (_this.config.id) {
        _this.prop.id = _this.config.id;
      } else {
        _this.prop.id = 'psvButton-' + Math.random().toString(36).substr(2, 9);
      }

      if (_this.config.className) {
        addClasses(_this.container, _this.config.className);
      }

      if (_this.config.title) {
        _this.container.title = _this.config.title;
      }

      if (_this.config.content) {
        _this.container.innerHTML = _this.config.content;
      }

      _this.width = _this.container.offsetWidth;

      if (_this.config.enabled === false) {
        _this.disable();
      }

      if (_this.config.visible === false) {
        _this.hide();
      }

      return _this;
    }
    /**
     * @override
     */


    var _proto = CustomButton.prototype;

    _proto.destroy = function destroy() {
      delete this.config;

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @override
     * @description Calls user method
     */
    ;

    _proto.onClick = function onClick() {
      if (this.config.onClick) {
        this.config.onClick.apply(this.psv);
      }
    };

    return CustomButton;
  }(AbstractButton);

  var download = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"currentColor\" d=\"M83.3 35.6h-17V3H32.2v32.6H16.6l33.6 32.7 33-32.7z\"/><path fill=\"currentColor\" d=\"M83.3 64.2v16.3H16.6V64.2H-.1v32.6H100V64.2H83.3z\"/><!--Created by Michael Zenaty from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar download button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var DownloadButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(DownloadButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function DownloadButton(navbar) {
      return _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-download-button', true) || this;
    }
    /**
     * @override
     * @description Asks the browser to download the panorama source file
     */


    var _proto = DownloadButton.prototype;

    _proto.onClick = function onClick() {
      var _this = this;

      var link = document.createElement('a');
      link.href = this.psv.config.panorama;
      link.download = this.psv.config.panorama;
      this.psv.container.appendChild(link);
      link.click();
      setTimeout(function () {
        _this.psv.container.removeChild(link);
      }, 100);
    };

    return DownloadButton;
  }(AbstractButton);
  DownloadButton.id = 'download';
  DownloadButton.icon = download;

  var fullscreenIn = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"currentColor\" d=\"M100 40H87.1V18.8h-21V6H100zM100 93.2H66V80.3h21.1v-21H100zM34 93.2H0v-34h12.9v21.1h21zM12.9 40H0V6h34v12.9H12.8z\"/><!--Created by Garrett Knoll from the Noun Project--></svg>\n";

  var fullscreenOut = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"currentColor\" d=\"M66 7h13v21h21v13H66zM66 60.3h34v12.9H79v21H66zM0 60.3h34v34H21V73.1H0zM21 7h13v34H0V28h21z\"/><!--Created by Garrett Knoll from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar fullscreen button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var FullscreenButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(FullscreenButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function FullscreenButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-fullscreen-button') || this;

      _this.psv.on(EVENTS.FULLSCREEN_UPDATED, _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = FullscreenButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.FULLSCREEN_UPDATED, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * Handle events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.FULLSCREEN_UPDATED:
          this.toggleActive(e.args[0]);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles fullscreen
     */
    ;

    _proto.onClick = function onClick() {
      this.psv.toggleFullscreen();
    };

    return FullscreenButton;
  }(AbstractButton);
  FullscreenButton.id = 'fullscreen';
  FullscreenButton.icon = fullscreenIn;
  FullscreenButton.iconActive = fullscreenOut;

  var menuIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"10 10 80 80\"><g fill=\"currentColor\"><circle r=\"10\" cx=\"20\" cy=\"20\"/><circle r=\"10\" cx=\"50\" cy=\"20\"/><circle r=\"10\" cx=\"80\" cy=\"20\"/><circle r=\"10\" cx=\"20\" cy=\"50\"/><circle r=\"10\" cx=\"50\" cy=\"50\"/><circle r=\"10\" cx=\"80\" cy=\"50\"/><circle r=\"10\" cx=\"20\" cy=\"80\"/><circle r=\"10\" cx=\"50\" cy=\"80\"/><circle r=\"10\" cx=\"80\" cy=\"80\"/></g><!-- Created by Richard Kunák from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar menu button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var MenuButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(MenuButton, _AbstractButton);

    /**
     * @summary Property name added to buttons list
     * @type {string}
     * @constant
     */

    /**
     * @summary Menu template
     * @param {AbstractButton[]} buttons
     * @param {PSV.Viewer} psv
     * @param {string} dataKey
     * @returns {string}
     */

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function MenuButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-menu-button') || this;

      _this.psv.on(EVENTS.OPEN_PANEL, _assertThisInitialized(_this));

      _this.psv.on(EVENTS.CLOSE_PANEL, _assertThisInitialized(_this));

      _this.hide();

      return _this;
    }
    /**
     * @override
     */


    var _proto = MenuButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.OPEN_PANEL, this);
      this.psv.off(EVENTS.CLOSE_PANEL, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.OPEN_PANEL:
          this.toggleActive(e.args[0] === IDS.MENU);
          break;

        case EVENTS.CLOSE_PANEL:
          this.toggleActive(false);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     */
    ;

    _proto.hide = function hide(refresh) {
      _AbstractButton.prototype.hide.call(this, refresh);

      this.__hideMenu();
    }
    /**
     * @override
     */
    ;

    _proto.show = function show(refresh) {
      _AbstractButton.prototype.show.call(this, refresh);

      if (this.prop.active) {
        this.__showMenu();
      }
    }
    /**
     * @override
     * @description Toggles menu
     */
    ;

    _proto.onClick = function onClick() {
      if (this.prop.active) {
        this.__hideMenu();
      } else {
        this.__showMenu();
      }
    };

    _proto.__showMenu = function __showMenu() {
      var _this2 = this;

      this.psv.panel.show({
        id: IDS.MENU,
        content: MenuButton.MENU_TEMPLATE(this.parent.collapsed, this.psv, dasherize(MenuButton.BUTTON_DATA)),
        noMargin: true,
        clickHandler: function clickHandler(e) {
          var li = e.target ? getClosest(e.target, 'li') : undefined;
          var buttonId = li ? li.dataset[MenuButton.BUTTON_DATA] : undefined;

          if (buttonId) {
            _this2.parent.getButton(buttonId).onClick();

            _this2.__hideMenu();
          }
        }
      });
    };

    _proto.__hideMenu = function __hideMenu() {
      if (this.psv.panel) {
        this.psv.panel.hide(IDS.MENU);
      }
    };

    return MenuButton;
  }(AbstractButton);
  MenuButton.id = 'menu';
  MenuButton.icon = menuIcon;
  MenuButton.BUTTON_DATA = 'psvButton';

  MenuButton.MENU_TEMPLATE = function (buttons, psv, dataKey) {
    return "\n<div class=\"psv-panel-menu psv-panel-menu--stripped\">\n  <h1 class=\"psv-panel-menu-title\">" + menuIcon + " " + psv.config.lang.menu + "</h1>\n  <ul class=\"psv-panel-menu-list\">\n    " + buttons.map(function (button) {
      return "\n    <li data-" + dataKey + "=\"" + button.prop.id + "\" class=\"psv-panel-menu-item\">\n      <span class=\"psv-panel-menu-item-icon\">" + button.container.innerHTML + "</span>\n      <span class=\"psv-panel-menu-item-label\">" + button.container.title + "</span>\n    </li>\n    ";
    }).join('') + "\n  </ul>\n</div>\n";
  };

  /**
   * @summary General information about the system
   * @constant
   * @memberOf PSV
   * @property {boolean} loaded - Indicates if the system has been loaded yet
   * @property {Function} load - Loads the system if not already loaded
   * @property {number} pixelRatio
   * @property {boolean} isWebGLSupported
   * @property {number} maxCanvasWidth
   * @property {string} mouseWheelEvent
   * @property {string} fullscreenEvent
   * @property {Function} getMaxCanvasWidth - Returns the max width of a canvas allowed by the browser
   * @property {Promise<boolean>} isTouchEnabled
   */

  var SYSTEM = {
    loaded: false,
    pixelRatio: 1,
    isWebGLSupported: false,
    isTouchEnabled: null,
    maxTextureWidth: 0,
    mouseWheelEvent: null,
    fullscreenEvent: null
  };
  /**
   * @summary Loads the system if not already loaded
   */

  SYSTEM.load = function () {
    if (!SYSTEM.loaded) {
      var ctx = getWebGLCtx();
      SYSTEM.loaded = true;
      SYSTEM.pixelRatio = window.devicePixelRatio || 1;
      SYSTEM.isWebGLSupported = ctx != null;
      SYSTEM.isTouchEnabled = isTouchEnabled();
      SYSTEM.maxTextureWidth = getMaxTextureWidth(ctx);
      SYSTEM.mouseWheelEvent = getMouseWheelEvent();
      SYSTEM.fullscreenEvent = getFullscreenEvent();
    }
  };

  var maxCanvasWidth = null;

  SYSTEM.getMaxCanvasWidth = function () {
    if (maxCanvasWidth === null) {
      maxCanvasWidth = getMaxCanvasWidth(SYSTEM.maxTextureWidth);
    }

    return maxCanvasWidth;
  };
  /**
   * @summary Tries to return a canvas webgl context
   * @returns {WebGLRenderingContext}
   * @private
   */


  function getWebGLCtx() {
    var canvas = document.createElement('canvas');
    var names = ['webgl', 'experimental-webgl', 'moz-webgl', 'webkit-3d'];
    var context = null;

    if (!canvas.getContext) {
      return null;
    }

    if (names.some(function (name) {
      try {
        context = canvas.getContext(name);
        return context !== null;
      } catch (e) {
        return false;
      }
    })) {
      return context;
    } else {
      return null;
    }
  }
  /**
   * @summary Detects if the user is using a touch screen
   * @returns {Promise<boolean>}
   * @private
   */


  function isTouchEnabled() {
    return new Promise(function (resolve) {
      var listener = function listener(e) {
        if (e) {
          resolve(true);
        } else {
          resolve(false);
        }

        window.removeEventListener('touchstart', listener);
      };

      window.addEventListener('touchstart', listener, false); // after 10 secs auto-reject the promise

      setTimeout(listener, 10000);
    });
  }
  /**
   * @summary Gets max texture width in WebGL context
   * @returns {number}
   * @private
   */


  function getMaxTextureWidth(ctx) {
    if (ctx !== null) {
      return ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
    } else {
      return 0;
    }
  }
  /**
   * @summary Gets max canvas width supported by the browser.
   * We only test powers of 2 and height = width / 2 because that's what we need to generate WebGL textures
   * @param maxWidth
   * @return {number}
   * @private
   */


  function getMaxCanvasWidth(maxWidth) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = maxWidth;
    canvas.height = maxWidth / 2;

    while (canvas.width > 1024) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1, 1);

      try {
        if (ctx.getImageData(0, 0, 1, 1).data[0] === 255) {
          return canvas.width;
        }
      } catch (e) {// continue
      }

      canvas.width /= 2;
      canvas.height /= 2;
    }

    throw new PSVError('Unable to detect system capabilities');
  }
  /**
   * @summary Gets the event name for mouse wheel
   * @returns {string}
   * @private
   */


  function getMouseWheelEvent() {
    if ('onwheel' in document.createElement('div')) {
      // Modern browsers support "wheel"
      return 'wheel';
    } else if (document.onmousewheel !== undefined) {
      // Webkit and IE support at least "mousewheel"
      return 'mousewheel';
    } else {
      // let's assume that remaining browsers are older Firefox
      return 'DOMMouseScroll';
    }
  }
  /**
   * @summary Map between fullsceen method and fullscreen event name
   * @type {Object<string, string>}
   * @readonly
   * @private
   */


  var FULLSCREEN_EVT_MAP = {
    exitFullscreen: 'fullscreenchange',
    webkitExitFullscreen: 'webkitfullscreenchange',
    mozCancelFullScreen: 'mozfullscreenchange',
    msExitFullscreen: 'MSFullscreenChange'
  };
  /**
   * @summary  Gets the event name for fullscreen
   * @returns {string}
   * @private
   */

  function getFullscreenEvent() {
    var validExits = Object.keys(FULLSCREEN_EVT_MAP).filter(function (exit) {
      return exit in document;
    });

    if (validExits.length) {
      return FULLSCREEN_EVT_MAP[validExits[0]];
    } else {
      return null;
    }
  }

  /**
   * @summary Navigation bar zoom button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var AbstractZoomButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(AbstractZoomButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     * @param {number} value
     */
    function AbstractZoomButton(navbar, value) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-button--hover-scale psv-zoom-button') || this;
      /**
       * @override
       * @property {number} value
       * @property {boolean} buttondown
       * @property {*} longPressTimeout
       * @property {PSV.Animation} longPressAnimation
       */

      _this.prop = _extends({}, _this.prop, {
        value: value,
        buttondown: false,
        longPressTimeout: null,
        longPressAnimation: null
      });

      _this.container.addEventListener('mousedown', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('mouseup', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('touchend', _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = AbstractZoomButton.prototype;

    _proto.destroy = function destroy() {
      this.__onMouseUp();

      this.psv.container.removeEventListener('mouseup', this);
      this.psv.container.removeEventListener('touchend', this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case 'mousedown':
          this.__onMouseDown();

          break;

        case 'mouseup':
          this.__onMouseUp();

          break;

        case 'touchend':
          this.__onMouseUp();

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     */
    ;

    _proto.isSupported = function isSupported() {
      return {
        initial: true,
        promise: SYSTEM.isTouchEnabled.then(function (enabled) {
          return !enabled;
        })
      };
    }
    /**
     * @override
     */
    ;

    _proto.onClick = function onClick() {// nothing
    }
    /**
     * @summary Handles click events
     * @description Zooms in and register long press timer
     * @private
     */
    ;

    _proto.__onMouseDown = function __onMouseDown() {
      var _this2 = this;

      if (!this.prop.enabled) {
        return;
      }

      this.prop.buttondown = true;
      this.prop.longPressTimeout = setTimeout(function () {
        return _this2.__startLongPressInterval();
      }, 100);
    }
    /**
     * @summary Continues zooming as long as the user presses the button
     * @private
     */
    ;

    _proto.__startLongPressInterval = function __startLongPressInterval() {
      var _this3 = this;

      if (!this.prop.buttondown) {
        return;
      }

      var end = this.prop.value < 0 ? 0 : 100;
      this.prop.longPressAnimation = new Animation({
        properties: {
          zoom: {
            start: this.psv.prop.zoomLvl,
            end: end
          }
        },
        duration: 1500 * Math.abs(this.psv.prop.zoomLvl - end) / 100,
        easing: 'linear',
        onTick: function onTick(properties) {
          _this3.psv.zoom(properties.zoom);
        }
      }).catch(function () {}); // ignore cancellation
    }
    /**
     * @summary Handles mouse up events
     * @private
     */
    ;

    _proto.__onMouseUp = function __onMouseUp() {
      if (!this.prop.enabled || !this.prop.buttondown) {
        return;
      }

      if (this.prop.longPressAnimation) {
        this.prop.longPressAnimation.cancel();
        this.prop.longPressAnimation = null;
      } else {
        this.psv.zoom(this.psv.prop.zoomLvl + this.prop.value * this.psv.config.zoomButtonIncrement);
      }

      if (this.prop.longPressTimeout) {
        clearTimeout(this.prop.longPressTimeout);
      }

      this.prop.buttondown = false;
    };

    return AbstractZoomButton;
  }(AbstractButton);

  var zoomIn = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\"><path fill=\"currentColor\" d=\"M14.043 12.22a7.738 7.738 0 1 0-1.823 1.822l4.985 4.985c.503.504 1.32.504 1.822 0a1.285 1.285 0 0 0 0-1.822l-4.984-4.985zm-6.305 1.043a5.527 5.527 0 1 1 0-11.053 5.527 5.527 0 0 1 0 11.053z\"/><path fill=\"currentColor\" d=\"M8.728 4.009H6.744v2.737H4.006V8.73h2.738v2.736h1.984V8.73h2.737V6.746H8.728z\"/><!--Created by Ryan Canning from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar zoom-in button class
   * @extends PSV.buttons.AbstractZoomButton
   * @memberof PSV.buttons
   */

  var ZoomInButton = /*#__PURE__*/function (_AbstractZoomButton) {
    _inheritsLoose(ZoomInButton, _AbstractZoomButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function ZoomInButton(navbar) {
      return _AbstractZoomButton.call(this, navbar, 1) || this;
    }

    return ZoomInButton;
  }(AbstractZoomButton);
  ZoomInButton.id = 'zoomIn';
  ZoomInButton.icon = zoomIn;

  var zoomOut = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 20 20\"><path fill=\"currentColor\" d=\"M14.043 12.22a7.738 7.738 0 1 0-1.823 1.822l4.985 4.985c.503.504 1.32.504 1.822 0a1.285 1.285 0 0 0 0-1.822l-4.984-4.985zm-6.305 1.043a5.527 5.527 0 1 1 0-11.053 5.527 5.527 0 0 1 0 11.053z\"/><path fill=\"currentColor\" d=\"M4.006 6.746h7.459V8.73H4.006z\"/><!--Created by Ryan Canning from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar zoom-out button class
   * @extends PSV.buttons.AbstractZoomButton
   * @memberof PSV.buttons
   */

  var ZoomOutButton = /*#__PURE__*/function (_AbstractZoomButton) {
    _inheritsLoose(ZoomOutButton, _AbstractZoomButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function ZoomOutButton(navbar) {
      return _AbstractZoomButton.call(this, navbar, -1) || this;
    }

    return ZoomOutButton;
  }(AbstractZoomButton);
  ZoomOutButton.id = 'zoomOut';
  ZoomOutButton.icon = zoomOut;

  /**
   * @summary Navigation bar zoom button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var ZoomRangeButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(ZoomRangeButton, _AbstractButton);

    /**
     * @param {PSV.components.Navbar} navbar
     */
    function ZoomRangeButton(navbar) {
      var _this;

      _this = _AbstractButton.call(this, navbar, 'psv-zoom-range') || this;
      /**
       * @override
       * @property {boolean} mousedown
       * @property {number} mediaMinWidth
       */

      _this.prop = _extends({}, _this.prop, {
        mousedown: false,
        mediaMinWidth: 0
      });
      /**
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.zoomRange = document.createElement('div');
      _this.zoomRange.className = 'psv-zoom-range-line';

      _this.container.appendChild(_this.zoomRange);
      /**
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.zoomValue = document.createElement('div');
      _this.zoomValue.className = 'psv-zoom-range-handle';

      _this.zoomRange.appendChild(_this.zoomValue);

      _this.prop.mediaMinWidth = parseInt(getStyle(_this.container, 'maxWidth'), 10);

      _this.container.addEventListener('mousedown', _assertThisInitialized(_this));

      _this.container.addEventListener('touchstart', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('mousemove', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('touchmove', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('mouseup', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('touchend', _assertThisInitialized(_this));

      _this.psv.on(EVENTS.ZOOM_UPDATED, _assertThisInitialized(_this));

      if (_this.psv.prop.ready) {
        _this.__moveZoomValue(_this.psv.prop.zoomLvl);
      } else {
        _this.psv.once(EVENTS.READY, _assertThisInitialized(_this));
      }

      _this.refreshUi();

      return _this;
    }
    /**
     * @override
     */


    var _proto = ZoomRangeButton.prototype;

    _proto.destroy = function destroy() {
      this.__stopZoomChange();

      this.psv.container.removeEventListener('mousemove', this);
      this.psv.container.removeEventListener('touchmove', this);
      this.psv.container.removeEventListener('mouseup', this);
      this.psv.container.removeEventListener('touchend', this);
      delete this.zoomRange;
      delete this.zoomValue;
      this.psv.off(EVENTS.ZOOM_UPDATED, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case 'mousedown':
          this.__initZoomChangeWithMouse(e);

          break;

        case 'touchstart':
          this.__initZoomChangeByTouch(e);

          break;

        case 'mousemove':
          this.__changeZoomWithMouse(e);

          break;

        case 'touchmove':
          this.__changeZoomByTouch(e);

          break;

        case 'mouseup':
          this.__stopZoomChange(e);

          break;

        case 'touchend':
          this.__stopZoomChange(e);

          break;

        case EVENTS.ZOOM_UPDATED:
          this.__moveZoomValue(e.args[0]);

          break;

        case EVENTS.READY:
          this.__moveZoomValue(this.psv.prop.zoomLvl);

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     */
    ;

    _proto.isSupported = function isSupported() {
      return {
        initial: true,
        promise: SYSTEM.isTouchEnabled.then(function (enabled) {
          return !enabled;
        })
      };
    }
    /**
     * @override
     */
    ;

    _proto.refreshUi = function refreshUi() {
      if (this.prop.supported) {
        if (this.psv.prop.size.width <= this.prop.mediaMinWidth && this.prop.visible) {
          this.hide();
        } else if (this.psv.prop.size.width > this.prop.mediaMinWidth && !this.prop.visible) {
          this.show();
        }
      }
    }
    /**
     * @override
     */
    ;

    _proto.onClick = function onClick() {// nothing
    }
    /**
     * @summary Moves the zoom cursor
     * @param {number} level
     * @private
     */
    ;

    _proto.__moveZoomValue = function __moveZoomValue(level) {
      this.zoomValue.style.left = level / 100 * this.zoomRange.offsetWidth - this.zoomValue.offsetWidth / 2 + 'px';
    }
    /**
     * @summary Handles mouse down events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__initZoomChangeWithMouse = function __initZoomChangeWithMouse(evt) {
      if (!this.prop.enabled) {
        return;
      }

      this.prop.mousedown = true;

      this.__changeZoom(evt.clientX);
    }
    /**
     * @summary Handles touch events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__initZoomChangeByTouch = function __initZoomChangeByTouch(evt) {
      if (!this.prop.enabled) {
        return;
      }

      this.prop.mousedown = true;

      this.__changeZoom(evt.changedTouches[0].clientX);
    }
    /**
     * @summary Handles mouse up events
     * @private
     */
    ;

    _proto.__stopZoomChange = function __stopZoomChange() {
      if (!this.prop.enabled) {
        return;
      }

      this.prop.mousedown = false;
      this.prop.buttondown = false;
    }
    /**
     * @summary Handles mouse move events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__changeZoomWithMouse = function __changeZoomWithMouse(evt) {
      if (!this.prop.enabled || !this.prop.mousedown) {
        return;
      }

      evt.preventDefault();

      this.__changeZoom(evt.clientX);
    }
    /**
     * @summary Handles touch move events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__changeZoomByTouch = function __changeZoomByTouch(evt) {
      if (!this.prop.enabled || !this.prop.mousedown) {
        return;
      }

      this.__changeZoom(evt.changedTouches[0].clientX);
    }
    /**
     * @summary Zoom change
     * @param {number} x - mouse/touch position
     * @private
     */
    ;

    _proto.__changeZoom = function __changeZoom(x) {
      var userInput = x - this.zoomRange.getBoundingClientRect().left;
      var zoomLevel = userInput / this.zoomRange.offsetWidth * 100;
      this.psv.zoom(zoomLevel);
    };

    return ZoomRangeButton;
  }(AbstractButton);
  ZoomRangeButton.id = 'zoomRange';

  /**
   * @summary Default options
   * @type {PSV.Options}
   * @memberOf PSV
   * @constant
   */

  var DEFAULTS = {
    panorama: null,
    container: null,
    caption: null,
    loadingImg: null,
    loadingTxt: 'Loading...',
    size: null,
    fisheye: false,
    minFov: 30,
    maxFov: 90,
    defaultZoomLvl: 50,
    defaultLong: 0,
    defaultLat: 0,
    sphereCorrection: null,
    sphereCorrectionReorder: false,
    moveSpeed: 1,
    zoomButtonIncrement: 2,
    autorotateDelay: null,
    autorotateSpeed: '2rpm',
    autorotateLat: null,
    moveInertia: true,
    mousewheel: true,
    mousewheelSpeed: 1,
    mousemove: true,
    captureCursor: false,
    mousewheelCtrlKey: false,
    touchmoveTwoFingers: false,
    useXmpData: true,
    panoData: null,
    canvasBackground: '#000',
    withCredentials: false,
    navbar: ['autorotate', 'zoomOut', 'zoomRange', 'zoomIn', 'download', 'caption', 'fullscreen'],
    lang: {
      autorotate: 'Automatic rotation',
      zoom: 'Zoom',
      zoomOut: 'Zoom out',
      zoomIn: 'Zoom in',
      download: 'Download',
      fullscreen: 'Fullscreen',
      menu: 'Menu',
      twoFingers: 'Use two fingers to navigate',
      ctrlZoom: 'Use ctrl + scroll to zoom the image',
      loadError: 'The panorama can\'t be loaded'
    },
    keyboard: {
      'ArrowUp': ACTIONS.ROTATE_LAT_UP,
      'ArrowDown': ACTIONS.ROTATE_LAT_DOWN,
      'ArrowRight': ACTIONS.ROTATE_LONG_RIGHT,
      'ArrowLeft': ACTIONS.ROTATE_LONG_LEFT,
      'PageUp': ACTIONS.ZOOM_IN,
      'PageDown': ACTIONS.ZOOM_OUT,
      '+': ACTIONS.ZOOM_IN,
      '-': ACTIONS.ZOOM_OUT,
      ' ': ACTIONS.TOGGLE_AUTOROTATE
    },
    plugins: []
  };
  /**
   * @summary List of unmodifiable options and their error messages
   * @private
   */

  var READONLY_OPTIONS = {
    panorama: 'Use setPanorama method to change the panorama',
    panoData: 'Use setPanorama method to change the panorama',
    container: 'Cannot change viewer container',
    plugins: 'Cannot change plugins'
  };
  /**
   * @summary Parsers/validators for each option
   * @private
   */

  var CONFIG_PARSERS = {
    container: function container(_container) {
      if (!_container) {
        throw new PSVError('No value given for container.');
      }

      return _container;
    },
    defaultLong: function defaultLong(_defaultLong) {
      // defaultLat is between 0 and PI
      return parseAngle(_defaultLong);
    },
    defaultLat: function defaultLat(_defaultLat) {
      // defaultLat is between -PI/2 and PI/2
      return parseAngle(_defaultLat, true);
    },
    minFov: function minFov(_minFov, config) {
      // minFov and maxFov must be ordered
      if (config.maxFov < _minFov) {
        logWarn('maxFov cannot be lower than minFov'); // eslint-disable-next-line no-param-reassign

        _minFov = config.maxFov;
      } // minFov between 1 and 179


      return bound(_minFov, 1, 179);
    },
    maxFov: function maxFov(_maxFov, config) {
      // minFov and maxFov must be ordered
      if (_maxFov < config.minFov) {
        // eslint-disable-next-line no-param-reassign
        _maxFov = config.minFov;
      } // maxFov between 1 and 179


      return bound(_maxFov, 1, 179);
    },
    lang: function lang(_lang) {
      if (Array.isArray(_lang.twoFingers)) {
        logWarn('lang.twoFingers must not be an array');
        _lang.twoFingers = _lang.twoFingers[0];
      }

      return _extends({}, DEFAULTS.lang, _lang);
    },
    keyboard: function keyboard(_keyboard) {
      // keyboard=true becomes the default map
      if (_keyboard === true) {
        return clone(DEFAULTS.keyboard);
      }

      return _keyboard;
    },
    autorotateLat: function autorotateLat(_autorotateLat, config) {
      // default autorotateLat is defaultLat
      if (_autorotateLat === null) {
        return parseAngle(config.defaultLat, true);
      } // autorotateLat is between -PI/2 and PI/2
      else {
          return parseAngle(_autorotateLat, true);
        }
    },
    autorotateSpeed: function autorotateSpeed(_autorotateSpeed) {
      return parseSpeed(_autorotateSpeed);
    },
    fisheye: function fisheye(_fisheye) {
      // translate boolean fisheye to amount
      if (_fisheye === true) {
        return 1;
      } else if (_fisheye === false) {
        return 0;
      }

      return _fisheye;
    },
    plugins: function plugins(_plugins) {
      return _plugins.map(function (plugin) {
        if (Array.isArray(plugin)) {
          return plugin;
        } else {
          return [plugin];
        }
      }).filter(function (plugin) {
        return !!plugin[0];
      });
    }
  };
  /**
   * @summary Merge user config with default config and performs validation
   * @param {PSV.Options} options
   * @returns {PSV.Options}
   * @memberOf PSV
   * @private
   */

  function getConfig(options) {
    var tempConfig = clone(DEFAULTS);
    deepmerge(tempConfig, options);
    var config = {};
    each(tempConfig, function (value, key) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
        throw new PSVError("Unknown option " + key);
      }

      if (CONFIG_PARSERS[key]) {
        config[key] = CONFIG_PARSERS[key](value, tempConfig);
      } else {
        config[key] = value;
      }
    });
    return config;
  }

  var info = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><path fill=\"currentColor\" d=\"M28.3 26.1c-1 2.6-1.9 4.8-2.6 7-2.5 7.4-5 14.7-7.2 22-1.3 4.4.5 7.2 4.3 7.8 1.3.2 2.8.2 4.2-.1 8.2-2 11.9-8.6 15.7-15.2l-2.2 2a18.8 18.8 0 0 1-7.4 5.2 2 2 0 0 1-1.6-.2c-.2-.1 0-1 0-1.4l.8-1.8L41.9 28c.5-1.4.9-3 .7-4.4-.2-2.6-3-4.4-6.3-4.4-8.8.2-15 4.5-19.5 11.8-.2.3-.2.6-.3 1.3 3.7-2.8 6.8-6.1 11.8-6.2z\"/><circle fill=\"currentColor\" cx=\"39.3\" cy=\"9.2\" r=\"8.2\"/><!--Created by Arafat Uddin from the Noun Project--></svg>\n";

  /**
   * @summary Navigation bar caption button class
   * @extends PSV.buttons.AbstractButton
   * @memberof PSV.buttons
   */

  var CaptionButton = /*#__PURE__*/function (_AbstractButton) {
    _inheritsLoose(CaptionButton, _AbstractButton);

    /**
     * @param {PSV.components.NavbarCaption} caption
     */
    function CaptionButton(caption) {
      var _this;

      _this = _AbstractButton.call(this, caption, 'psv-button--hover-scale psv-caption-button') || this;

      _this.psv.on(EVENTS.HIDE_NOTIFICATION, _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = CaptionButton.prototype;

    _proto.destroy = function destroy() {
      this.psv.off(EVENTS.HIDE_NOTIFICATION, this);

      _AbstractButton.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case EVENTS.HIDE_NOTIFICATION:
          this.toggleActive(false);
          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @description Toggles caption
     */
    ;

    _proto.onClick = function onClick() {
      if (this.psv.notification.prop.visible) {
        this.psv.notification.hide();
      } else {
        this.psv.notification.show(this.parent.prop.caption);
        this.toggleActive(true);
      }
    };

    return CaptionButton;
  }(AbstractButton);
  CaptionButton.id = 'caption';
  CaptionButton.icon = info;

  /**
   * @summary Navbar caption class
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var NavbarCaption = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(NavbarCaption, _AbstractComponent);

    /**
     * @param {PSV.components.Navbar} navbar
     * @param {string} caption
     */
    function NavbarCaption(navbar, caption) {
      var _this;

      _this = _AbstractComponent.call(this, navbar, 'psv-caption') || this;
      /**
       * @member {PSV.buttons.CaptionButton}
       * @readonly
       * @private
       */

      _this.button = new CaptionButton(_assertThisInitialized(_this));

      _this.button.hide();
      /**
       * @override
       * @property {string} id
       * @property {boolean} collapsable
       * @property {number} width
       * @property {string} caption
       * @property {boolean} contentVisible - if the content is visible in the navbar
       * @property {number} contentWidth - with of the caption content
       */


      _this.prop = _extends({}, _this.prop, {
        id: _this.constructor.id,
        collapsable: false,
        width: _this.button.prop.width,
        caption: '',
        contentVisible: true,
        contentWidth: 0
      });
      /**
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.content = document.createElement('div');
      _this.content.className = 'psv-caption-content';

      _this.container.appendChild(_this.content);

      _this.setCaption(caption);

      return _this;
    }
    /**
     * @override
     */


    var _proto = NavbarCaption.prototype;

    _proto.destroy = function destroy() {
      delete this.button;
      delete this.content;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Sets the bar caption
     * @param {string} html
     */
    ;

    _proto.setCaption = function setCaption(html) {
      this.prop.caption = html || '';
      this.content.innerHTML = this.prop.caption;

      if (html) {
        this.show(false);
        this.content.style.display = '';
        this.prop.contentWidth = this.content.offsetWidth;
        this.refreshUi();
      } else {
        this.hide();
      }
    }
    /**
     * @summary Toggles content and icon depending on available space
     * @private
     */
    ;

    _proto.refreshUi = function refreshUi() {
      var availableWidth = this.container.offsetWidth;

      if (availableWidth >= this.prop.contentWidth && !this.prop.contentVisible) {
        this.content.style.display = '';
        this.prop.contentVisible = true;
        this.button.hide(false);
      } else if (availableWidth < this.prop.contentWidth && this.prop.contentVisible) {
        this.content.style.display = 'none';
        this.prop.contentVisible = false;
        this.button.show(false);
      }
    };

    return NavbarCaption;
  }(AbstractComponent);
  NavbarCaption.id = 'caption';

  /**
   * @summary List of available buttons
   * @type {Object<string, Class<PSV.buttons.AbstractButton>>}
   * @private
   */

  var AVAILABLE_BUTTONS = {};
  /**
   * @summary Register a new button available for all viewers
   * @param {Class<PSV.buttons.AbstractButton>} button
   * @memberOf PSV
   */

  function registerButton(button) {
    if (!button.id) {
      throw new PSVError('Button ID is required');
    }

    AVAILABLE_BUTTONS[button.id] = button;
  }
  [AutorotateButton, ZoomInButton, ZoomRangeButton, ZoomOutButton, DownloadButton, FullscreenButton].forEach(registerButton);
  /**
   * @summary Navigation bar class
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var Navbar = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(Navbar, _AbstractComponent);

    /**
     * @param {PSV.Viewer} psv
     */
    function Navbar(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-navbar') || this;
      /**
       * @summary List of buttons of the navbar
       * @member {PSV.buttons.AbstractButton[]}
       * @override
       */

      _this.children = [];
      /**
       * @summary List of collapsed buttons
       * @member {PSV.buttons.AbstractButton[]}
       * @private
       */

      _this.collapsed = [];
      return _this;
    }
    /**
     * @summary Change the buttons visible on the navbar
     * @param {string|Array<string|PSV.NavbarCustomButton>} buttons
     */


    var _proto = Navbar.prototype;

    _proto.setButtons = function setButtons(buttons) {
      var _this2 = this;

      this.children.slice().forEach(function (item) {
        return item.destroy();
      });
      this.children.length = 0;
      /* eslint-disable no-new */

      this.__cleanButtons(buttons).forEach(function (button) {
        if (typeof button === 'object') {
          new CustomButton(_this2, button);
        } else if (AVAILABLE_BUTTONS[button]) {
          new AVAILABLE_BUTTONS[button](_this2);
        } else if (button === 'caption') {
          new NavbarCaption(_this2, _this2.psv.config.caption);
        } else if (button === 'zoom') {
          new ZoomOutButton(_this2);
          new ZoomRangeButton(_this2);
          new ZoomInButton(_this2);
        } else {
          throw new PSVError('Unknown button ' + button);
        }
      });

      new MenuButton(this);
      /* eslint-enable no-new */

      this.children.forEach(function (item) {
        if (typeof item.checkSupported === 'function') {
          item.checkSupported();
        }
      });
    }
    /**
     * @summary Sets the bar caption
     * @param {string} html
     */
    ;

    _proto.setCaption = function setCaption(html) {
      var caption = this.getButton('caption', false);

      if (!caption) {
        throw new PSVError('Cannot set caption, the navbar caption container is not initialized.');
      }

      caption.setCaption(html);
    }
    /**
     * @summary Returns a button by its identifier
     * @param {string} id
     * @param {boolean} [warnNotFound=true]
     * @returns {PSV.buttons.AbstractButton}
     */
    ;

    _proto.getButton = function getButton(id, warnNotFound) {
      if (warnNotFound === void 0) {
        warnNotFound = true;
      }

      var button = null;
      this.children.some(function (item) {
        if (item.prop.id === id) {
          button = item;
          return true;
        } else {
          return false;
        }
      });

      if (!button && warnNotFound) {
        logWarn("button \"" + id + "\" not found in the navbar");
      }

      return button;
    }
    /**
     * @summary Shows the navbar
     */
    ;

    _proto.show = function show() {
      this.container.classList.add('psv-navbar--open');
      this.prop.visible = true;
    }
    /**
     * @summary Hides the navbar
     */
    ;

    _proto.hide = function hide() {
      this.container.classList.remove('psv-navbar--open');
      this.prop.visible = false;
    }
    /**
     * @override
     */
    ;

    _proto.refreshUi = function refreshUi() {
      _AbstractComponent.prototype.refreshUi.call(this);

      if (this.psv.prop.uiRefresh === true) {
        var availableWidth = this.container.offsetWidth;
        var totalWidth = 0;
        var visibleButtons = [];
        var collapsableButtons = [];
        this.children.forEach(function (item) {
          if (item.prop.visible) {
            totalWidth += item.prop.width;
            visibleButtons.push(item);

            if (item.prop.collapsable) {
              collapsableButtons.push(item);
            }
          }
        });

        if (!visibleButtons.length) {
          return;
        }

        if (availableWidth < totalWidth && collapsableButtons.length > 0) {
          collapsableButtons.forEach(function (item) {
            return item.collapse();
          });
          this.collapsed = collapsableButtons;
          this.getButton(MenuButton.id).show(false);
        } else if (availableWidth >= totalWidth && this.collapsed.length > 0) {
          this.collapsed.forEach(function (item) {
            return item.uncollapse();
          });
          this.collapsed = [];
          this.getButton(MenuButton.id).hide(false);
        }

        var caption = this.getButton(NavbarCaption.id, false);

        if (caption) {
          caption.refreshUi();
        }
      }
    }
    /**
     * @summary Ensure the buttons configuration is correct
     * @private
     */
    ;

    _proto.__cleanButtons = function __cleanButtons(buttons) {
      // true becomes the default array
      if (buttons === true) {
        return clone(DEFAULTS.navbar);
      } // can be a space or coma separated list
      else if (typeof buttons === 'string') {
          return buttons.split(/[ ,]/);
        } else {
          return buttons || [];
        }
    };

    return Navbar;
  }(AbstractComponent);

  /**
   * @namespace PSV.plugins
   */

  /**
   * @summary Base plugins class
   * @memberof PSV.plugins
   * @abstract
   */

  var AbstractPlugin = /*#__PURE__*/function (_EventEmitter) {
    _inheritsLoose(AbstractPlugin, _EventEmitter);

    /**
     * @summary Unique identifier of the plugin
     * @member {string}
     * @readonly
     * @static
     */

    /**
     * @param {PSV.Viewer} psv
     */
    function AbstractPlugin(psv) {
      var _this;

      _this = _EventEmitter.call(this) || this;
      /**
       * @summary Reference to main controller
       * @type {PSV.Viewer}
       * @readonly
       */

      _this.psv = psv;
      return _this;
    }
    /**
     * @summary Destroys the plugin
     * @package
     */


    var _proto = AbstractPlugin.prototype;

    _proto.destroy = function destroy() {
      delete this.psv;
    };

    return AbstractPlugin;
  }(uevent.EventEmitter);
  AbstractPlugin.id = null;

  /**
   * @summary Loader class
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var Loader = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(Loader, _AbstractComponent);

    /**
     * @param {PSV.Viewer} psv
     */
    function Loader(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-loader-container') || this;
      /**
       * @summary Inner container for vertical center
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.loader = document.createElement('div');
      _this.loader.className = 'psv-loader';

      _this.container.appendChild(_this.loader);
      /**
       * @summary Animation canvas
       * @member {HTMLCanvasElement}
       * @readonly
       * @private
       */


      _this.canvas = document.createElement('canvas');
      _this.canvas.className = 'psv-loader-canvas';
      _this.canvas.width = _this.loader.clientWidth * SYSTEM.pixelRatio;
      _this.canvas.height = _this.loader.clientWidth * SYSTEM.pixelRatio;

      _this.loader.appendChild(_this.canvas);
      /**
       * @override
       * @property {number} thickness
       * @property {string} current
       */


      _this.prop = _extends({}, _this.prop, {
        tickness: (_this.loader.offsetWidth - _this.loader.clientWidth) / 2 * SYSTEM.pixelRatio,
        current: null
      });

      _this.refreshUi();

      _this.hide();

      return _this;
    }
    /**
     * @override
     */


    var _proto = Loader.prototype;

    _proto.destroy = function destroy() {
      delete this.loader;
      delete this.canvas;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @override
     */
    ;

    _proto.refreshUi = function refreshUi() {
      if (this.prop.current !== (this.psv.config.loadingImg || this.psv.config.loadingTxt)) {
        if (this.prop.current) {
          this.loader.removeChild(this.loader.lastChild);
        }

        var inner;

        if (this.psv.config.loadingImg) {
          inner = document.createElement('img');
          inner.className = 'psv-loader-image';
          inner.src = this.psv.config.loadingImg;
        } else if (this.psv.config.loadingTxt) {
          inner = document.createElement('div');
          inner.className = 'psv-loader-text';
          inner.innerHTML = this.psv.config.loadingTxt;
        }

        if (inner) {
          var size = Math.round(Math.sqrt(2 * Math.pow((this.canvas.width / 2 - this.prop.tickness / 2) / SYSTEM.pixelRatio, 2)));
          inner.style.maxWidth = size + 'px';
          inner.style.maxHeight = size + 'px';
          this.loader.appendChild(inner);
        }

        this.prop.current = this.psv.config.loadingImg || this.psv.config.loadingTxt;
      }
    }
    /**
     * @summary Sets the loader progression
     * @param {number} value - from 0 to 100
     */
    ;

    _proto.setProgress = function setProgress(value) {
      var context = this.canvas.getContext('2d');
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      context.lineWidth = this.prop.tickness;
      context.strokeStyle = getStyle(this.loader, 'color');
      context.beginPath();
      context.arc(this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2 - this.prop.tickness / 2, -Math.PI / 2, bound(value, 0, 100) / 100 * 2 * Math.PI - Math.PI / 2);
      context.stroke();
    };

    return Loader;
  }(AbstractComponent);

  /**
   * @summary Notification class
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var Notification = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(Notification, _AbstractComponent);

    /**
     * @param {PSV.Viewer} psv
     */
    function Notification(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-notification') || this;
      /**
       * @override
       * @property {*} timeout
       */

      _this.prop = _extends({}, _this.prop, {
        visible: false,
        timeout: null
      });
      /**
       * Notification content
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.content = document.createElement('div');
      _this.content.className = 'psv-notification-content';

      _this.container.appendChild(_this.content);

      _this.content.addEventListener('click', function () {
        return _this.hide();
      });

      return _this;
    }
    /**
     * @override
     */


    var _proto = Notification.prototype;

    _proto.destroy = function destroy() {
      delete this.content;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Displays a notification on the viewer
     * @param {Object|string} config
     * @param {string} config.content
     * @param {number} [config.timeout]
     * @fires PSV.show-notification
     *
     * @example
     * viewer.showNotification({ content: 'Hello world', timeout: 5000 })
     * @example
     * viewer.showNotification('Hello world')
     */
    ;

    _proto.show = function show(config) {
      var _this2 = this;

      if (this.prop.timeout) {
        clearTimeout(this.prop.timeout);
        this.prop.timeout = null;
      }

      if (typeof config === 'string') {
        config = {
          content: config
        }; // eslint-disable-line no-param-reassign
      }

      this.content.innerHTML = config.content;
      this.prop.visible = true;
      this.container.classList.add('psv-notification--visible');
      this.psv.trigger(EVENTS.SHOW_NOTIFICATION);

      if (config.timeout) {
        this.prop.timeout = setTimeout(function () {
          return _this2.hide();
        }, config.timeout);
      }
    }
    /**
     * @summary Hides the notification
     * @fires PSV.hide-notification
     */
    ;

    _proto.hide = function hide() {
      if (this.prop.visible) {
        this.container.classList.remove('psv-notification--visible');
        this.prop.visible = false;
        this.psv.trigger(EVENTS.HIDE_NOTIFICATION);
      }
    };

    return Notification;
  }(AbstractComponent);

  /**
   * @summary Overlay class
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var Overlay = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(Overlay, _AbstractComponent);

    /**
     * @param {PSV.Viewer} psv
     */
    function Overlay(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-overlay') || this;
      /**
       * @override
       * @property {string} contentId
       * @property {boolean} dissmisable
       */

      _this.prop = _extends({}, _this.prop, {
        contentId: undefined,
        dissmisable: true
      });
      /**
       * Image container
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.image = document.createElement('div');
      _this.image.className = 'psv-overlay-image';

      _this.container.appendChild(_this.image);
      /**
       * Text container
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.text = document.createElement('div');
      _this.text.className = 'psv-overlay-text';

      _this.container.appendChild(_this.text);
      /**
       * Subtext container
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.subtext = document.createElement('div');
      _this.subtext.className = 'psv-overlay-subtext';

      _this.container.appendChild(_this.subtext);

      _this.container.addEventListener('mouseup', function (e) {
        e.stopPropagation();

        if (_this.prop.dissmisable) {
          _this.hide();
        }
      }, true);

      _AbstractComponent.prototype.hide.call(_assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = Overlay.prototype;

    _proto.destroy = function destroy() {
      delete this.image;
      delete this.text;
      delete this.subtext;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @override
     * @param {string} [id]
     */
    ;

    _proto.isVisible = function isVisible(id) {
      return this.prop.visible && (!id || !this.prop.contentId || this.prop.contentId === id);
    }
    /**
     * @override
     */
    ;

    _proto.toggle = function toggle() {
      throw new PSVError('Overlay cannot be toggled');
    }
    /**
     * @summary Displays an overlay on the viewer
     * @param {Object|string} config
     * @param {string} [config.id] - unique identifier to use with "hide"
     * @param {string} config.image - SVG image/icon displayed above the text
     * @param {string} config.text - main message
     * @param {string} [config.subtext] - secondary message
     * @param {boolean} [config.dissmisable=true] - if the user can hide the overlay by clicking
     * @fires PSV.show-overlay
     */
    ;

    _proto.show = function show(config) {
      if (typeof config === 'string') {
        config = {
          text: config
        }; // eslint-disable-line no-param-reassign
      }

      this.prop.contentId = config.id;
      this.prop.dissmisable = config.dissmisable !== false;
      this.image.innerHTML = config.image || '';
      this.text.innerHTML = config.text || '';
      this.subtext.innerHTML = config.subtext || '';

      _AbstractComponent.prototype.show.call(this);

      this.psv.trigger(EVENTS.SHOW_OVERLAY, config.id);
    }
    /**
     * @summary Hides the overlay
     * @param {string} [id]
     * @fires PSV.hide-overlay
     */
    ;

    _proto.hide = function hide(id) {
      if (this.isVisible() && (!id || !this.prop.contentId || this.prop.contentId === id)) {
        var contentId = this.prop.contentId;

        _AbstractComponent.prototype.hide.call(this);

        this.prop.contentId = undefined;
        this.psv.trigger(EVENTS.HIDE_OVERLAY, contentId);
      }
    };

    return Overlay;
  }(AbstractComponent);

  /**
   * @summary Minimum width of the panel
   * @type {number}
   * @constant
   * @private
   */

  var PANEL_MIN_WIDTH = 200;
  /**
   * @summary Panel class
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var Panel = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(Panel, _AbstractComponent);

    /**
     * @param {PSV.Viewer} psv
     */
    function Panel(psv) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-panel') || this;
      /**
       * @override
       * @property {string} contentId
       * @property {number} mouseX
       * @property {number} mouseY
       * @property {boolean} mousedown
       * @property {function} clickHandler
       */

      _this.prop = _extends({}, _this.prop, {
        visible: false,
        contentId: undefined,
        mouseX: 0,
        mouseY: 0,
        mousedown: false,
        clickHandler: null,
        width: {}
      });
      var resizer = document.createElement('div');
      resizer.className = 'psv-panel-resizer';

      _this.container.appendChild(resizer);

      var closeBtn = document.createElement('div');
      closeBtn.className = 'psv-panel-close-button';

      _this.container.appendChild(closeBtn);
      /**
       * @summary Content container
       * @member {HTMLElement}
       * @readonly
       * @private
       */


      _this.content = document.createElement('div');
      _this.content.className = 'psv-panel-content';

      _this.container.appendChild(_this.content); // Stop wheel event bubling from panel


      _this.container.addEventListener(SYSTEM.mouseWheelEvent, function (e) {
        return e.stopPropagation();
      });

      closeBtn.addEventListener('click', function () {
        return _this.hide();
      }); // Event for panel resizing + stop bubling

      resizer.addEventListener('mousedown', _assertThisInitialized(_this));
      resizer.addEventListener('touchstart', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('mouseup', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('touchend', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('mousemove', _assertThisInitialized(_this));

      _this.psv.container.addEventListener('touchmove', _assertThisInitialized(_this));

      return _this;
    }
    /**
     * @override
     */


    var _proto = Panel.prototype;

    _proto.destroy = function destroy() {
      this.psv.container.removeEventListener('mousemove', this);
      this.psv.container.removeEventListener('touchmove', this);
      this.psv.container.removeEventListener('mouseup', this);
      this.psv.container.removeEventListener('touchend', this);
      delete this.prop;
      delete this.content;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case 'mousedown':
          this.__onMouseDown(e);

          break;

        case 'touchstart':
          this.__onTouchStart(e);

          break;

        case 'mousemove':
          this.__onMouseMove(e);

          break;

        case 'touchmove':
          this.__onTouchMove(e);

          break;

        case 'mouseup':
          this.__onMouseUp(e);

          break;

        case 'touchend':
          this.__onMouseUp(e);

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     * @param {string} [id]
     */
    ;

    _proto.isVisible = function isVisible(id) {
      return this.prop.visible && (!id || !this.prop.contentId || this.prop.contentId === id);
    }
    /**
     * @override
     */
    ;

    _proto.toggle = function toggle() {
      throw new PSVError('Panel cannot be toggled');
    }
    /**
     * @summary Shows the panel
     * @param {string|Object} config
     * @param {string} [config.id] - unique identifier to use with "hide" and to store the user desired width
     * @param {string} config.content - HTML content of the panel
     * @param {boolean} [config.noMargin=false] - remove the default margins
     * @param {string} [config.width] - initial width, if not specified the default width will be used
     * @param {Function} [config.clickHandler] - called when the user clicks inside the panel
     * @fires PSV.open-panel
     */
    ;

    _proto.show = function show(config) {
      if (typeof config === 'string') {
        config = {
          content: config
        }; // eslint-disable-line no-param-reassign
      }

      this.prop.contentId = config.id;
      this.prop.visible = true;

      if (this.prop.clickHandler) {
        this.content.removeEventListener('click', this.prop.clickHandler);
        this.prop.clickHandler = null;
      }

      if (config.id && this.prop.width[config.id]) {
        this.container.style.width = this.prop.width[config.id];
      } else if (config.width) {
        this.container.style.width = config.width;
      } else {
        this.container.style.width = null;
      }

      this.content.innerHTML = config.content;
      this.content.scrollTop = 0;
      this.container.classList.add('psv-panel--open');
      toggleClass(this.content, 'psv-panel-content--no-margin', config.noMargin === true);

      if (config.clickHandler) {
        this.prop.clickHandler = config.clickHandler;
        this.content.addEventListener('click', config.clickHandler);
      }

      this.psv.trigger(EVENTS.OPEN_PANEL, config.id);
    }
    /**
     * @summary Hides the panel
     * @param {string} [id]
     * @fires PSV.close-panel
     */
    ;

    _proto.hide = function hide(id) {
      if (this.isVisible(id)) {
        var contentId = this.prop.contentId;
        this.prop.visible = false;
        this.prop.contentId = undefined;
        this.content.innerHTML = null;
        this.container.classList.remove('psv-panel--open');

        if (this.prop.clickHandler) {
          this.content.removeEventListener('click', this.prop.clickHandler);
          this.prop.clickHandler = null;
        }

        this.psv.trigger(EVENTS.CLOSE_PANEL, contentId);
      }
    }
    /**
     * @summary Handles mouse down events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseDown = function __onMouseDown(evt) {
      evt.stopPropagation();

      this.__startResize(evt);
    }
    /**
     * @summary Handles touch events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchStart = function __onTouchStart(evt) {
      evt.stopPropagation();

      this.__startResize(evt.changedTouches[0]);
    }
    /**
     * @summary Handles mouse up events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseUp = function __onMouseUp(evt) {
      if (this.prop.mousedown) {
        evt.stopPropagation();
        this.prop.mousedown = false;
        this.content.classList.remove('psv-panel-content--no-interaction');
      }
    }
    /**
     * @summary Handles mouse move events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseMove = function __onMouseMove(evt) {
      if (this.prop.mousedown) {
        evt.stopPropagation();

        this.__resize(evt);
      }
    }
    /**
     * @summary Handles touch move events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchMove = function __onTouchMove(evt) {
      if (this.prop.mousedown) {
        this.__resize(evt.touches[0]);
      }
    }
    /**
     * @summary Initializes the panel resize
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__startResize = function __startResize(evt) {
      this.prop.mouseX = evt.clientX;
      this.prop.mouseY = evt.clientY;
      this.prop.mousedown = true;
      this.content.classList.add('psv-panel-content--no-interaction');
    }
    /**
     * @summary Resizes the panel
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__resize = function __resize(evt) {
      var x = evt.clientX;
      var y = evt.clientY;
      var width = Math.max(PANEL_MIN_WIDTH, this.container.offsetWidth - (x - this.prop.mouseX)) + 'px';

      if (this.prop.contentId) {
        this.prop.width[this.prop.contentId] = width;
      }

      this.container.style.width = width;
      this.prop.mouseX = x;
      this.prop.mouseY = y;
    };

    return Panel;
  }(AbstractComponent);

  var errorIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"15 15 70 70\"><path fill=\"currentColor\" d=\"M50,16.2c-18.6,0-33.8,15.1-33.8,33.8S31.4,83.7,50,83.7S83.8,68.6,83.8,50S68.6,16.2,50,16.2z M50,80.2c-16.7,0-30.2-13.6-30.2-30.2S33.3,19.7,50,19.7S80.3,33.3,80.3,50S66.7,80.2,50,80.2z\"/><rect fill=\"currentColor\" x=\"48\" y=\"31.7\" width=\"4\" height=\"28\"/><rect fill=\"currentColor\" x=\"48\" y=\"63.2\" width=\"4\" height=\"5\"/><!--Created by Shastry from the Noun Project--></svg>\n";

  /**
   * @namespace PSV.services
   */

  /**
   * @summary Base services class
   * @memberof PSV.services
   * @abstract
   */
  var AbstractService = /*#__PURE__*/function () {
    /**
     * @param {PSV.Viewer} psv
     */
    function AbstractService(psv) {
      /**
       * @summary Reference to main controller
       * @type {PSV.Viewer}
       * @readonly
       */
      this.psv = psv;
      /**
       * @summary Configuration holder
       * @type {PSV.Options}
       * @readonly
       */

      this.config = psv.config;
      /**
       * @summary Properties holder
       * @type {Object}
       * @readonly
       */

      this.prop = psv.prop;
    }
    /**
     * @summary Destroys the service
     */


    var _proto = AbstractService.prototype;

    _proto.destroy = function destroy() {
      delete this.psv;
      delete this.config;
      delete this.prop;
    };

    return AbstractService;
  }();

  /**
   * @summary Collections of data converters for the current viewer
   * @extends PSV.services.AbstractService
   * @memberof PSV.services
   */

  var DataHelper = /*#__PURE__*/function (_AbstractService) {
    _inheritsLoose(DataHelper, _AbstractService);

    /**
     * @param {PSV.Viewer} psv
     */
    function DataHelper(psv) {
      return _AbstractService.call(this, psv) || this;
    }
    /**
     * @summary Converts vertical FOV to zoom level
     * @param {number} fov
     * @returns {number}
     */


    var _proto = DataHelper.prototype;

    _proto.fovToZoomLevel = function fovToZoomLevel(fov) {
      var temp = Math.round((fov - this.config.minFov) / (this.config.maxFov - this.config.minFov) * 100);
      return temp - 2 * (temp - 50);
    }
    /**
     * @summary Converts zoom level to vertical FOV
     * @param {number} level
     * @returns {number}
     */
    ;

    _proto.zoomLevelToFov = function zoomLevelToFov(level) {
      return this.config.maxFov + level / 100 * (this.config.minFov - this.config.maxFov);
    }
    /**
     * @summary Convert vertical FOV to horizontal FOV
     * @param {number} vFov
     * @returns {number}
     */
    ;

    _proto.vFovToHFov = function vFovToHFov(vFov) {
      return THREE.Math.radToDeg(2 * Math.atan(Math.tan(THREE.Math.degToRad(vFov) / 2) * this.prop.aspect));
    }
    /**
     * @summary Converts a speed into a duration from current position to a new position
     * @param {string|number} value
     * @param {number} angle
     * @returns {number}
     */
    ;

    _proto.speedToDuration = function speedToDuration(value, angle) {
      if (!value || typeof value !== 'number') {
        // desired radial speed
        var speed = value ? parseSpeed(value) : this.config.autorotateSpeed; // compute duration

        return angle / Math.abs(speed) * 1000;
      } else {
        return Math.abs(value);
      }
    }
    /**
     * @summary Converts pixel texture coordinates to spherical radians coordinates
     * @param {PSV.Point} point
     * @returns {PSV.Position}
     */
    ;

    _proto.textureCoordsToSphericalCoords = function textureCoordsToSphericalCoords(point) {
      if (this.prop.isCubemap) {
        throw new PSVError('Unable to use texture coords with cubemap.');
      }

      var panoData = this.prop.panoData;
      var relativeX = (point.x + panoData.croppedX) / panoData.fullWidth * Math.PI * 2;
      var relativeY = (point.y + panoData.croppedY) / panoData.fullHeight * Math.PI;
      return {
        longitude: relativeX >= Math.PI ? relativeX - Math.PI : relativeX + Math.PI,
        latitude: Math.PI / 2 - relativeY
      };
    }
    /**
     * @summary Converts spherical radians coordinates to pixel texture coordinates
     * @param {PSV.Position} position
     * @returns {PSV.Point}
     */
    ;

    _proto.sphericalCoordsToTextureCoords = function sphericalCoordsToTextureCoords(position) {
      if (this.prop.isCubemap) {
        throw new PSVError('Unable to use texture coords with cubemap.');
      }

      var panoData = this.prop.panoData;
      var relativeLong = position.longitude / Math.PI / 2 * panoData.fullWidth;
      var relativeLat = position.latitude / Math.PI * panoData.fullHeight;
      return {
        x: Math.round(position.longitude < Math.PI ? relativeLong + panoData.fullWidth / 2 : relativeLong - panoData.fullWidth / 2) - panoData.croppedX,
        y: Math.round(panoData.fullHeight / 2 - relativeLat) - panoData.croppedY
      };
    }
    /**
     * @summary Converts spherical radians coordinates to a THREE.Vector3
     * @param {PSV.Position} position
     * @returns {external:THREE.Vector3}
     */
    ;

    _proto.sphericalCoordsToVector3 = function sphericalCoordsToVector3(position) {
      return new THREE.Vector3(SPHERE_RADIUS * -Math.cos(position.latitude) * Math.sin(position.longitude), SPHERE_RADIUS * Math.sin(position.latitude), SPHERE_RADIUS * Math.cos(position.latitude) * Math.cos(position.longitude));
    }
    /**
     * @summary Converts a THREE.Vector3 to spherical radians coordinates
     * @param {external:THREE.Vector3} vector
     * @returns {PSV.Position}
     */
    ;

    _proto.vector3ToSphericalCoords = function vector3ToSphericalCoords(vector) {
      var phi = Math.acos(vector.y / Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z));
      var theta = Math.atan2(vector.x, vector.z);
      return {
        longitude: theta < 0 ? -theta : Math.PI * 2 - theta,
        latitude: Math.PI / 2 - phi
      };
    }
    /**
     * @summary Converts position on the viewer to a THREE.Vector3
     * @param {PSV.Point} viewerPoint
     * @returns {external:THREE.Vector3}
     */
    ;

    _proto.viewerCoordsToVector3 = function viewerCoordsToVector3(viewerPoint) {
      var screen = new THREE.Vector2(2 * viewerPoint.x / this.prop.size.width - 1, -2 * viewerPoint.y / this.prop.size.height + 1);
      this.psv.renderer.raycaster.setFromCamera(screen, this.psv.renderer.camera);
      var intersects = this.psv.renderer.raycaster.intersectObjects(this.psv.renderer.scene.children, true);

      if (intersects.length === 1) {
        return intersects[0].point;
      } else {
        return null;
      }
    }
    /**
     * @summary Converts a THREE.Vector3 to position on the viewer
     * @param {external:THREE.Vector3} vector
     * @returns {PSV.Point}
     */
    ;

    _proto.vector3ToViewerCoords = function vector3ToViewerCoords(vector) {
      var vectorClone = vector.clone();
      vectorClone.project(this.psv.renderer.camera);
      return {
        x: Math.round((vectorClone.x + 1) / 2 * this.prop.size.width),
        y: Math.round((1 - vectorClone.y) / 2 * this.prop.size.height)
      };
    }
    /**
     * @summary Converts x/y to latitude/longitude if present and ensure boundaries
     * @param {PSV.ExtendedPosition} position
     * @returns {PSV.Position}
     */
    ;

    _proto.cleanPosition = function cleanPosition(position) {
      if ('x' in position && 'y' in position) {
        return this.textureCoordsToSphericalCoords(position);
      } else {
        return {
          longitude: parseAngle(position.longitude),
          latitude: parseAngle(position.latitude, true)
        };
      }
    }
    /**
     * @summary Ensure a SphereCorrection object is valid
     * @param {PSV.SphereCorrection} sphereCorrection
     * @returns {PSV.SphereCorrection}
     */
    ;

    _proto.cleanSphereCorrection = function cleanSphereCorrection(sphereCorrection) {
      return {
        pan: parseAngle(sphereCorrection.pan || 0),
        tilt: parseAngle(sphereCorrection.tilt || 0, true),
        roll: parseAngle(sphereCorrection.roll || 0, true, false)
      };
    };

    return DataHelper;
  }(AbstractService);

  var gestureIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><path fill=\"currentColor\" d=\"M33.38 33.2a1.96 1.96 0 0 0 1.5-3.23 10.61 10.61 0 0 1 7.18-17.51c.7-.06 1.31-.49 1.61-1.12a13.02 13.02 0 0 1 11.74-7.43c7.14 0 12.96 5.8 12.96 12.9 0 3.07-1.1 6.05-3.1 8.38-.7.82-.61 2.05.21 2.76.83.7 2.07.6 2.78-.22a16.77 16.77 0 0 0 4.04-10.91C72.3 7.54 64.72 0 55.4 0a16.98 16.98 0 0 0-14.79 8.7 14.6 14.6 0 0 0-12.23 14.36c0 3.46 1.25 6.82 3.5 9.45.4.45.94.69 1.5.69m45.74 43.55a22.13 22.13 0 0 1-5.23 12.4c-4 4.55-9.53 6.86-16.42 6.86-12.6 0-20.1-10.8-20.17-10.91a1.82 1.82 0 0 0-.08-.1c-5.3-6.83-14.55-23.82-17.27-28.87-.05-.1 0-.21.02-.23a6.3 6.3 0 0 1 8.24 1.85l9.38 12.59a1.97 1.97 0 0 0 3.54-1.17V25.34a4 4 0 0 1 1.19-2.87 3.32 3.32 0 0 1 2.4-.95c1.88.05 3.4 1.82 3.4 3.94v24.32a1.96 1.96 0 0 0 3.93 0v-33.1a3.5 3.5 0 0 1 7 0v35.39a1.96 1.96 0 0 0 3.93 0v-.44c.05-2.05 1.6-3.7 3.49-3.7 1.93 0 3.5 1.7 3.5 3.82v5.63c0 .24.04.48.13.71l.1.26a1.97 1.97 0 0 0 3.76-.37c.33-1.78 1.77-3.07 3.43-3.07 1.9 0 3.45 1.67 3.5 3.74l-1.77 18.1zM77.39 51c-1.25 0-2.45.32-3.5.9v-.15c0-4.27-3.33-7.74-7.42-7.74-1.26 0-2.45.33-3.5.9V16.69a7.42 7.42 0 0 0-14.85 0v1.86a7 7 0 0 0-3.28-.94 7.21 7.21 0 0 0-5.26 2.07 7.92 7.92 0 0 0-2.38 5.67v37.9l-5.83-7.82a10.2 10.2 0 0 0-13.35-2.92 4.1 4.1 0 0 0-1.53 5.48C20 64.52 28.74 80.45 34.07 87.34c.72 1.04 9.02 12.59 23.4 12.59 7.96 0 14.66-2.84 19.38-8.2a26.06 26.06 0 0 0 6.18-14.6l1.78-18.2v-.2c0-4.26-3.32-7.73-7.42-7.73z\"/><!--Created by AomAm from the Noun Project--></svg>\n";

  var mousewheelIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"10 17 79 79\"><path fill=\"currentColor\" d=\"M38.1 29.27c-.24 0-.44.2-.44.45v10.7a.45.45 0 00.9 0v-10.7c0-.25-.2-.45-.45-.45zm10.2 26.66a11.54 11.54 0 01-8.48-6.14.45.45 0 10-.8.41 12.45 12.45 0 009.22 6.62.45.45 0 00.07-.9zm24.55-13.08a23.04 23.04 0 00-22.56-23v7.07l-.01.05a2.83 2.83 0 012.39 2.78v14.03l.09-.02h8.84v-9.22a.45.45 0 11.9 0v9.22h10.35v-.9zm0 27.33V44.66H62.5c-.02 2.01-.52 4-1.47 5.76a.45.45 0 01-.61.18.45.45 0 01-.19-.61 11.54 11.54 0 001.36-5.33h-8.83l-.1-.01a2.83 2.83 0 01-2.83 2.84h-.04-.04a2.83 2.83 0 01-2.83-2.83v-14.9a2.82 2.82 0 012.47-2.8v-7.11a23.04 23.04 0 00-22.57 23v.91h14.72V29.88a8.2 8.2 0 015.02-7.57c.22-.1.5.01.59.24.1.23-.01.5-.24.6a7.3 7.3 0 00-4.47 6.73v13.88h3.9a.45.45 0 110 .9h-3.9v.15a7.32 7.32 0 0011.23 6.17.45.45 0 01.49.76 8.22 8.22 0 01-12.62-6.93v-.15H26.82v25.52a23.04 23.04 0 0023.01 23.01 23.04 23.04 0 0023.02-23.01zm1.8-27.33v27.33A24.85 24.85 0 0149.84 95a24.85 24.85 0 01-24.82-24.82V42.85a24.85 24.85 0 0124.82-24.82 24.85 24.85 0 0124.83 24.82zM57.98 29.88v9.36a.45.45 0 11-.9 0v-9.36a7.28 7.28 0 00-3.4-6.17.45.45 0 01.49-.76 8.18 8.18 0 013.8 6.93z\"/><!-- Created by Icon Island from the Noun Project --></svg>\n";

  /**
   * @summary Events handler
   * @extends PSV.services.AbstractService
   * @memberof PSV.services
   */

  var EventsHandler = /*#__PURE__*/function (_AbstractService) {
    _inheritsLoose(EventsHandler, _AbstractService);

    /**
     * @param {PSV.Viewer} psv
     */
    function EventsHandler(psv) {
      var _this;

      _this = _AbstractService.call(this, psv) || this;
      /**
       * @summary Internal properties
       * @member {Object}
       * @property {boolean} moving - is the user moving
       * @property {boolean} zooming - is the user zooming
       * @property {number} startMouseX - start x position of the click/touch
       * @property {number} startMouseY - start y position of the click/touch
       * @property {number} mouseX - current x position of the cursor
       * @property {number} mouseY - current y position of the cursor
       * @property {number[][]} mouseHistory - list of latest positions of the cursor, [time, x, y]
       * @property {number} pinchDist - distance between fingers when zooming
       * @property {boolean} ctrlKeyDown - when the Ctrl key is pressed
       * @property {PSV.ClickData} dblclickData - temporary storage of click data between two clicks
       * @property {number} dblclickTimeout - timeout id for double click
       * @property {number} twofingersTimeout - timeout id for "two fingers" overlay
       * @property {number} ctrlZoomTimeout - timeout id for "ctrol zoom" overlay
       * @protected
       */

      _this.state = {
        keyboardEnabled: false,
        moving: false,
        zooming: false,
        startMouseX: 0,
        startMouseY: 0,
        mouseX: 0,
        mouseY: 0,
        mouseHistory: [],
        pinchDist: 0,
        ctrlKeyDown: false,
        dblclickData: null,
        dblclickTimeout: null,
        longtouchTimeout: null,
        twofingersTimeout: null,
        ctrlZoomTimeout: null
      };
      /**
       * @summary Throttled wrapper of {@link PSV.Viewer#autoSize}
       * @type {Function}
       * @private
       */

      _this.__onResize = throttle(function () {
        return _this.psv.autoSize();
      }, 50);
      return _this;
    }
    /**
     * @summary Initializes event handlers
     * @protected
     */


    var _proto = EventsHandler.prototype;

    _proto.init = function init() {
      window.addEventListener('resize', this);
      window.addEventListener('keydown', this);
      window.addEventListener('keyup', this);
      this.psv.container.addEventListener('mouseenter', this);
      this.psv.container.addEventListener('mousedown', this);
      this.psv.container.addEventListener('mouseleave', this);
      window.addEventListener('mouseup', this);
      this.psv.container.addEventListener('touchstart', this);
      window.addEventListener('touchend', this);
      this.psv.container.addEventListener('mousemove', this);
      this.psv.container.addEventListener('touchmove', this);
      this.psv.container.addEventListener(SYSTEM.mouseWheelEvent, this);

      if (SYSTEM.fullscreenEvent) {
        document.addEventListener(SYSTEM.fullscreenEvent, this);
      }
    }
    /**
     * @override
     */
    ;

    _proto.destroy = function destroy() {
      window.removeEventListener('resize', this);
      window.removeEventListener('keydown', this);
      window.removeEventListener('keyup', this);
      this.psv.container.removeEventListener('mouseenter', this);
      this.psv.container.removeEventListener('mousedown', this);
      this.psv.container.removeEventListener('mouseleave', this);
      window.removeEventListener('mouseup', this);
      this.psv.container.removeEventListener('touchstart', this);
      window.removeEventListener('touchend', this);
      this.psv.container.removeEventListener('mousemove', this);
      this.psv.container.removeEventListener('touchmove', this);
      this.psv.container.removeEventListener(SYSTEM.mouseWheelEvent, this);

      if (SYSTEM.fullscreenEvent) {
        document.removeEventListener(SYSTEM.fullscreenEvent, this);
      }

      clearTimeout(this.state.dblclickTimeout);
      clearTimeout(this.state.longtouchTimeout);
      clearTimeout(this.state.twofingersTimeout);
      clearTimeout(this.state.ctrlZoomTimeout);
      delete this.state;

      _AbstractService.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} evt
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(evt) {
      /* eslint-disable */
      switch (evt.type) {
        // @formatter:off
        case 'resize':
          this.__onResize();

          break;

        case 'keydown':
          this.__onKeyDown(evt);

          break;

        case 'keyup':
          this.__onKeyUp();

          break;

        case 'mouseup':
          this.__onMouseUp(evt);

          break;

        case 'touchend':
          this.__onTouchEnd(evt);

          break;

        case SYSTEM.fullscreenEvent:
          this.__fullscreenToggled();

          break;
        // @formatter:on
      }
      /* eslint-enable */


      if (!getClosest(evt.target, '.psv-navbar') && !getClosest(evt.target, '.psv-panel')) {
        /* eslint-disable */
        switch (evt.type) {
          // @formatter:off
          case 'mousedown':
            this.__onMouseDown(evt);

            break;

          case 'mouseenter':
            this.__onMouseEnter(evt);

            break;

          case 'touchstart':
            this.__onTouchStart(evt);

            break;

          case 'mouseleave':
            this.__onMouseLeave(evt);

            break;

          case 'mousemove':
            this.__onMouseMove(evt);

            break;

          case 'touchmove':
            this.__onTouchMove(evt);

            break;

          case SYSTEM.mouseWheelEvent:
            this.__onMouseWheel(evt);

            break;
          // @formatter:on
        }
        /* eslint-enable */

      }
    }
    /**
     * @summary Enables the keyboard controls
     * @protected
     */
    ;

    _proto.enableKeyboard = function enableKeyboard() {
      this.state.keyboardEnabled = true;
    }
    /**
     * @summary Disables the keyboard controls
     * @protected
     */
    ;

    _proto.disableKeyboard = function disableKeyboard() {
      this.state.keyboardEnabled = false;
    }
    /**
     * @summary Handles keyboard events
     * @param {KeyboardEvent} evt
     * @private
     */
    ;

    _proto.__onKeyDown = function __onKeyDown(evt) {
      var key = getEventKey(evt);

      if (this.config.mousewheelCtrlKey) {
        this.state.ctrlKeyDown = key === 'Control';

        if (this.state.ctrlKeyDown) {
          clearTimeout(this.state.ctrlZoomTimeout);
          this.psv.overlay.hide(IDS.CTRL_ZOOM);
        }
      }

      if (!this.state.keyboardEnabled) {
        return;
      }

      var dLong = 0;
      var dLat = 0;
      var dZoom = 0;
      /* eslint-disable */

      switch (this.config.keyboard[key]) {
        // @formatter:off
        case ACTIONS.ROTATE_LAT_UP:
          dLat = 0.01;
          break;

        case ACTIONS.ROTATE_LAT_DOWN:
          dLat = -0.01;
          break;

        case ACTIONS.ROTATE_LONG_RIGHT:
          dLong = 0.01;
          break;

        case ACTIONS.ROTATE_LONG_LEFT:
          dLong = -0.01;
          break;

        case ACTIONS.ZOOM_IN:
          dZoom = 1;
          break;

        case ACTIONS.ZOOM_OUT:
          dZoom = -1;
          break;

        case ACTIONS.TOGGLE_AUTOROTATE:
          this.psv.toggleAutorotate();
          break;
        // @formatter:on
      }
      /* eslint-enable */


      if (dZoom !== 0) {
        this.psv.zoom(this.prop.zoomLvl + dZoom * this.config.zoomButtonIncrement);
      } else if (dLat !== 0 || dLong !== 0) {
        this.psv.rotate({
          longitude: this.prop.position.longitude + dLong * this.prop.moveSpeed * this.prop.hFov,
          latitude: this.prop.position.latitude + dLat * this.prop.moveSpeed * this.prop.vFov
        });
      }
    }
    /**
     * @summary Handles keyboard events
     * @private
     */
    ;

    _proto.__onKeyUp = function __onKeyUp() {
      this.state.ctrlKeyDown = false;
    }
    /**
     * @summary Handles mouse down events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseDown = function __onMouseDown(evt) {
      if (!this.config.mousemove || this.config.captureCursor) {
        return;
      }

      this.__startMove(evt);
    }
    /**
     * @summary Handles mouse enter events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseEnter = function __onMouseEnter(evt) {
      if (!this.config.mousemove || !this.config.captureCursor) {
        return;
      }

      this.__startMove(evt);
    }
    /**
     * @summary Handles mouse up events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseUp = function __onMouseUp(evt) {
      if (!this.config.mousemove || this.config.captureCursor) {
        return;
      }

      this.__stopMove(evt);
    }
    /**
     * @summary Handles mouse leave events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseLeave = function __onMouseLeave(evt) {
      if (!this.config.mousemove || !this.config.captureCursor) {
        return;
      }

      this.__stopMove(evt);
    }
    /**
     * @summary Handles mouse move events
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__onMouseMove = function __onMouseMove(evt) {
      if (!this.config.mousemove) {
        return;
      }

      if (evt.buttons !== 0) {
        evt.preventDefault();

        this.__move(evt);
      } else if (this.config.captureCursor) {
        this.__moveAbsolute(evt);
      }
    }
    /**
     * @summary Handles touch events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchStart = function __onTouchStart(evt) {
      var _this2 = this;

      if (!this.config.mousemove) {
        return;
      }

      if (evt.touches.length === 1) {
        if (!this.config.touchmoveTwoFingers) {
          this.__startMove(evt.touches[0]);

          evt.preventDefault(); // prevent mouse events emulation
        }

        if (!this.prop.longtouchTimeout) {
          this.prop.longtouchTimeout = setTimeout(function () {
            _this2.__click(evt.touches[0], true);

            _this2.prop.longtouchTimeout = null;
          }, LONGTOUCH_DELAY);
        }
      } else if (evt.touches.length === 2) {
        this.__cancelLongTouch();

        this.__startMoveZoom(evt);

        evt.preventDefault();
      }
    }
    /**
     * @summary Handles touch events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchEnd = function __onTouchEnd(evt) {
      if (!this.config.mousemove) {
        return;
      }

      this.__cancelLongTouch();

      if (evt.touches.length === 1) {
        this.__stopMoveZoom();
      } else if (evt.touches.length === 0) {
        this.__stopMove(evt.changedTouches[0]);
      }

      if (this.config.touchmoveTwoFingers) {
        this.__cancelTwoFingersOverlay();

        this.psv.overlay.hide(IDS.TWO_FINGERS);
      }
    }
    /**
     * @summary Handles touch move events
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__onTouchMove = function __onTouchMove(evt) {
      var _this3 = this;

      if (!this.config.mousemove) {
        return;
      }

      if (evt.touches.length === 1) {
        if (this.config.touchmoveTwoFingers) {
          if (!this.prop.twofingersTimeout) {
            this.prop.twofingersTimeout = setTimeout(function () {
              _this3.psv.overlay.show({
                id: IDS.TWO_FINGERS,
                image: gestureIcon,
                text: _this3.config.lang.twoFingers
              });
            }, TWOFINGERSOVERLAY_DELAY);
          }
        } else {
          evt.preventDefault();

          this.__move(evt.touches[0]);
        }
      } else if (evt.touches.length === 2) {
        evt.preventDefault();

        this.__moveZoom(evt);

        if (this.config.touchmoveTwoFingers) {
          this.__cancelTwoFingersOverlay();
        }
      }
    }
    /**
     * @summary Cancel the long touch timer if any
     * @private
     */
    ;

    _proto.__cancelLongTouch = function __cancelLongTouch() {
      if (this.prop.longtouchTimeout) {
        clearTimeout(this.prop.longtouchTimeout);
        this.prop.longtouchTimeout = null;
      }
    }
    /**
     * @summary Cancel the two fingers overlay timer if any
     * @private
     */
    ;

    _proto.__cancelTwoFingersOverlay = function __cancelTwoFingersOverlay() {
      if (this.prop.twofingersTimeout) {
        clearTimeout(this.prop.twofingersTimeout);
        this.prop.twofingersTimeout = null;
      }
    }
    /**
     * @summary Handles mouse wheel events
     * @param {WheelEvent} evt
     * @private
     */
    ;

    _proto.__onMouseWheel = function __onMouseWheel(evt) {
      var _this4 = this;

      if (!this.config.mousewheel) {
        return;
      }

      if (this.config.mousewheelCtrlKey && !this.state.ctrlKeyDown) {
        this.psv.overlay.show({
          id: IDS.CTRL_ZOOM,
          image: mousewheelIcon,
          text: this.config.lang.ctrlZoom
        });
        clearTimeout(this.state.ctrlZoomTimeout);
        this.state.ctrlZoomTimeout = setTimeout(function () {
          return _this4.psv.overlay.hide(IDS.CTRL_ZOOM);
        }, CTRLZOOM_TIMEOUT);
        return;
      }

      evt.preventDefault();
      evt.stopPropagation();
      var delta = normalizeWheel(evt).spinY * 5;

      if (delta !== 0) {
        this.psv.zoom(this.prop.zoomLvl - delta * this.config.mousewheelSpeed);
      }
    }
    /**
     * @summary Handles fullscreen events
     * @param {boolean} [force] force state
     * @fires PSV.fullscreen-updated
     * @package
     */
    ;

    _proto.__fullscreenToggled = function __fullscreenToggled(force) {
      this.prop.fullscreen = force !== undefined ? force : isFullscreenEnabled(this.psv.container);

      if (this.config.keyboard) {
        if (this.prop.fullscreen) {
          this.psv.startKeyboardControl();
        } else {
          this.psv.stopKeyboardControl();
        }
      }

      this.psv.trigger(EVENTS.FULLSCREEN_UPDATED, this.prop.fullscreen);
    }
    /**
     * @summary Initializes the movement
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__startMove = function __startMove(evt) {
      var _this5 = this;

      this.psv.stopAutorotate();
      this.psv.stopAnimation().then(function () {
        _this5.state.mouseX = evt.clientX;
        _this5.state.mouseY = evt.clientY;
        _this5.state.startMouseX = _this5.state.mouseX;
        _this5.state.startMouseY = _this5.state.mouseY;
        _this5.state.moving = true;
        _this5.state.zooming = false;
        _this5.state.mouseHistory.length = 0;

        _this5.__logMouseMove(evt);
      });
    }
    /**
     * @summary Initializes the combines move and zoom
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__startMoveZoom = function __startMoveZoom(evt) {
      var p1 = {
        x: evt.touches[0].clientX,
        y: evt.touches[0].clientY
      };
      var p2 = {
        x: evt.touches[1].clientX,
        y: evt.touches[1].clientY
      };
      this.state.pinchDist = distance(p1, p2);
      this.state.mouseX = (p1.x + p2.x) / 2;
      this.state.mouseY = (p1.y + p2.y) / 2;
      this.state.startMouseX = this.state.mouseX;
      this.state.startMouseY = this.state.mouseY;
      this.state.moving = true;
      this.state.zooming = true;
    }
    /**
     * @summary Stops the movement
     * @description If the move threshold was not reached a click event is triggered, otherwise an animation is launched to simulate inertia
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__stopMove = function __stopMove(evt) {
      if (!getClosest(evt.target, '.psv-container')) {
        this.state.moving = false;
        this.state.mouseHistory.length = 0;
        return;
      }

      if (this.state.moving) {
        // move threshold to trigger a click
        if (Math.abs(evt.clientX - this.state.startMouseX) < MOVE_THRESHOLD && Math.abs(evt.clientY - this.state.startMouseY) < MOVE_THRESHOLD) {
          this.__click(evt);

          this.state.moving = false;
        } // inertia animation
        else if (this.config.moveInertia) {
            this.__logMouseMove(evt);

            this.__stopMoveInertia(evt);
          } else {
            this.state.moving = false;
          }

        this.state.mouseHistory.length = 0;
      }
    }
    /**
     * @summary Stops the combined move and zoom
     * @private
     */
    ;

    _proto.__stopMoveZoom = function __stopMoveZoom() {
      this.state.mouseHistory.length = 0;
      this.state.moving = false;
      this.state.zooming = false;
    }
    /**
     * @summary Performs an animation to simulate inertia when the movement stops
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__stopMoveInertia = function __stopMoveInertia(evt) {
      var _this6 = this;

      var direction = {
        x: evt.clientX - this.state.mouseHistory[0][1],
        y: evt.clientY - this.state.mouseHistory[0][2]
      };
      var norm = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
      this.prop.animationPromise = new Animation({
        properties: {
          clientX: {
            start: evt.clientX,
            end: evt.clientX + direction.x
          },
          clientY: {
            start: evt.clientY,
            end: evt.clientY + direction.y
          }
        },
        duration: norm * INERTIA_WINDOW / 100,
        easing: 'outCirc',
        onTick: function onTick(properties) {
          _this6.__move(properties, false);
        }
      }).finally(function () {
        _this6.state.moving = false;
      });
    }
    /**
     * @summary Triggers an event with all coordinates when a simple click is performed
     * @param {MouseEvent|Touch} evt
     * @param {boolean} [longtouch=false]
     * @fires PSV.click
     * @fires PSV.dblclick
     * @private
     */
    ;

    _proto.__click = function __click(evt, longtouch) {
      var _this7 = this;

      if (longtouch === void 0) {
        longtouch = false;
      }

      var boundingRect = this.psv.container.getBoundingClientRect();
      /**
       * @type {PSV.ClickData}
       */

      var data = {
        rightclick: longtouch || evt.button === 2,
        target: evt.target,
        clientX: evt.clientX,
        clientY: evt.clientY,
        viewerX: evt.clientX - boundingRect.left,
        viewerY: evt.clientY - boundingRect.top
      };
      var intersect = this.psv.dataHelper.viewerCoordsToVector3({
        x: data.viewerX,
        y: data.viewerY
      });

      if (intersect) {
        var sphericalCoords = this.psv.dataHelper.vector3ToSphericalCoords(intersect);
        data.longitude = sphericalCoords.longitude;
        data.latitude = sphericalCoords.latitude; // TODO: for cubemap, computes texture's index and coordinates

        if (!this.prop.isCubemap) {
          var textureCoords = this.psv.dataHelper.sphericalCoordsToTextureCoords(data);
          data.textureX = textureCoords.x;
          data.textureY = textureCoords.y;
        }

        if (!this.state.dblclickTimeout) {
          this.psv.trigger(EVENTS.CLICK, data);
          this.state.dblclickData = clone(data);
          this.state.dblclickTimeout = setTimeout(function () {
            _this7.state.dblclickTimeout = null;
            _this7.state.dblclickData = null;
          }, DBLCLICK_DELAY);
        } else {
          if (Math.abs(this.state.dblclickData.clientX - data.clientX) < MOVE_THRESHOLD && Math.abs(this.state.dblclickData.clientY - data.clientY) < MOVE_THRESHOLD) {
            this.psv.trigger(EVENTS.DOUBLE_CLICK, this.state.dblclickData);
          }

          clearTimeout(this.state.dblclickTimeout);
          this.state.dblclickTimeout = null;
          this.state.dblclickData = null;
        }
      }
    }
    /**
     * @summary Performs movement
     * @param {MouseEvent|Touch} evt
     * @param {boolean} [log=true]
     * @private
     */
    ;

    _proto.__move = function __move(evt, log) {
      if (this.state.moving) {
        var x = evt.clientX;
        var y = evt.clientY;
        var rotation = {
          longitude: (x - this.state.mouseX) / this.prop.size.width * this.prop.moveSpeed * this.prop.hFov * SYSTEM.pixelRatio,
          latitude: (y - this.state.mouseY) / this.prop.size.height * this.prop.moveSpeed * this.prop.vFov * SYSTEM.pixelRatio
        };
        this.psv.rotate({
          longitude: this.prop.position.longitude - rotation.longitude,
          latitude: this.prop.position.latitude + rotation.latitude
        });
        this.state.mouseX = x;
        this.state.mouseY = y;

        if (log !== false) {
          this.__logMouseMove(evt);
        }
      }
    }
    /**
     * @summary Performs movement absolute to cursor position in viewer
     * @param {MouseEvent} evt
     * @private
     */
    ;

    _proto.__moveAbsolute = function __moveAbsolute(evt) {
      if (this.state.moving) {
        var containerRect = this.psv.container.getBoundingClientRect();
        this.psv.rotate({
          longitude: ((evt.clientX - containerRect.left) / containerRect.width - 0.5) * Math.PI * 2,
          latitude: -((evt.clientY - containerRect.top) / containerRect.height - 0.5) * Math.PI
        });
      }
    }
    /**
     * @summary Perfoms combined move and zoom
     * @param {TouchEvent} evt
     * @private
     */
    ;

    _proto.__moveZoom = function __moveZoom(evt) {
      if (this.state.zooming && this.state.moving) {
        var p1 = {
          x: evt.touches[0].clientX,
          y: evt.touches[0].clientY
        };
        var p2 = {
          x: evt.touches[1].clientX,
          y: evt.touches[1].clientY
        };
        var p = distance(p1, p2);
        var delta = 80 * (p - this.state.pinchDist) / this.prop.size.width;
        this.psv.zoom(this.prop.zoomLvl + delta);

        this.__move({
          clientX: (p1.x + p2.x) / 2,
          clientY: (p1.y + p2.y) / 2
        });

        this.state.pinchDist = p;
      }
    }
    /**
     * @summary Stores each mouse position during a mouse move
     * @description Positions older than "INERTIA_WINDOW" are removed<br>
     *     Positions before a pause of "INERTIA_WINDOW" / 10 are removed
     * @param {MouseEvent|Touch} evt
     * @private
     */
    ;

    _proto.__logMouseMove = function __logMouseMove(evt) {
      var now = Date.now();
      this.state.mouseHistory.push([now, evt.clientX, evt.clientY]);
      var previous = null;

      for (var i = 0; i < this.state.mouseHistory.length;) {
        if (this.state.mouseHistory[0][i] < now - INERTIA_WINDOW) {
          this.state.mouseHistory.splice(i, 1);
        } else if (previous && this.state.mouseHistory[0][i] - previous > INERTIA_WINDOW / 10) {
          this.state.mouseHistory.splice(0, i);
          i = 0;
          previous = this.state.mouseHistory[0][i];
        } else {
          i++;
          previous = this.state.mouseHistory[0][i];
        }
      }
    };

    return EventsHandler;
  }(AbstractService);

  /**
   * @summary Viewer and renderer
   * @extends PSV.services.AbstractService
   * @memberof PSV.services
   */

  var Renderer = /*#__PURE__*/function (_AbstractService) {
    _inheritsLoose(Renderer, _AbstractService);

    /**
     * @param {PSV.Viewer} psv
     */
    function Renderer(psv) {
      var _this;

      _this = _AbstractService.call(this, psv) || this;
      /**
       * @member {number}
       * @private
       */

      _this.mainReqid = undefined;
      /**
       * @member {external:THREE.WebGLRenderer}
       * @readonly
       * @protected
       */

      _this.renderer = null;
      /**
       * @member {external:THREE.Scene}
       * @readonly
       * @protected
       */

      _this.scene = null;
      /**
       * @member {external:THREE.PerspectiveCamera}
       * @readonly
       * @protected
       */

      _this.camera = null;
      /**
       * @member {external:THREE.Mesh}
       * @readonly
       * @protected
       */

      _this.mesh = null;
      /**
       * @member {external:THREE.Group}
       * @readonly
       * @private
       */

      _this.meshContainer = null;
      /**
       * @member {external:THREE.Raycaster}
       * @readonly
       * @protected
       */

      _this.raycaster = null;
      /**
       * @member {HTMLElement}
       * @readonly
       * @package
       */

      _this.canvasContainer = document.createElement('div');
      _this.canvasContainer.className = 'psv-canvas-container';
      _this.canvasContainer.style.background = _this.psv.config.canvasBackground;
      _this.canvasContainer.style.cursor = _this.psv.config.mousemove ? 'move' : 'default';

      _this.psv.container.appendChild(_this.canvasContainer);

      psv.on(EVENTS.SIZE_UPDATED, function (e, size) {
        if (_this.renderer) {
          _this.renderer.setSize(size.width, size.height);
        }
      });
      psv.on(EVENTS.CONFIG_CHANGED, function () {
        _this.canvasContainer.style.cursor = _this.psv.config.mousemove ? 'move' : 'default';
      });

      _this.hide();

      return _this;
    }
    /**
     * @override
     */


    var _proto = Renderer.prototype;

    _proto.destroy = function destroy() {
      // cancel render loop
      if (this.mainReqid) {
        window.cancelAnimationFrame(this.mainReqid);
      } // destroy ThreeJS view


      if (this.scene) {
        this.__cleanTHREEScene(this.scene);
      } // remove container


      this.psv.container.removeChild(this.canvasContainer);
      delete this.canvasContainer;
      delete this.renderer;
      delete this.scene;
      delete this.camera;
      delete this.mesh;
      delete this.meshContainer;
      delete this.raycaster;

      _AbstractService.prototype.destroy.call(this);
    }
    /**
     * @summary Hides the viewer
     */
    ;

    _proto.hide = function hide() {
      this.canvasContainer.style.opacity = 0;
    }
    /**
     * @summary Shows the viewer
     */
    ;

    _proto.show = function show() {
      this.canvasContainer.style.opacity = 1;
    }
    /**
     * @summary Main event loop, calls {@link render} if `prop.needsUpdate` is true
     * @param {number} timestamp
     * @fires PSV.before-render
     * @package
     */
    ;

    _proto.__renderLoop = function __renderLoop(timestamp) {
      var _this2 = this;

      this.psv.trigger(EVENTS.BEFORE_RENDER, timestamp);

      if (this.prop.needsUpdate) {
        this.render();
        this.prop.needsUpdate = false;
      }

      this.mainReqid = window.requestAnimationFrame(function (t) {
        return _this2.__renderLoop(t);
      });
    }
    /**
     * @summary Performs a render
     * @description Do not call this method directly, instead call
     * {@link PSV.Viewer#needsUpdate} on {@link PSV.event:before-render}.
     * @fires PSV.render
     */
    ;

    _proto.render = function render() {
      this.prop.direction = this.psv.dataHelper.sphericalCoordsToVector3(this.prop.position);
      this.camera.position.set(0, 0, 0);
      this.camera.lookAt(this.prop.direction);

      if (this.config.fisheye) {
        this.camera.position.copy(this.prop.direction).multiplyScalar(this.config.fisheye / 2).negate();
      }

      this.camera.aspect = this.prop.aspect;
      this.camera.fov = this.prop.vFov;
      this.camera.updateProjectionMatrix();
      this.renderer.render(this.scene, this.camera);
      this.psv.trigger(EVENTS.RENDER);
    }
    /**
     * @summary Applies the texture to the scene, creates the scene if needed
     * @param {PSV.TextureData} textureData
     * @fires PSV.panorama-loaded
     * @package
     */
    ;

    _proto.setTexture = function setTexture(textureData) {
      var texture = textureData.texture,
          panoData = textureData.panoData;
      this.prop.panoData = panoData;

      if (!this.scene) {
        this.__createScene();
      }

      if (this.prop.isCubemap) {
        for (var i = 0; i < 6; i++) {
          if (this.mesh.material[i].map) {
            this.mesh.material[i].map.dispose();
          }

          this.mesh.material[i].map = texture[i];
        }
      } else {
        if (this.mesh.material.map) {
          this.mesh.material.map.dispose();
        }

        this.mesh.material.map = texture;
      }

      this.psv.needsUpdate();
      this.psv.trigger(EVENTS.PANORAMA_LOADED);
    }
    /**
     * @summary Apply a panorama data pose to a Mesh
     * @param {PSV.PanoData} [panoData]
     * @param {external:THREE.Mesh} [mesh=this.mesh]
     * @package
     */
    ;

    _proto.setPanoramaPose = function setPanoramaPose(panoData, mesh) {
      if (mesh === void 0) {
        mesh = this.mesh;
      }

      if (!isNil(panoData == null ? void 0 : panoData.poseHeading) || !isNil(panoData == null ? void 0 : panoData.posePitch) || !isNil(panoData == null ? void 0 : panoData.poseRoll)) {
        // By Google documentation the angles are applied on the camera in order : heading, pitch, roll
        // here we apply the reverse transformation on the sphere
        mesh.rotation.set(-THREE.Math.degToRad((panoData == null ? void 0 : panoData.posePitch) || 0), -THREE.Math.degToRad((panoData == null ? void 0 : panoData.poseHeading) || 0), -THREE.Math.degToRad((panoData == null ? void 0 : panoData.poseRoll) || 0), 'ZXY');
      } else {
        mesh.rotation.set(0, 0, 0);
      }
    }
    /**
     * @summary Apply a SphereCorrection to a Mesh
     * @param {PSV.SphereCorrection} [sphereCorrection]
     * @param {external:THREE.Mesh} [mesh=this.meshContainer]
     * @package
     */
    ;

    _proto.setSphereCorrection = function setSphereCorrection(sphereCorrection, mesh) {
      if (mesh === void 0) {
        mesh = this.meshContainer;
      }

      if (sphereCorrection) {
        var cleanCorrection = this.psv.dataHelper.cleanSphereCorrection(sphereCorrection);

        if (!this.config.sphereCorrectionReorder) {
          var nonZeros = (cleanCorrection.tilt !== 0) + (cleanCorrection.pan !== 0) + (cleanCorrection.roll !== 0);

          if (nonZeros > 1) {
            logWarn("\"sphereCorrection\" computation will change in a future version. \n            Please set \"sphereCorrectionReorder: true\" and modify your correction accordingly.");
          }
        }

        mesh.rotation.set(cleanCorrection.tilt, cleanCorrection.pan, cleanCorrection.roll, this.config.sphereCorrectionReorder ? 'ZXY' : 'XYZ');
      } else {
        mesh.rotation.set(0, 0, 0);
      }
    }
    /**
     * @summary Creates the 3D scene and GUI components
     * @private
     */
    ;

    _proto.__createScene = function __createScene() {
      this.raycaster = new THREE.Raycaster();
      this.renderer = new THREE.WebGLRenderer({
        alpha: true
      });
      this.renderer.setSize(this.prop.size.width, this.prop.size.height);
      this.renderer.setPixelRatio(SYSTEM.pixelRatio);
      this.camera = new THREE.PerspectiveCamera(this.prop.vFov, this.prop.size.width / this.prop.size.height, 1, 3 * SPHERE_RADIUS);
      this.camera.position.set(0, 0, 0);
      this.scene = new THREE.Scene();
      this.scene.add(this.camera);

      if (this.prop.isCubemap) {
        this.mesh = this.__createCubemap();
      } else {
        this.mesh = this.__createSphere();
      }

      this.meshContainer = new THREE.Group();
      this.meshContainer.add(this.mesh);
      this.scene.add(this.meshContainer); // create canvas container

      this.renderer.domElement.className = 'psv-canvas';
      this.canvasContainer.appendChild(this.renderer.domElement);
    }
    /**
     * @summary Creates the sphere mesh
     * @param {number} [scale=1]
     * @returns {external:THREE.Mesh}
     * @private
     */
    ;

    _proto.__createSphere = function __createSphere(scale) {
      if (scale === void 0) {
        scale = 1;
      }

      // The middle of the panorama is placed at longitude=0
      var geometry = new THREE.SphereGeometry(SPHERE_RADIUS * scale, SPHERE_VERTICES, SPHERE_VERTICES, -Math.PI / 2);
      var material = new THREE.MeshBasicMaterial({
        side: THREE.BackSide
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(-1, 1, 1);
      return mesh;
    }
    /**
     * @summary Creates the cube mesh
     * @param {number} [scale=1]
     * @returns {external:THREE.Mesh}
     * @private
     */
    ;

    _proto.__createCubemap = function __createCubemap(scale) {
      if (scale === void 0) {
        scale = 1;
      }

      var cubeSize = SPHERE_RADIUS * 2 * scale;
      var geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize, CUBE_VERTICES, CUBE_VERTICES, CUBE_VERTICES);
      var materials = [];

      for (var i = 0; i < 6; i++) {
        materials.push(new THREE.MeshBasicMaterial({
          side: THREE.BackSide
        }));
      }

      var mesh = new THREE.Mesh(geometry, materials);
      mesh.scale.set(1, 1, -1);
      return mesh;
    }
    /**
     * @summary Performs transition between the current and a new texture
     * @param {PSV.TextureData} textureData
     * @param {PSV.PanoramaOptions} options
     * @returns {PSV.Animation}
     * @package
     */
    ;

    _proto.transition = function transition(textureData, options) {
      var _this3 = this;

      var texture = textureData.texture,
          panoData = textureData.panoData;
      var positionProvided = isExtendedPosition(options);
      var zoomProvided = ('zoom' in options);
      var group = new THREE.Group();
      var mesh;

      if (this.prop.isCubemap) {
        if (positionProvided) {
          logWarn('cannot perform cubemap transition to different position');
          positionProvided = false;
        }

        mesh = this.__createCubemap(0.9);
        mesh.material.forEach(function (material, i) {
          material.map = texture[i];
          material.transparent = true;
          material.opacity = 0;
        });
      } else {
        mesh = this.__createSphere(0.9);
        mesh.material.map = texture;
        mesh.material.transparent = true;
        mesh.material.opacity = 0;
        this.setPanoramaPose(panoData, mesh);
        this.setSphereCorrection(options.sphereCorrection, group);
      } // rotate the new sphere to make the target position face the camera


      if (positionProvided) {
        var cleanPosition = this.psv.dataHelper.cleanPosition(options); // Longitude rotation along the vertical axis

        var verticalAxis = new THREE.Vector3(0, 1, 0);
        group.rotateOnWorldAxis(verticalAxis, cleanPosition.longitude - this.prop.position.longitude); // Latitude rotation along the camera horizontal axis

        var horizontalAxis = new THREE.Vector3(0, 1, 0).cross(this.camera.getWorldDirection(new THREE.Vector3())).normalize();
        group.rotateOnWorldAxis(horizontalAxis, cleanPosition.latitude - this.prop.position.latitude); // TODO: find a better way to handle ranges

        if (this.config.latitudeRange || this.config.longitudeRange) {
          this.config.longitudeRange = null;
          this.config.latitudeRange = null;
          logWarn('trying to perform transition with longitudeRange and/or latitudeRange, ranges cleared');
        }
      }

      group.add(mesh);
      this.scene.add(group);
      this.psv.needsUpdate();
      return new Animation({
        properties: {
          opacity: {
            start: 0.0,
            end: 1.0
          },
          zoom: zoomProvided ? {
            start: this.prop.zoomLvl,
            end: options.zoom
          } : undefined
        },
        duration: options.transition,
        easing: 'outCubic',
        onTick: function onTick(properties) {
          if (_this3.prop.isCubemap) {
            for (var i = 0; i < 6; i++) {
              mesh.material[i].opacity = properties.opacity;
            }
          } else {
            mesh.material.opacity = properties.opacity;
          }

          if (zoomProvided) {
            _this3.psv.zoom(properties.zoom);
          }

          _this3.psv.needsUpdate();
        }
      }).then(function () {
        // remove temp sphere and transfer the texture to the main sphere
        _this3.setTexture(textureData);

        _this3.scene.remove(group);

        mesh.geometry.dispose();
        mesh.geometry = null;

        if (!_this3.prop.isCubemap) {
          _this3.setPanoramaPose(panoData);

          _this3.setSphereCorrection(options.sphereCorrection);
        } // actually rotate the camera


        if (positionProvided) {
          _this3.psv.rotate(options);
        }
      });
    }
    /**
     * @summary Calls `dispose` on all objects and textures
     * @param {external:THREE.Object3D} object
     * @private
     */
    ;

    _proto.__cleanTHREEScene = function __cleanTHREEScene(object) {
      var _this4 = this;

      object.traverse(function (item) {
        if (item.geometry) {
          item.geometry.dispose();
        }

        if (item.material) {
          if (Array.isArray(item.material)) {
            item.material.forEach(function (material) {
              if (material.map) {
                material.map.dispose();
              }

              material.dispose();
            });
          } else {
            if (item.material.map) {
              item.material.map.dispose();
            }

            item.material.dispose();
          }
        }

        if (item.dispose && !(item instanceof THREE.Scene)) {
          item.dispose();
        }

        if (item !== object) {
          _this4.__cleanTHREEScene(item);
        }
      });
    };

    return Renderer;
  }(AbstractService);

  /**
   * @summary Texture loader
   * @extends PSV.services.AbstractService
   * @memberof PSV.services
   */

  var TextureLoader = /*#__PURE__*/function (_AbstractService) {
    _inheritsLoose(TextureLoader, _AbstractService);

    /**
     * @param {PSV.Viewer} psv
     */
    function TextureLoader(psv) {
      var _this;

      _this = _AbstractService.call(this, psv) || this;
      /**
       * @summary Current HTTP requests
       * @type {XMLHttpRequest[]}
       * @private
       */

      _this.requests = [];
      return _this;
    }
    /**
     * @override
     */


    var _proto = TextureLoader.prototype;

    _proto.destroy = function destroy() {
      this.abortLoading();

      _AbstractService.prototype.destroy.call(this);
    }
    /**
     * @summary Loads the panorama texture(s)
     * @param {string|string[]|PSV.Cubemap} panorama
     * @param {PSV.PanoData | PSV.PanoDataProvider} [newPanoData]
     * @returns {Promise.<PSV.TextureData>}
     * @throws {PSV.PSVError} when the image cannot be loaded
     * @package
     */
    ;

    _proto.loadTexture = function loadTexture(panorama, newPanoData) {
      var tempPanorama = [];

      if (Array.isArray(panorama)) {
        if (panorama.length !== 6) {
          throw new PSVError('Must provide exactly 6 image paths when using cubemap.');
        } // reorder images


        for (var i = 0; i < 6; i++) {
          tempPanorama[i] = panorama[CUBE_MAP[i]];
        }

        return this.__loadCubemapTexture(tempPanorama);
      } else if (typeof panorama === 'object') {
        if (!CUBE_HASHMAP.every(function (side) {
          return !!panorama[side];
        })) {
          throw new PSVError('Must provide exactly left, front, right, back, top, bottom when using cubemap.');
        } // transform into array


        CUBE_HASHMAP.forEach(function (side, i) {
          tempPanorama[i] = panorama[side];
        });
        return this.__loadCubemapTexture(tempPanorama);
      } else {
        return this.__loadEquirectangularTexture(panorama, newPanoData);
      }
    }
    /**
     * @summary Cancels current HTTP requests
     * @package
     */
    ;

    _proto.abortLoading = function abortLoading() {
      [].concat(this.requests).forEach(function (r) {
        return r.abort();
      });
    }
    /**
     * @summary Loads a Blob with FileLoader
     * @param {string} url
     * @param {function(number)} [onProgress]
     * @returns {Promise<Blob>}
     * @private
     */
    ;

    _proto.__loadFile = function __loadFile(url, onProgress) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var progress = 0;
        onProgress && onProgress(progress);
        var loader = new THREE.FileLoader();

        if (_this2.config.withCredentials) {
          loader.setWithCredentials(true);
        }

        loader.setResponseType('blob');
        var request = loader.load(url, function (result) {
          var rIdx = _this2.requests.indexOf(request);

          if (rIdx !== -1) _this2.requests.splice(rIdx, 1);
          progress = 100;
          onProgress && onProgress(progress);
          resolve(result);
        }, function (e) {
          if (e.lengthComputable) {
            var newProgress = e.loaded / e.total * 100;

            if (newProgress > progress) {
              progress = newProgress;
              onProgress && onProgress(progress);
            }
          }
        }, function (err) {
          var rIdx = _this2.requests.indexOf(request);

          if (rIdx !== -1) _this2.requests.splice(rIdx, 1);
          reject(err);
        }); // when we hit the cache, the result is the cache value

        if (request instanceof XMLHttpRequest) {
          _this2.requests.push(request);
        }
      });
    }
    /**
     * @summary Loads an Image using FileLoader to have progress events
     * @param {string} url
     * @param {function(number)} [onProgress]
     * @returns {Promise<Image>}
     * @private
     */
    ;

    _proto.__loadImage = function __loadImage(url, onProgress) {
      return this.__loadFile(url, onProgress).then(function (result) {
        return new Promise(function (resolve, reject) {
          var img = document.createElementNS('http://www.w3.org/1999/xhtml', 'img');

          img.onload = function () {
            URL.revokeObjectURL(img.src);
            resolve(img);
          };

          img.onerror = reject;
          img.src = URL.createObjectURL(result);
        });
      });
    }
    /**
     * @summmary read a Blob as string
     * @param {Blob} blob
     * @returns {Promise<string>}
     * @private
     */
    ;

    _proto.__loadBlobAsString = function __loadBlobAsString(blob) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();

        reader.onload = function () {
          return resolve(reader.result);
        };

        reader.onerror = reject;
        reader.readAsText(blob);
      });
    }
    /**
     * @summary Loads the sphere texture
     * @param {string} panorama
     * @param {PSV.PanoData | PSV.PanoDataProvider} [newPanoData]
     * @returns {Promise.<PSV.TextureData>}
     * @throws {PSV.PSVError} when the image cannot be loaded
     * @private
     */
    ;

    _proto.__loadEquirectangularTexture = function __loadEquirectangularTexture(panorama, newPanoData) {
      var _this3 = this;

      if (this.prop.isCubemap === true) {
        throw new PSVError('The viewer was initialized with an cubemap, cannot switch to equirectangular panorama.');
      }

      this.prop.isCubemap = false;
      return (!this.config.useXmpData ? this.__loadImage(panorama, function (p) {
        return _this3.psv.loader.setProgress(p);
      }).then(function (img) {
        return {
          img: img,
          xmpPanoData: null
        };
      }) : this.__loadXMP(panorama, function (p) {
        return _this3.psv.loader.setProgress(p);
      }).then(function (xmpPanoData) {
        return _this3.__loadImage(panorama).then(function (img) {
          return {
            img: img,
            xmpPanoData: xmpPanoData
          };
        });
      })).then(function (_ref) {
        var _newPanoData, _newPanoData2, _newPanoData3, _newPanoData4, _newPanoData5, _newPanoData6, _newPanoData7, _newPanoData8, _newPanoData9;

        var img = _ref.img,
            xmpPanoData = _ref.xmpPanoData;

        if (typeof newPanoData === 'function') {
          // eslint-disable-next-line no-param-reassign
          newPanoData = newPanoData(img);
        }

        var panoData = {
          fullWidth: firstNonNull((_newPanoData = newPanoData) == null ? void 0 : _newPanoData.fullWidth, xmpPanoData == null ? void 0 : xmpPanoData.fullWidth, img.width),
          fullHeight: firstNonNull((_newPanoData2 = newPanoData) == null ? void 0 : _newPanoData2.fullHeight, xmpPanoData == null ? void 0 : xmpPanoData.fullHeight, img.height),
          croppedWidth: firstNonNull((_newPanoData3 = newPanoData) == null ? void 0 : _newPanoData3.croppedWidth, xmpPanoData == null ? void 0 : xmpPanoData.croppedWidth, img.width),
          croppedHeight: firstNonNull((_newPanoData4 = newPanoData) == null ? void 0 : _newPanoData4.croppedHeight, xmpPanoData == null ? void 0 : xmpPanoData.croppedHeight, img.height),
          croppedX: firstNonNull((_newPanoData5 = newPanoData) == null ? void 0 : _newPanoData5.croppedX, xmpPanoData == null ? void 0 : xmpPanoData.croppedX, 0),
          croppedY: firstNonNull((_newPanoData6 = newPanoData) == null ? void 0 : _newPanoData6.croppedY, xmpPanoData == null ? void 0 : xmpPanoData.croppedY, 0),
          poseHeading: firstNonNull((_newPanoData7 = newPanoData) == null ? void 0 : _newPanoData7.poseHeading, xmpPanoData == null ? void 0 : xmpPanoData.poseHeading),
          posePitch: firstNonNull((_newPanoData8 = newPanoData) == null ? void 0 : _newPanoData8.posePitch, xmpPanoData == null ? void 0 : xmpPanoData.posePitch),
          poseRoll: firstNonNull((_newPanoData9 = newPanoData) == null ? void 0 : _newPanoData9.poseRoll, xmpPanoData == null ? void 0 : xmpPanoData.poseRoll)
        };

        if (panoData.croppedWidth !== img.width || panoData.croppedHeight !== img.height) {
          logWarn("Invalid panoData, croppedWidth and/or croppedHeight is not coherent with loaded image\n    panoData: " + panoData.croppedWidth + "x" + panoData.croppedHeight + ", image: " + img.width + "x" + img.height);
        }

        var texture = _this3.__createEquirectangularTexture(img, panoData);

        return {
          texture: texture,
          panoData: panoData
        };
      });
    }
    /**
     * @summary Loads the XMP data of an image
     * @param {string} panorama
     * @param {function(number)} [onProgress]
     * @returns {Promise<PSV.PanoData>}
     * @throws {PSV.PSVError} when the image cannot be loaded
     * @private
     */
    ;

    _proto.__loadXMP = function __loadXMP(panorama, onProgress) {
      var _this4 = this;

      return this.__loadFile(panorama, onProgress).then(function (blob) {
        return _this4.__loadBlobAsString(blob);
      }).then(function (binary) {
        var a = binary.indexOf('<x:xmpmeta');
        var b = binary.indexOf('</x:xmpmeta>');
        var data = binary.substring(a, b);

        if (a !== -1 && b !== -1 && data.indexOf('GPano:') !== -1) {
          return {
            fullWidth: getXMPValue(data, 'FullPanoWidthPixels'),
            fullHeight: getXMPValue(data, 'FullPanoHeightPixels'),
            croppedWidth: getXMPValue(data, 'CroppedAreaImageWidthPixels'),
            croppedHeight: getXMPValue(data, 'CroppedAreaImageHeightPixels'),
            croppedX: getXMPValue(data, 'CroppedAreaLeftPixels'),
            croppedY: getXMPValue(data, 'CroppedAreaTopPixels'),
            poseHeading: getXMPValue(data, 'PoseHeadingDegrees'),
            posePitch: getXMPValue(data, 'PosePitchDegrees'),
            poseRoll: getXMPValue(data, 'PoseRollDegrees')
          };
        }

        return null;
      });
    }
    /**
     * @summary Creates the final texture from image and panorama data
     * @param {Image} img
     * @param {PSV.PanoData} panoData
     * @returns {external:THREE.Texture}
     * @private
     */
    ;

    _proto.__createEquirectangularTexture = function __createEquirectangularTexture(img, panoData) {
      var texture; // resize image / fill cropped parts with black

      if (panoData.fullWidth > SYSTEM.maxTextureWidth || panoData.croppedWidth !== panoData.fullWidth || panoData.croppedHeight !== panoData.fullHeight) {
        var resizedPanoData = _extends({}, panoData);

        var ratio = SYSTEM.getMaxCanvasWidth() / panoData.fullWidth;

        if (ratio < 1) {
          resizedPanoData.fullWidth *= ratio;
          resizedPanoData.fullHeight *= ratio;
          resizedPanoData.croppedWidth *= ratio;
          resizedPanoData.croppedHeight *= ratio;
          resizedPanoData.croppedX *= ratio;
          resizedPanoData.croppedY *= ratio;
        }

        var buffer = document.createElement('canvas');
        buffer.width = resizedPanoData.fullWidth;
        buffer.height = resizedPanoData.fullHeight;
        var ctx = buffer.getContext('2d');
        ctx.drawImage(img, resizedPanoData.croppedX, resizedPanoData.croppedY, resizedPanoData.croppedWidth, resizedPanoData.croppedHeight);
        texture = new THREE.Texture(buffer);
      } else {
        texture = new THREE.Texture(img);
      }

      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      return texture;
    }
    /**
     * @summary Load the six textures of the cube
     * @param {string[]} panorama
     * @returns {Promise.<PSV.TextureData>}
     * @throws {PSV.PSVError} when the image cannot be loaded
     * @private
     */
    ;

    _proto.__loadCubemapTexture = function __loadCubemapTexture(panorama) {
      var _this5 = this;

      if (this.prop.isCubemap === false) {
        throw new PSVError('The viewer was initialized with an equirectangular panorama, cannot switch to cubemap.');
      }

      if (this.config.fisheye) {
        logWarn('fisheye effect with cubemap texture can generate distorsion');
      }

      this.prop.isCubemap = true;
      var promises = [];
      var progress = [0, 0, 0, 0, 0, 0];

      var _loop = function _loop(i) {
        promises.push(_this5.__loadImage(panorama[i], function (p) {
          progress[i] = p;

          _this5.psv.loader.setProgress(sum(progress) / 6);
        }).then(function (img) {
          return _this5.__createCubemapTexture(img);
        }));
      };

      for (var i = 0; i < 6; i++) {
        _loop(i);
      }

      return Promise.all(promises).then(function (texture) {
        return {
          texture: texture
        };
      });
    }
    /**
     * @summary Creates the final texture from image
     * @param {Image} img
     * @returns {external:THREE.Texture}
     * @private
     */
    ;

    _proto.__createCubemapTexture = function __createCubemapTexture(img) {
      var texture; // resize image

      if (img.width > SYSTEM.maxTextureWidth) {
        var buffer = document.createElement('canvas');
        var ratio = SYSTEM.getMaxCanvasWidth() / img.width;
        buffer.width = img.width * ratio;
        buffer.height = img.height * ratio;
        var ctx = buffer.getContext('2d');
        ctx.drawImage(img, 0, 0, buffer.width, buffer.height);
        texture = new THREE.Texture(buffer);
      } else {
        texture = new THREE.Texture(img);
      }

      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      return texture;
    }
    /**
     * @summary Preload a panorama file without displaying it
     * @param {string|string[]|PSV.Cubemap} panorama
     * @returns {Promise}
     */
    ;

    _proto.preloadPanorama = function preloadPanorama(panorama) {
      return this.loadTexture(panorama);
    };

    return TextureLoader;
  }(AbstractService);

  var LEFT_MAP = {
    0: 'left',
    0.5: 'center',
    1: 'right'
  };
  var TOP_MAP = {
    0: 'top',
    0.5: 'center',
    1: 'bottom'
  };
  var STATE = {
    NONE: 0,
    SHOWING: 1,
    HIDING: 2,
    READY: 3
  };
  /**
   * @typedef {Object} PSV.components.Tooltip.Position
   * @summary Object defining the tooltip position
   * @property {number} top - Position of the tip of the arrow of the tooltip, in pixels
   * @property {number} left - Position of the tip of the arrow of the tooltip, in pixels
   * @property {string|string[]} [position='top center'] - Tooltip position toward it's arrow tip.
   *           Accepted values are combinations of `top`, `center`, `bottom` and `left`, `center`, `right`
   * @property {Object} [box] - Used when displaying a tooltip on a marker
   * @property {number} [box.width=0]
   * @property {number} [box.height=0]
   */

  /**
   * @typedef {PSV.components.Tooltip.Position} PSV.components.Tooltip.Config
   * @summary Object defining the tooltip configuration
   * @property {string} content - HTML content of the tooltip
   * @property {string} [className] - Additional CSS class added to the tooltip
   * @property {*} [data] - Userdata associated to the tooltip
   */

  /**
   * @summary Tooltip class
   * @extends PSV.components.AbstractComponent
   * @memberof PSV.components
   */

  var Tooltip = /*#__PURE__*/function (_AbstractComponent) {
    _inheritsLoose(Tooltip, _AbstractComponent);

    /**
     * @param {PSV.Viewer} psv
     * @param {{arrow: number, offset: number}} size
     */
    function Tooltip(psv, size) {
      var _this;

      _this = _AbstractComponent.call(this, psv, 'psv-tooltip') || this;
      /**
       * @override
       * @property {number} arrow
       * @property {number} offset
       * @property {number} width
       * @property {number} height
       * @property {string} pos
       * @property {string} state
       * @property {*} data
       */

      _this.prop = _extends({}, _this.prop, size, {
        state: STATE.NONE,
        width: 0,
        height: 0,
        pos: '',
        data: null
      });
      /**
       * Tooltip content
       * @member {HTMLElement}
       * @readonly
       * @private
       */

      _this.content = document.createElement('div');
      _this.content.className = 'psv-tooltip-content';

      _this.container.appendChild(_this.content);
      /**
       * Tooltip arrow
       * @member {HTMLElement}
       * @readonly
       * @package
       */


      _this.arrow = document.createElement('div');
      _this.arrow.className = 'psv-tooltip-arrow';

      _this.container.appendChild(_this.arrow);

      _this.container.addEventListener('transitionend', _assertThisInitialized(_this));

      _this.container.style.top = '-1000px';
      _this.container.style.left = '-1000px';
      return _this;
    }
    /**
     * @override
     */


    var _proto = Tooltip.prototype;

    _proto.destroy = function destroy() {
      delete this.arrow;
      delete this.content;

      _AbstractComponent.prototype.destroy.call(this);
    }
    /**
     * @summary Handles events
     * @param {Event} e
     * @private
     */
    ;

    _proto.handleEvent = function handleEvent(e) {
      /* eslint-disable */
      switch (e.type) {
        // @formatter:off
        case 'transitionend':
          this.__onTransitionEnd(e);

          break;
        // @formatter:on
      }
      /* eslint-enable */

    }
    /**
     * @override
     */
    ;

    _proto.toggle = function toggle() {
      throw new PSVError('Tooltip cannot be toggled');
    }
    /**
     * @summary Displays the tooltip on the viewer
     * Do not call this method directly, use {@link PSV.services.TooltipRenderer} instead.
     * @param {PSV.components.Tooltip.Config} config
     *
     * @fires PSV.show-tooltip
     * @throws {PSV.PSVError} when the configuration is incorrect
     *
     * @package
     */
    ;

    _proto.show = function show(config) {
      if (this.prop.state !== STATE.NONE) {
        throw new PSVError('Initialized tooltip cannot be re-initialized');
      }

      if (config.className) {
        addClasses(this.container, config.className);
      }

      this.content.innerHTML = config.content;
      var rect = this.container.getBoundingClientRect();
      this.prop.width = rect.right - rect.left;
      this.prop.height = rect.bottom - rect.top;
      this.prop.state = STATE.READY;
      this.move(config);
      this.prop.data = config.data;
      this.prop.state = STATE.SHOWING;
      this.psv.trigger(EVENTS.SHOW_TOOLTIP, this.prop.data, this);
    }
    /**
     * @summary Moves the tooltip to a new position
     * @param {PSV.components.Tooltip.Position} config
     *
     * @throws {PSV.PSVError} when the configuration is incorrect
     */
    ;

    _proto.move = function move(config) {
      if (this.prop.state !== STATE.SHOWING && this.prop.state !== STATE.READY) {
        throw new PSVError('Uninitialized tooltip cannot be moved');
      }

      var t = this.container;
      var a = this.arrow;

      if (!config.position) {
        config.position = ['top', 'center'];
      } // parse position


      if (typeof config.position === 'string') {
        var tempPos = parsePosition(config.position);

        if (!(tempPos.x in LEFT_MAP) || !(tempPos.y in TOP_MAP)) {
          throw new PSVError("Unable to parse tooltip position \"" + config.position + "\"");
        }

        config.position = [TOP_MAP[tempPos.y], LEFT_MAP[tempPos.x]];
      }

      if (config.position[0] === 'center' && config.position[1] === 'center') {
        throw new PSVError('Unable to parse tooltip position "center center"');
      } // compute size


      var style = {
        posClass: config.position.slice(),
        width: this.prop.width,
        height: this.prop.height,
        top: 0,
        left: 0,
        arrowTop: 0,
        arrowLeft: 0
      }; // set initial position

      this.__computeTooltipPosition(style, config); // correct position if overflow


      var refresh = false;

      if (style.top < this.prop.offset) {
        style.posClass[0] = 'bottom';
        refresh = true;
      } else if (style.top + style.height > this.psv.prop.size.height - this.prop.offset) {
        style.posClass[0] = 'top';
        refresh = true;
      }

      if (style.left < this.prop.offset) {
        style.posClass[1] = 'right';
        refresh = true;
      } else if (style.left + style.width > this.psv.prop.size.width - this.prop.offset) {
        style.posClass[1] = 'left';
        refresh = true;
      }

      if (refresh) {
        this.__computeTooltipPosition(style, config);
      } // apply position


      t.style.top = style.top + 'px';
      t.style.left = style.left + 'px';
      a.style.top = style.arrowTop + 'px';
      a.style.left = style.arrowLeft + 'px';
      var newPos = style.posClass.join('-');

      if (newPos !== this.prop.pos) {
        t.classList.remove("psv-tooltip--" + this.prop.pos);
        this.prop.pos = newPos;
        t.classList.add("psv-tooltip--" + this.prop.pos);
      }
    }
    /**
     * @summary Hides the tooltip
     * @fires PSV.hide-tooltip
     */
    ;

    _proto.hide = function hide() {
      this.container.classList.remove('psv-tooltip--visible');
      this.prop.state = STATE.HIDING;
      this.psv.trigger(EVENTS.HIDE_TOOLTIP, this.prop.data);
    }
    /**
     * @summary Finalize transition
     * @param {TransitionEvent} e
     * @private
     */
    ;

    _proto.__onTransitionEnd = function __onTransitionEnd(e) {
      if (e.propertyName === 'transform') {
        switch (this.prop.state) {
          case STATE.SHOWING:
            this.container.classList.add('psv-tooltip--visible');
            this.prop.state = STATE.READY;
            break;

          case STATE.HIDING:
            this.prop.state = STATE.NONE;
            this.destroy();
            break;

        }
      }
    }
    /**
     * @summary Computes the position of the tooltip and its arrow
     * @param {Object} style
     * @param {Object} config
     * @private
     */
    ;

    _proto.__computeTooltipPosition = function __computeTooltipPosition(style, config) {
      var topBottom = false;

      if (!config.box) {
        config.box = {
          width: 0,
          height: 0
        };
      }

      switch (style.posClass[0]) {
        case 'bottom':
          style.top = config.top + config.box.height + this.prop.offset + this.prop.arrow;
          style.arrowTop = -this.prop.arrow * 2;
          topBottom = true;
          break;

        case 'center':
          style.top = config.top + config.box.height / 2 - style.height / 2;
          style.arrowTop = style.height / 2 - this.prop.arrow;
          break;

        case 'top':
          style.top = config.top - style.height - this.prop.offset - this.prop.arrow;
          style.arrowTop = style.height;
          topBottom = true;
          break;
        // no default
      }

      switch (style.posClass[1]) {
        case 'right':
          if (topBottom) {
            style.left = config.left + config.box.width / 2 - this.prop.offset - this.prop.arrow;
            style.arrowLeft = this.prop.offset;
          } else {
            style.left = config.left + config.box.width + this.prop.offset + this.prop.arrow;
            style.arrowLeft = -this.prop.arrow * 2;
          }

          break;

        case 'center':
          style.left = config.left + config.box.width / 2 - style.width / 2;
          style.arrowLeft = style.width / 2 - this.prop.arrow;
          break;

        case 'left':
          if (topBottom) {
            style.left = config.left - style.width + config.box.width / 2 + this.prop.offset + this.prop.arrow;
            style.arrowLeft = style.width - this.prop.offset - this.prop.arrow * 2;
          } else {
            style.left = config.left - style.width - this.prop.offset - this.prop.arrow;
            style.arrowLeft = style.width;
          }

          break;
        // no default
      }
    };

    return Tooltip;
  }(AbstractComponent);

  /**
   * @summary Tooltip renderer
   * @extends PSV.services.AbstractService
   * @memberof PSV.services
   */

  var TooltipRenderer = /*#__PURE__*/function (_AbstractService) {
    _inheritsLoose(TooltipRenderer, _AbstractService);

    /**
     * @param {PSV.Viewer} psv
     */
    function TooltipRenderer(psv) {
      var _this;

      _this = _AbstractService.call(this, psv) || this;
      var testTooltip = new Tooltip(_this.psv);
      /**
       * @summary Computed static sizes
       * @member {Object}
       * @package
       * @property {number} arrowSize
       * @property {number} offset
       */

      _this.size = {
        arrow: parseInt(getStyle(testTooltip.arrow, 'borderTopWidth'), 10),
        offset: parseInt(getStyle(testTooltip.container, 'outlineWidth'), 10)
      };
      testTooltip.destroy();
      return _this;
    }
    /**
     * @override
     */


    var _proto = TooltipRenderer.prototype;

    _proto.destroy = function destroy() {
      delete this.size;

      _AbstractService.prototype.destroy.call(this);
    }
    /**
     * @summary Displays a tooltip on the viewer
     * @param {PSV.components.Tooltip.Config} config
     * @returns {PSV.components.Tooltip}
     *
     * @fires PSV.show-tooltip
     * @throws {PSV.PSVError} when the configuration is incorrect
     *
     * @example
     * viewer.tooltip.create({ content: 'Hello world', top: 200, left: 450, position: 'center bottom'})
     */
    ;

    _proto.create = function create(config) {
      var tooltip = new Tooltip(this.psv, this.size);
      tooltip.show(config);
      return tooltip;
    };

    return TooltipRenderer;
  }(AbstractService);

  THREE.Cache.enabled = true;
  /**
   * @summary Main class
   * @memberOf PSV
   * @extends {external:uEvent.EventEmitter}
   */

  var Viewer = /*#__PURE__*/function (_EventEmitter) {
    _inheritsLoose(Viewer, _EventEmitter);

    /**
     * @param {PSV.Options} options
     * @fires PSV.ready
     * @throws {PSV.PSVError} when the configuration is incorrect
     */
    function Viewer(options) {
      var _this;

      _this = _EventEmitter.call(this) || this;
      SYSTEM.load(); // must support WebGL

      if (!SYSTEM.isWebGLSupported) {
        throw new PSVError('WebGL is not supported.');
      }

      if (SYSTEM.maxTextureWidth === 0) {
        throw new PSVError('Unable to detect system capabilities');
      }
      /**
       * @summary Internal properties
       * @member {Object}
       * @protected
       * @property {boolean} ready - when all components are loaded
       * @property {boolean} needsUpdate - if the view needs to be renderer
       * @property {boolean} isCubemap - if the panorama is a cubemap
       * @property {PSV.Position} position - current direction of the camera
       * @property {external:THREE.Vector3} direction - direction of the camera
       * @property {number} zoomLvl - current zoom level
       * @property {number} vFov - vertical FOV
       * @property {number} hFov - horizontal FOV
       * @property {number} aspect - viewer aspect ratio
       * @property {number} moveSpeed - move speed (computed with pixel ratio and configuration moveSpeed)
       * @property {Function} autorotateCb - update callback of the automatic rotation
       * @property {PSV.Animation} animationPromise - promise of the current animation (either go to position or image transition)
       * @property {Promise} loadingPromise - promise of the setPanorama method
       * @property startTimeout - timeout id of the automatic rotation delay
       * @property {PSV.Size} size - size of the container
       * @property {PSV.PanoData} panoData - panorama metadata
       */


      _this.prop = {
        ready: false,
        uiRefresh: false,
        needsUpdate: false,
        fullscreen: false,
        isCubemap: undefined,
        position: {
          longitude: 0,
          latitude: 0
        },
        direction: null,
        zoomLvl: null,
        vFov: null,
        hFov: null,
        aspect: null,
        moveSpeed: 0.1,
        autorotateCb: null,
        animationPromise: null,
        loadingPromise: null,
        startTimeout: null,
        size: {
          width: 0,
          height: 0
        },
        panoData: {
          fullWidth: 0,
          fullHeight: 0,
          croppedWidth: 0,
          croppedHeight: 0,
          croppedX: 0,
          croppedY: 0
        }
      };
      /**
       * @summary Configuration holder
       * @type {PSV.Options}
       * @readonly
       */

      _this.config = getConfig(options);
      /**
       * @summary Top most parent
       * @member {HTMLElement}
       * @readonly
       */

      _this.parent = typeof options.container === 'string' ? document.getElementById(options.container) : options.container;
      _this.parent[VIEWER_DATA] = _assertThisInitialized(_this);
      /**
       * @summary Main container
       * @member {HTMLElement}
       * @readonly
       */

      _this.container = document.createElement('div');

      _this.container.classList.add('psv-container');

      _this.parent.appendChild(_this.container);
      /**
       * @summary All child components
       * @type {PSV.components.AbstractComponent[]}
       * @readonly
       * @package
       */


      _this.children = [];
      /**
       * @summary All plugins
       * @type {Object<string, PSV.plugins.AbstractPlugin>}
       * @readonly
       * @package
       */

      _this.plugins = {};
      /**
       * @summary Main render controller
       * @type {PSV.services.Renderer}
       * @readonly
       */

      _this.renderer = new Renderer(_assertThisInitialized(_this));
      /**
       * @summary Textures loader
       * @type {PSV.services.TextureLoader}
       * @readonly
       */

      _this.textureLoader = new TextureLoader(_assertThisInitialized(_this));
      /**
       * @summary Main event handler
       * @type {PSV.services.EventsHandler}
       * @readonly
       */

      _this.eventsHandler = new EventsHandler(_assertThisInitialized(_this));
      /**
       * @summary Utilities to help converting data
       * @type {PSV.services.DataHelper}
       * @readonly
       */

      _this.dataHelper = new DataHelper(_assertThisInitialized(_this));
      /**
       * @member {PSV.components.Loader}
       * @readonly
       */

      _this.loader = new Loader(_assertThisInitialized(_this));
      /**
       * @member {PSV.components.Navbar}
       * @readonly
       */

      _this.navbar = new Navbar(_assertThisInitialized(_this));
      /**
       * @member {PSV.components.Panel}
       * @readonly
       */

      _this.panel = new Panel(_assertThisInitialized(_this));
      /**
       * @member {PSV.services.TooltipRenderer}
       * @readonly
       */

      _this.tooltip = new TooltipRenderer(_assertThisInitialized(_this));
      /**
       * @member {PSV.components.Notification}
       * @readonly
       */

      _this.notification = new Notification(_assertThisInitialized(_this));
      /**
       * @member {PSV.components.Overlay}
       * @readonly
       */

      _this.overlay = new Overlay(_assertThisInitialized(_this));

      _this.eventsHandler.init();

      _this.__resizeRefresh = throttle(function () {
        return _this.refreshUi('resize');
      }, 500); // apply container size

      _this.resize(_this.config.size); // actual move speed depends on pixel-ratio


      _this.prop.moveSpeed = THREE.Math.degToRad(_this.config.moveSpeed / SYSTEM.pixelRatio); // init plugins

      _this.config.plugins.forEach(function (_ref) {
        var plugin = _ref[0],
            opts = _ref[1];
        _this.plugins[plugin.id] = new plugin(_assertThisInitialized(_this), opts); // eslint-disable-line new-cap
      }); // init buttons


      _this.navbar.setButtons(_this.config.navbar); // load panorama


      if (_this.config.panorama) {
        _this.setPanorama(_this.config.panorama);
      }

      SYSTEM.isTouchEnabled.then(function (enabled) {
        return toggleClass(_this.container, 'psv--is-touch', enabled);
      }); // enable GUI after first render

      _this.once(EVENTS.RENDER, function () {
        if (_this.config.navbar) {
          _this.container.classList.add('psv--has-navbar');

          _this.navbar.show();
        } // Queue autorotate


        if (_this.config.autorotateDelay) {
          _this.prop.startTimeout = setTimeout(function () {
            return _this.startAutorotate();
          }, _this.config.autorotateDelay);
        }

        _this.prop.ready = true;
        setTimeout(function () {
          _this.refreshUi('init');

          _this.trigger(EVENTS.READY);
        }, 0);
      });

      return _this;
    }
    /**
     * @summary Destroys the viewer
     * @description The memory used by the ThreeJS context is not totally cleared. This will be fixed as soon as possible.
     */


    var _proto = Viewer.prototype;

    _proto.destroy = function destroy() {
      this.__stopAll();

      this.stopKeyboardControl();
      this.exitFullscreen();
      this.eventsHandler.destroy();
      this.renderer.destroy();
      this.textureLoader.destroy();
      this.dataHelper.destroy();
      this.children.slice().forEach(function (child) {
        return child.destroy();
      });
      this.children.length = 0;
      each(this.plugins, function (plugin) {
        return plugin.destroy();
      });
      delete this.plugins;
      this.parent.removeChild(this.container);
      delete this.parent[VIEWER_DATA];
      delete this.parent;
      delete this.container;
      delete this.loader;
      delete this.navbar;
      delete this.panel;
      delete this.tooltip;
      delete this.notification;
      delete this.overlay;
      delete this.config;
    }
    /**
     * @summary Refresh UI
     * @package
     */
    ;

    _proto.refreshUi = function refreshUi(reason) {
      var _this2 = this;

      if (!this.prop.ready) {
        return;
      }

      if (!this.prop.uiRefresh) {
        // console.log(`PhotoSphereViewer: UI Refresh, ${reason}`);
        this.prop.uiRefresh = true;
        this.children.every(function (child) {
          child.refreshUi();
          return _this2.prop.uiRefresh === true;
        });
        this.prop.uiRefresh = false;
      } else if (this.prop.uiRefresh !== 'new') {
        this.prop.uiRefresh = 'new'; // wait for current refresh to cancel

        setTimeout(function () {
          _this2.prop.uiRefresh = false;

          _this2.refreshUi(reason);
        });
      }
    }
    /**
     * @summary Returns the instance of a plugin if it exists
     * @param {Class<PSV.plugins.AbstractPlugin>|string} pluginId
     * @returns {PSV.plugins.AbstractPlugin}
     */
    ;

    _proto.getPlugin = function getPlugin(pluginId) {
      return pluginId ? this.plugins[typeof pluginId === 'function' ? pluginId.id : pluginId] : null;
    }
    /**
     * @summary Returns the current position of the camera
     * @returns {PSV.Position}
     */
    ;

    _proto.getPosition = function getPosition() {
      return {
        longitude: this.prop.position.longitude,
        latitude: this.prop.position.latitude
      };
    }
    /**
     * @summary Returns the current zoom level
     * @returns {number}
     */
    ;

    _proto.getZoomLevel = function getZoomLevel() {
      return this.prop.zoomLvl;
    }
    /**
     * @summary Returns the current viewer size
     * @returns {PSV.Size}
     */
    ;

    _proto.getSize = function getSize() {
      return {
        width: this.prop.size.width,
        height: this.prop.size.height
      };
    }
    /**
     * @summary Checks if the automatic rotation is enabled
     * @returns {boolean}
     */
    ;

    _proto.isAutorotateEnabled = function isAutorotateEnabled() {
      return !!this.prop.autorotateCb;
    }
    /**
     * @summary Checks if the viewer is in fullscreen
     * @returns {boolean}
     */
    ;

    _proto.isFullscreenEnabled = function isFullscreenEnabled$1() {
      if (SYSTEM.fullscreenEvent) {
        return isFullscreenEnabled(this.container);
      } else {
        return this.prop.fullscreen;
      }
    }
    /**
     * @summary Flags the view has changed for the next render
     */
    ;

    _proto.needsUpdate = function needsUpdate() {
      this.prop.needsUpdate = true;

      if (!this.renderer.mainReqid && this.renderer.renderer) {
        this.renderer.__renderLoop(+new Date());
      }
    }
    /**
     * @summary Resizes the canvas when the window is resized
     * @fires PSV.size-updated
     */
    ;

    _proto.autoSize = function autoSize() {
      if (this.container.clientWidth !== this.prop.size.width || this.container.clientHeight !== this.prop.size.height) {
        this.prop.size.width = Math.round(this.container.clientWidth);
        this.prop.size.height = Math.round(this.container.clientHeight);
        this.prop.aspect = this.prop.size.width / this.prop.size.height;
        this.prop.hFov = this.dataHelper.vFovToHFov(this.prop.vFov);
        this.needsUpdate();
        this.trigger(EVENTS.SIZE_UPDATED, this.getSize());

        this.__resizeRefresh();
      }
    }
    /**
     * @summary Loads a new panorama file
     * @description Loads a new panorama file, optionally changing the camera position/zoom and activating the transition animation.<br>
     * If the "options" parameter is not defined, the camera will not move and the ongoing animation will continue.<br>
     * If another loading is already in progress it will be aborted.
     * @param {string|string[]|PSV.Cubemap} path - URL of the new panorama file
     * @param {PSV.PanoramaOptions} [options]
     * @returns {Promise}
     */
    ;

    _proto.setPanorama = function setPanorama(path, options) {
      var _this3 = this;

      if (options === void 0) {
        options = {};
      }

      if (this.prop.loadingPromise !== null) {
        this.textureLoader.abortLoading();
      } // apply default parameters on first load


      if (!this.prop.ready) {
        if (!('longitude' in options) && !this.prop.isCubemap) {
          options.longitude = this.config.defaultLong;
        }

        if (!('latitude' in options) && !this.prop.isCubemap) {
          options.latitude = this.config.defaultLat;
        }

        if (!('zoom' in options)) {
          options.zoom = this.config.defaultZoomLvl;
        }

        if (!('sphereCorrection' in options)) {
          options.sphereCorrection = this.config.sphereCorrection;
        }

        if (!('panoData' in options)) {
          options.panoData = this.config.panoData;
        }
      }

      if (options.transition === undefined || options.transition === true) {
        options.transition = 1500;
      }

      if (options.showLoader === undefined) {
        options.showLoader = true;
      }

      var positionProvided = isExtendedPosition(options);
      var zoomProvided = ('zoom' in options);

      if (positionProvided || zoomProvided) {
        this.__stopAll();
      }

      this.hideError();
      this.config.panorama = path;

      var done = function done(err) {
        if (err && err.type === 'abort') {
          console.warn(err);
        } else if (err) {
          _this3.showError(_this3.config.lang.loadError);

          console.error(err);
        }

        _this3.loader.hide();

        _this3.renderer.show();

        _this3.prop.loadingPromise = null;

        if (err) {
          return Promise.reject(err);
        } else {
          return true;
        }
      };

      if (!options.transition || !this.prop.ready) {
        if (options.showLoader || !this.prop.ready) {
          this.loader.show();
        }

        this.prop.loadingPromise = this.textureLoader.loadTexture(this.config.panorama, options.panoData).then(function (textureData) {
          _this3.renderer.setTexture(textureData);

          _this3.renderer.setPanoramaPose(textureData.panoData);

          _this3.renderer.setSphereCorrection(options.sphereCorrection);

          if (zoomProvided) {
            _this3.zoom(options.zoom);
          }

          if (positionProvided) {
            _this3.rotate(options);
          }
        }).then(done, done);
      } else {
        if (options.showLoader) {
          this.loader.show();
        }

        this.prop.loadingPromise = this.textureLoader.loadTexture(this.config.panorama, options.panoData).then(function (textureData) {
          _this3.loader.hide();

          return _this3.renderer.transition(textureData, options);
        }).then(done, done);
      }

      return this.prop.loadingPromise;
    }
    /**
     * @summary Update options
     * @param {PSV.Options} options
     * @fires PSV.config-changed
     */
    ;

    _proto.setOptions = function setOptions(options) {
      var _this4 = this;

      each(options, function (value, key) {
        if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
          throw new PSVError("Unknown option " + key);
        }

        if (READONLY_OPTIONS[key]) {
          throw new PSVError(READONLY_OPTIONS[key]);
        }

        if (CONFIG_PARSERS[key]) {
          _this4.config[key] = CONFIG_PARSERS[key](value, options);
        } else {
          _this4.config[key] = value;
        }

        switch (key) {
          case 'caption':
            _this4.navbar.setCaption(value);

            break;

          case 'size':
            _this4.resize(value);

            break;

          case 'sphereCorrection':
            _this4.renderer.setSphereCorrection(value);

            break;

          case 'navbar':
          case 'lang':
            _this4.navbar.setButtons(_this4.config.navbar);

            break;

          case 'moveSpeed':
            _this4.prop.moveSpeed = THREE.Math.degToRad(value / SYSTEM.pixelRatio);
            break;

          case 'minFov':
          case 'maxFov':
            _this4.prop.zoomLvl = _this4.dataHelper.fovToZoomLevel(_this4.prop.vFov);

            _this4.trigger(EVENTS.ZOOM_UPDATED, _this4.getZoomLevel());

            break;

          case 'canvasBackground':
            _this4.renderer.canvasContainer.style.background = _this4.config.canvasBackground;
            break;
        }
      });
      this.needsUpdate();
      this.refreshUi('set options');
      this.trigger(EVENTS.CONFIG_CHANGED, Object.keys(options));
    }
    /**
     * @summary Update options
     * @param {string} option
     * @param {any} value
     * @fires PSV.config-changed
     */
    ;

    _proto.setOption = function setOption(option, value) {
      var _this$setOptions;

      this.setOptions((_this$setOptions = {}, _this$setOptions[option] = value, _this$setOptions));
    }
    /**
     * @summary Starts the automatic rotation
     * @fires PSV.autorotate
     */
    ;

    _proto.startAutorotate = function startAutorotate() {
      var _this5 = this;

      this.__stopAll();

      this.prop.autorotateCb = function () {
        var last;
        var elapsed;
        return function (e, timestamp) {
          elapsed = last === undefined ? 0 : timestamp - last;
          last = timestamp;

          _this5.rotate({
            longitude: _this5.prop.position.longitude + _this5.config.autorotateSpeed * elapsed / 1000,
            latitude: _this5.prop.position.latitude - (_this5.prop.position.latitude - _this5.config.autorotateLat) / 200
          });
        };
      }();

      this.on(EVENTS.BEFORE_RENDER, this.prop.autorotateCb);
      this.trigger(EVENTS.AUTOROTATE, true);
    }
    /**
     * @summary Stops the automatic rotation
     * @fires PSV.autorotate
     */
    ;

    _proto.stopAutorotate = function stopAutorotate() {
      if (this.prop.startTimeout) {
        clearTimeout(this.prop.startTimeout);
        this.prop.startTimeout = null;
      }

      if (this.isAutorotateEnabled()) {
        this.off(EVENTS.BEFORE_RENDER, this.prop.autorotateCb);
        this.prop.autorotateCb = null;
        this.trigger(EVENTS.AUTOROTATE, false);
      }
    }
    /**
     * @summary Starts or stops the automatic rotation
     * @fires PSV.autorotate
     */
    ;

    _proto.toggleAutorotate = function toggleAutorotate() {
      if (this.isAutorotateEnabled()) {
        this.stopAutorotate();
      } else {
        this.startAutorotate();
      }
    }
    /**
     * @summary Displays an error message
     * @param {string} message
     */
    ;

    _proto.showError = function showError(message) {
      this.overlay.show({
        id: IDS.ERROR,
        image: errorIcon,
        text: message,
        dissmisable: false
      });
    }
    /**
     * @summary Hides the error message
     */
    ;

    _proto.hideError = function hideError() {
      this.overlay.hide(IDS.ERROR);
    }
    /**
     * @summary Rotates the view to specific longitude and latitude
     * @param {PSV.ExtendedPosition} position
     * @fires PSV.before-rotate
     * @fires PSV.position-updated
     */
    ;

    _proto.rotate = function rotate(position) {
      var e = this.trigger(EVENTS.BEFORE_ROTATE, position);

      if (e.isDefaultPrevented()) {
        return;
      }

      var cleanPosition = this.change(CHANGE_EVENTS.GET_ROTATE_POSITION, this.dataHelper.cleanPosition(position));

      if (this.prop.position.longitude !== cleanPosition.longitude || this.prop.position.latitude !== cleanPosition.latitude) {
        this.prop.position.longitude = cleanPosition.longitude;
        this.prop.position.latitude = cleanPosition.latitude;
        this.needsUpdate();
        this.trigger(EVENTS.POSITION_UPDATED, this.getPosition());
      }
    }
    /**
     * @summary Rotates and zooms the view with a smooth animation
     * @param {PSV.AnimateOptions} options - position and/or zoom level
     * @returns {PSV.Animation}
     */
    ;

    _proto.animate = function animate(options) {
      var _this6 = this;

      this.__stopAll();

      var positionProvided = isExtendedPosition(options);
      var zoomProvided = ('zoom' in options);
      var animProperties = {};
      var duration; // clean/filter position and compute duration

      if (positionProvided) {
        var cleanPosition = this.change(CHANGE_EVENTS.GET_ANIMATE_POSITION, this.dataHelper.cleanPosition(options)); // longitude offset for shortest arc

        var tOffset = getShortestArc(this.prop.position.longitude, cleanPosition.longitude);
        animProperties.longitude = {
          start: this.prop.position.longitude,
          end: this.prop.position.longitude + tOffset
        };
        animProperties.latitude = {
          start: this.prop.position.latitude,
          end: cleanPosition.latitude
        };
        duration = this.dataHelper.speedToDuration(options.speed, getAngle(this.prop.position, cleanPosition));
      } // clean/filter zoom and compute duration


      if (zoomProvided) {
        var dZoom = Math.abs(options.zoom - this.prop.zoomLvl);
        animProperties.zoom = {
          start: this.prop.zoomLvl,
          end: options.zoom
        };

        if (!duration) {
          // if animating zoom only and a speed is given, use an arbitrary PI/4 to compute the duration
          duration = this.dataHelper.speedToDuration(options.speed, Math.PI / 4 * dZoom / 100);
        }
      } // if no animation needed


      if (!duration) {
        if (positionProvided) {
          this.rotate(options);
        }

        if (zoomProvided) {
          this.zoom(options.zoom);
        }

        return Animation.resolve();
      }

      this.prop.animationPromise = new Animation({
        properties: animProperties,
        duration: duration,
        easing: 'inOutSine',
        onTick: function onTick(properties) {
          if (positionProvided) {
            _this6.rotate(properties);
          }

          if (zoomProvided) {
            _this6.zoom(properties.zoom);
          }
        }
      });
      return this.prop.animationPromise;
    }
    /**
     * @summary Stops the ongoing animation
     * @description The return value is a Promise because the is no guaranty the animation can be stopped synchronously.
     * @returns {Promise} Resolved when the animation has ben cancelled
     */
    ;

    _proto.stopAnimation = function stopAnimation() {
      var _this7 = this;

      if (this.prop.animationPromise) {
        return new Promise(function (resolve) {
          _this7.prop.animationPromise.finally(resolve);

          _this7.prop.animationPromise.cancel();

          _this7.prop.animationPromise = null;
        });
      } else {
        return Promise.resolve();
      }
    }
    /**
     * @summary Zooms to a specific level between `max_fov` and `min_fov`
     * @param {number} level - new zoom level from 0 to 100
     * @fires PSV.zoom-updated
     */
    ;

    _proto.zoom = function zoom(level) {
      var newZoomLvl = bound(level, 0, 100);

      if (this.prop.zoomLvl !== newZoomLvl) {
        this.prop.zoomLvl = newZoomLvl;
        this.prop.vFov = this.dataHelper.zoomLevelToFov(this.prop.zoomLvl);
        this.prop.hFov = this.dataHelper.vFovToHFov(this.prop.vFov);
        this.needsUpdate();
        this.trigger(EVENTS.ZOOM_UPDATED, this.getZoomLevel());
        this.rotate(this.prop.position);
      }
    }
    /**
     * @summary Increases the zoom level by 1
     */
    ;

    _proto.zoomIn = function zoomIn() {
      this.zoom(this.prop.zoomLvl + this.config.zoomButtonIncrement);
    }
    /**
     * @summary Decreases the zoom level by 1
     */
    ;

    _proto.zoomOut = function zoomOut() {
      this.zoom(this.prop.zoomLvl - this.config.zoomButtonIncrement);
    }
    /**
     * @summary Resizes the viewer
     * @param {PSV.CssSize} size
     */
    ;

    _proto.resize = function resize(size) {
      var _this8 = this;

      ['width', 'height'].forEach(function (dim) {
        if (size && size[dim]) {
          if (/^[0-9.]+$/.test(size[dim])) {
            size[dim] += 'px';
          }

          _this8.parent.style[dim] = size[dim];
        }
      });
      this.autoSize();
    }
    /**
     * @summary Enters the fullscreen mode
     * @fires PSV.fullscreen-updated
     */
    ;

    _proto.enterFullscreen = function enterFullscreen() {
      if (SYSTEM.fullscreenEvent) {
        requestFullscreen(this.container);
      } else {
        this.container.classList.add('psv-container--fullscreen');
        this.autoSize();

        this.eventsHandler.__fullscreenToggled(true);
      }
    }
    /**
     * @summary Exits the fullscreen mode
     * @fires PSV.fullscreen-updated
     */
    ;

    _proto.exitFullscreen = function exitFullscreen$1() {
      if (this.isFullscreenEnabled()) {
        if (SYSTEM.fullscreenEvent) {
          exitFullscreen();
        } else {
          this.container.classList.remove('psv-container--fullscreen');
          this.autoSize();

          this.eventsHandler.__fullscreenToggled(false);
        }
      }
    }
    /**
     * @summary Enters or exits the fullscreen mode
     * @fires PSV.fullscreen-updated
     */
    ;

    _proto.toggleFullscreen = function toggleFullscreen() {
      if (!this.isFullscreenEnabled()) {
        this.enterFullscreen();
      } else {
        this.exitFullscreen();
      }
    }
    /**
     * @summary Enables the keyboard controls (done automatically when entering fullscreen)
     */
    ;

    _proto.startKeyboardControl = function startKeyboardControl() {
      this.eventsHandler.enableKeyboard();
    }
    /**
     * @summary Disables the keyboard controls (done automatically when exiting fullscreen)
     */
    ;

    _proto.stopKeyboardControl = function stopKeyboardControl() {
      this.eventsHandler.disableKeyboard();
    }
    /**
     * @summary Stops all current animations
     * @private
     */
    ;

    _proto.__stopAll = function __stopAll() {
      this.stopAutorotate();
      this.stopAnimation();
      this.trigger(EVENTS.STOP_ALL);
    };

    return Viewer;
  }(uevent.EventEmitter);

  exports.AbstractButton = AbstractButton;
  exports.AbstractPlugin = AbstractPlugin;
  exports.Animation = Animation;
  exports.CONSTANTS = constants;
  exports.DEFAULTS = DEFAULTS;
  exports.PSVError = PSVError;
  exports.SYSTEM = SYSTEM;
  exports.Viewer = Viewer;
  exports.registerButton = registerButton;
  exports.utils = index;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=photo-sphere-viewer.js.map
