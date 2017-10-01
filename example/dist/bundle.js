require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var getVendorPropertyName = require('./getVendorPropertyName');

module.exports = function(target, sources) {
  var to = Object(target);
  var hasOwnProperty = Object.prototype.hasOwnProperty;

  for (var nextIndex = 1; nextIndex < arguments.length; nextIndex++) {
    var nextSource = arguments[nextIndex];
    if (nextSource == null) {
      continue;
    }

    var from = Object(nextSource);

    for (var key in from) {
      if (hasOwnProperty.call(from, key)) {
        to[key] = from[key];
      }
    }
  }

  var prefixed = {};
  for (var key in to) {
    prefixed[getVendorPropertyName(key)] = to[key]
  }

  return prefixed
}

},{"./getVendorPropertyName":4}],2:[function(require,module,exports){
'use strict';

module.exports = document.createElement('div').style;

},{}],3:[function(require,module,exports){
'use strict';

var cssVendorPrefix;

module.exports = function() {

  if (cssVendorPrefix) return cssVendorPrefix;

  var styles = window.getComputedStyle(document.documentElement, '');
  var pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1];

  return cssVendorPrefix = '-' + pre + '-';
}

},{}],4:[function(require,module,exports){
'use strict';

var builtinStyle = require('./builtinStyle');
var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
var domVendorPrefix;

// Helper function to get the proper vendor property name. (transition => WebkitTransition)
module.exports = function(prop, isSupportTest) {

  var vendorProp;
  if (prop in builtinStyle) return prop;

  var UpperProp = prop.charAt(0).toUpperCase() + prop.substr(1);

  if (domVendorPrefix) {

    vendorProp = domVendorPrefix + UpperProp;
    if (vendorProp in builtinStyle) {
      return vendorProp;
    }
  } else {

    for (var i = 0; i < prefixes.length; ++i) {
      vendorProp = prefixes[i] + UpperProp;
      if (vendorProp in builtinStyle) {
        domVendorPrefix = prefixes[i];
        return vendorProp;
      }
    }
  }

  // if support test, not fallback to origin prop name
  if (!isSupportTest) {
    return prop;
  }

}

},{"./builtinStyle":2}],5:[function(require,module,exports){
'use strict';

var insertRule = require('./insertRule');
var vendorPrefix = require('./getVendorPrefix')();
var index = 0;

module.exports = function(keyframes) {
  // random name
  var name = 'anim_' + (++index) + (+new Date);
  var css = "@" + vendorPrefix + "keyframes " + name + " {";

  for (var key in keyframes) {
    css += key + " {";

    for (var property in keyframes[key]) {
      var part = ":" + keyframes[key][property] + ";";
      // We do vendor prefix for every property
      css += vendorPrefix + property + part;
      css += property + part;
    }

    css += "}";
  }

  css += "}";

  insertRule(css);

  return name
}

},{"./getVendorPrefix":3,"./insertRule":6}],6:[function(require,module,exports){
'use strict';

var extraSheet;

module.exports = function(css) {

  if (!extraSheet) {
    // First time, create an extra stylesheet for adding rules
    extraSheet = document.createElement('style');
    document.getElementsByTagName('head')[0].appendChild(extraSheet);
    // Keep reference to actual StyleSheet object (`styleSheet` for IE < 9)
    extraSheet = extraSheet.sheet || extraSheet.styleSheet;
  }

  var index = (extraSheet.cssRules || extraSheet.rules).length;
  extraSheet.insertRule(css, index);

  return extraSheet;
}

},{}],7:[function(require,module,exports){
'use strict';

/**
 * EVENT_NAME_MAP is used to determine which event fired when a
 * transition/animation ends, based on the style property used to
 * define that event.
 */
var EVENT_NAME_MAP = {
  transitionend: {
    'transition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd',
    'MozTransition': 'mozTransitionEnd',
    'OTransition': 'oTransitionEnd',
    'msTransition': 'MSTransitionEnd'
  },

  animationend: {
    'animation': 'animationend',
    'WebkitAnimation': 'webkitAnimationEnd',
    'MozAnimation': 'mozAnimationEnd',
    'OAnimation': 'oAnimationEnd',
    'msAnimation': 'MSAnimationEnd'
  }
};

var endEvents = [];

function detectEvents() {
  var testEl = document.createElement('div');
  var style = testEl.style;

  // On some platforms, in particular some releases of Android 4.x,
  // the un-prefixed "animation" and "transition" properties are defined on the
  // style object but the events that fire will still be prefixed, so we need
  // to check if the un-prefixed events are useable, and if not remove them
  // from the map
  if (!('AnimationEvent' in window)) {
    delete EVENT_NAME_MAP.animationend.animation;
  }

  if (!('TransitionEvent' in window)) {
    delete EVENT_NAME_MAP.transitionend.transition;
  }

  for (var baseEventName in EVENT_NAME_MAP) {
    var baseEvents = EVENT_NAME_MAP[baseEventName];
    for (var styleName in baseEvents) {
      if (styleName in style) {
        endEvents.push(baseEvents[styleName]);
        break;
      }
    }
  }
}

if (typeof window !== 'undefined') {
  detectEvents();
}


// We use the raw {add|remove}EventListener() call because EventListener
// does not know how to remove event listeners and we really should
// clean up. Also, these events are not triggered in older browsers
// so we should be A-OK here.

function addEventListener(node, eventName, eventListener) {
  node.addEventListener(eventName, eventListener, false);
}

function removeEventListener(node, eventName, eventListener) {
  node.removeEventListener(eventName, eventListener, false);
}

module.exports = {
  addEndEventListener: function(node, eventListener) {
    if (endEvents.length === 0) {
      // If CSS transitions are not supported, trigger an "end animation"
      // event immediately.
      window.setTimeout(eventListener, 0);
      return;
    }
    endEvents.forEach(function(endEvent) {
      addEventListener(node, endEvent, eventListener);
    });
  },

  removeEndEventListener: function(node, eventListener) {
    if (endEvents.length === 0) {
      return;
    }
    endEvents.forEach(function(endEvent) {
      removeEventListener(node, endEvent, eventListener);
    });
  }
};

},{}],8:[function(require,module,exports){
"use strict";

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

function makeEmptyFunction(arg) {
  return function () {
    return arg;
  };
}

/**
 * This function accepts and discards inputs; it has no side effects. This is
 * primarily useful idiomatically for overridable function endpoints which
 * always need to be callable, since JS lacks a null-call idiom ala Cocoa.
 */
var emptyFunction = function emptyFunction() {};

emptyFunction.thatReturns = makeEmptyFunction;
emptyFunction.thatReturnsFalse = makeEmptyFunction(false);
emptyFunction.thatReturnsTrue = makeEmptyFunction(true);
emptyFunction.thatReturnsNull = makeEmptyFunction(null);
emptyFunction.thatReturnsThis = function () {
  return this;
};
emptyFunction.thatReturnsArgument = function (arg) {
  return arg;
};

module.exports = emptyFunction;
},{}],9:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var validateFormat = function validateFormat(format) {};

if (process.env.NODE_ENV !== 'production') {
  validateFormat = function validateFormat(format) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  };
}

function invariant(condition, format, a, b, c, d, e, f) {
  validateFormat(format);

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error(format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
      error.name = 'Invariant Violation';
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
}

module.exports = invariant;
}).call(this,require('_process'))

},{"_process":12}],10:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

var emptyFunction = require('./emptyFunction');

/**
 * Similar to invariant but only logs a warning if the condition is not met.
 * This can be used to log issues in development environments in critical
 * paths. Removing the logging code for production environments will keep the
 * same logic and follow the same code paths.
 */

var warning = emptyFunction;

if (process.env.NODE_ENV !== 'production') {
  var printWarning = function printWarning(format) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var argIndex = 0;
    var message = 'Warning: ' + format.replace(/%s/g, function () {
      return args[argIndex++];
    });
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };

  warning = function warning(condition, format) {
    if (format === undefined) {
      throw new Error('`warning(condition, format, ...args)` requires a warning ' + 'message argument');
    }

    if (format.indexOf('Failed Composite propType: ') === 0) {
      return; // Ignore CompositeComponent proptype check.
    }

    if (!condition) {
      for (var _len2 = arguments.length, args = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        args[_key2 - 2] = arguments[_key2];
      }

      printWarning.apply(undefined, [format].concat(args));
    }
  };
}

module.exports = warning;
}).call(this,require('_process'))

},{"./emptyFunction":8,"_process":12}],11:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],12:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],13:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

if (process.env.NODE_ENV !== 'production') {
  var invariant = require('fbjs/lib/invariant');
  var warning = require('fbjs/lib/warning');
  var ReactPropTypesSecret = require('./lib/ReactPropTypesSecret');
  var loggedTypeFailures = {};
}

/**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?Function} getStack Returns the component stack.
 * @private
 */
function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
  if (process.env.NODE_ENV !== 'production') {
    for (var typeSpecName in typeSpecs) {
      if (typeSpecs.hasOwnProperty(typeSpecName)) {
        var error;
        // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.
        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          invariant(typeof typeSpecs[typeSpecName] === 'function', '%s: %s type `%s` is invalid; it must be a function, usually from ' + 'the `prop-types` package, but received `%s`.', componentName || 'React class', location, typeSpecName, typeof typeSpecs[typeSpecName]);
          error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
        } catch (ex) {
          error = ex;
        }
        warning(!error || error instanceof Error, '%s: type specification of %s `%s` is invalid; the type checker ' + 'function must return `null` or an `Error` but returned a %s. ' + 'You may have forgotten to pass an argument to the type checker ' + 'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' + 'shape all require an argument).', componentName || 'React class', location, typeSpecName, typeof error);
        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error.message] = true;

          var stack = getStack ? getStack() : '';

          warning(false, 'Failed %s type: %s%s', location, error.message, stack != null ? stack : '');
        }
      }
    }
  }
}

module.exports = checkPropTypes;

}).call(this,require('_process'))

},{"./lib/ReactPropTypesSecret":17,"_process":12,"fbjs/lib/invariant":9,"fbjs/lib/warning":10}],14:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var emptyFunction = require('fbjs/lib/emptyFunction');
var invariant = require('fbjs/lib/invariant');
var ReactPropTypesSecret = require('./lib/ReactPropTypesSecret');

module.exports = function() {
  function shim(props, propName, componentName, location, propFullName, secret) {
    if (secret === ReactPropTypesSecret) {
      // It is still safe when called from React.
      return;
    }
    invariant(
      false,
      'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
      'Use PropTypes.checkPropTypes() to call them. ' +
      'Read more at http://fb.me/use-check-prop-types'
    );
  };
  shim.isRequired = shim;
  function getShim() {
    return shim;
  };
  // Important!
  // Keep this list in sync with production version in `./factoryWithTypeCheckers.js`.
  var ReactPropTypes = {
    array: shim,
    bool: shim,
    func: shim,
    number: shim,
    object: shim,
    string: shim,
    symbol: shim,

    any: shim,
    arrayOf: getShim,
    element: shim,
    instanceOf: getShim,
    node: shim,
    objectOf: getShim,
    oneOf: getShim,
    oneOfType: getShim,
    shape: getShim,
    exact: getShim
  };

  ReactPropTypes.checkPropTypes = emptyFunction;
  ReactPropTypes.PropTypes = ReactPropTypes;

  return ReactPropTypes;
};

},{"./lib/ReactPropTypesSecret":17,"fbjs/lib/emptyFunction":8,"fbjs/lib/invariant":9}],15:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var emptyFunction = require('fbjs/lib/emptyFunction');
var invariant = require('fbjs/lib/invariant');
var warning = require('fbjs/lib/warning');
var assign = require('object-assign');

var ReactPropTypesSecret = require('./lib/ReactPropTypesSecret');
var checkPropTypes = require('./checkPropTypes');

module.exports = function(isValidElement, throwOnDirectAccess) {
  /* global Symbol */
  var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

  /**
   * Returns the iterator method function contained on the iterable object.
   *
   * Be sure to invoke the function with the iterable as context:
   *
   *     var iteratorFn = getIteratorFn(myIterable);
   *     if (iteratorFn) {
   *       var iterator = iteratorFn.call(myIterable);
   *       ...
   *     }
   *
   * @param {?object} maybeIterable
   * @return {?function}
   */
  function getIteratorFn(maybeIterable) {
    var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
    if (typeof iteratorFn === 'function') {
      return iteratorFn;
    }
  }

  /**
   * Collection of methods that allow declaration and validation of props that are
   * supplied to React components. Example usage:
   *
   *   var Props = require('ReactPropTypes');
   *   var MyArticle = React.createClass({
   *     propTypes: {
   *       // An optional string prop named "description".
   *       description: Props.string,
   *
   *       // A required enum prop named "category".
   *       category: Props.oneOf(['News','Photos']).isRequired,
   *
   *       // A prop named "dialog" that requires an instance of Dialog.
   *       dialog: Props.instanceOf(Dialog).isRequired
   *     },
   *     render: function() { ... }
   *   });
   *
   * A more formal specification of how these methods are used:
   *
   *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
   *   decl := ReactPropTypes.{type}(.isRequired)?
   *
   * Each and every declaration produces a function with the same signature. This
   * allows the creation of custom validation functions. For example:
   *
   *  var MyLink = React.createClass({
   *    propTypes: {
   *      // An optional string or URI prop named "href".
   *      href: function(props, propName, componentName) {
   *        var propValue = props[propName];
   *        if (propValue != null && typeof propValue !== 'string' &&
   *            !(propValue instanceof URI)) {
   *          return new Error(
   *            'Expected a string or an URI for ' + propName + ' in ' +
   *            componentName
   *          );
   *        }
   *      }
   *    },
   *    render: function() {...}
   *  });
   *
   * @internal
   */

  var ANONYMOUS = '<<anonymous>>';

  // Important!
  // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
  var ReactPropTypes = {
    array: createPrimitiveTypeChecker('array'),
    bool: createPrimitiveTypeChecker('boolean'),
    func: createPrimitiveTypeChecker('function'),
    number: createPrimitiveTypeChecker('number'),
    object: createPrimitiveTypeChecker('object'),
    string: createPrimitiveTypeChecker('string'),
    symbol: createPrimitiveTypeChecker('symbol'),

    any: createAnyTypeChecker(),
    arrayOf: createArrayOfTypeChecker,
    element: createElementTypeChecker(),
    instanceOf: createInstanceTypeChecker,
    node: createNodeChecker(),
    objectOf: createObjectOfTypeChecker,
    oneOf: createEnumTypeChecker,
    oneOfType: createUnionTypeChecker,
    shape: createShapeTypeChecker,
    exact: createStrictShapeTypeChecker,
  };

  /**
   * inlined Object.is polyfill to avoid requiring consumers ship their own
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
   */
  /*eslint-disable no-self-compare*/
  function is(x, y) {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    } else {
      // Step 6.a: NaN == NaN
      return x !== x && y !== y;
    }
  }
  /*eslint-enable no-self-compare*/

  /**
   * We use an Error-like object for backward compatibility as people may call
   * PropTypes directly and inspect their output. However, we don't use real
   * Errors anymore. We don't inspect their stack anyway, and creating them
   * is prohibitively expensive if they are created too often, such as what
   * happens in oneOfType() for any type before the one that matched.
   */
  function PropTypeError(message) {
    this.message = message;
    this.stack = '';
  }
  // Make `instanceof Error` still work for returned errors.
  PropTypeError.prototype = Error.prototype;

  function createChainableTypeChecker(validate) {
    if (process.env.NODE_ENV !== 'production') {
      var manualPropTypeCallCache = {};
      var manualPropTypeWarningCount = 0;
    }
    function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
      componentName = componentName || ANONYMOUS;
      propFullName = propFullName || propName;

      if (secret !== ReactPropTypesSecret) {
        if (throwOnDirectAccess) {
          // New behavior only for users of `prop-types` package
          invariant(
            false,
            'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
            'Use `PropTypes.checkPropTypes()` to call them. ' +
            'Read more at http://fb.me/use-check-prop-types'
          );
        } else if (process.env.NODE_ENV !== 'production' && typeof console !== 'undefined') {
          // Old behavior for people using React.PropTypes
          var cacheKey = componentName + ':' + propName;
          if (
            !manualPropTypeCallCache[cacheKey] &&
            // Avoid spamming the console because they are often not actionable except for lib authors
            manualPropTypeWarningCount < 3
          ) {
            warning(
              false,
              'You are manually calling a React.PropTypes validation ' +
              'function for the `%s` prop on `%s`. This is deprecated ' +
              'and will throw in the standalone `prop-types` package. ' +
              'You may be seeing this warning due to a third-party PropTypes ' +
              'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.',
              propFullName,
              componentName
            );
            manualPropTypeCallCache[cacheKey] = true;
            manualPropTypeWarningCount++;
          }
        }
      }
      if (props[propName] == null) {
        if (isRequired) {
          if (props[propName] === null) {
            return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
          }
          return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
        }
        return null;
      } else {
        return validate(props, propName, componentName, location, propFullName);
      }
    }

    var chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
  }

  function createPrimitiveTypeChecker(expectedType) {
    function validate(props, propName, componentName, location, propFullName, secret) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== expectedType) {
        // `propValue` being instance of, say, date/regexp, pass the 'object'
        // check, but we can offer a more precise error message here rather than
        // 'of type `object`'.
        var preciseType = getPreciseType(propValue);

        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createAnyTypeChecker() {
    return createChainableTypeChecker(emptyFunction.thatReturnsNull);
  }

  function createArrayOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
      }
      var propValue = props[propName];
      if (!Array.isArray(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
      }
      for (var i = 0; i < propValue.length; i++) {
        var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret);
        if (error instanceof Error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createElementTypeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      if (!isValidElement(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createInstanceTypeChecker(expectedClass) {
    function validate(props, propName, componentName, location, propFullName) {
      if (!(props[propName] instanceof expectedClass)) {
        var expectedClassName = expectedClass.name || ANONYMOUS;
        var actualClassName = getClassName(props[propName]);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createEnumTypeChecker(expectedValues) {
    if (!Array.isArray(expectedValues)) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid argument supplied to oneOf, expected an instance of array.') : void 0;
      return emptyFunction.thatReturnsNull;
    }

    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      for (var i = 0; i < expectedValues.length; i++) {
        if (is(propValue, expectedValues[i])) {
          return null;
        }
      }

      var valuesString = JSON.stringify(expectedValues);
      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of value `' + propValue + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createObjectOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
      }
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
      }
      for (var key in propValue) {
        if (propValue.hasOwnProperty(key)) {
          var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
          if (error instanceof Error) {
            return error;
          }
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createUnionTypeChecker(arrayOfTypeCheckers) {
    if (!Array.isArray(arrayOfTypeCheckers)) {
      process.env.NODE_ENV !== 'production' ? warning(false, 'Invalid argument supplied to oneOfType, expected an instance of array.') : void 0;
      return emptyFunction.thatReturnsNull;
    }

    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
      var checker = arrayOfTypeCheckers[i];
      if (typeof checker !== 'function') {
        warning(
          false,
          'Invalid argument supplied to oneOfType. Expected an array of check functions, but ' +
          'received %s at index %s.',
          getPostfixForTypeWarning(checker),
          i
        );
        return emptyFunction.thatReturnsNull;
      }
    }

    function validate(props, propName, componentName, location, propFullName) {
      for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
        var checker = arrayOfTypeCheckers[i];
        if (checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret) == null) {
          return null;
        }
      }

      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createNodeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      if (!isNode(props[propName])) {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      for (var key in shapeTypes) {
        var checker = shapeTypes[key];
        if (!checker) {
          continue;
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createStrictShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      // We need to check all keys in case some are required but missing from
      // props.
      var allKeys = assign({}, props[propName], shapeTypes);
      for (var key in allKeys) {
        var checker = shapeTypes[key];
        if (!checker) {
          return new PropTypeError(
            'Invalid ' + location + ' `' + propFullName + '` key `' + key + '` supplied to `' + componentName + '`.' +
            '\nBad object: ' + JSON.stringify(props[propName], null, '  ') +
            '\nValid keys: ' +  JSON.stringify(Object.keys(shapeTypes), null, '  ')
          );
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }

    return createChainableTypeChecker(validate);
  }

  function isNode(propValue) {
    switch (typeof propValue) {
      case 'number':
      case 'string':
      case 'undefined':
        return true;
      case 'boolean':
        return !propValue;
      case 'object':
        if (Array.isArray(propValue)) {
          return propValue.every(isNode);
        }
        if (propValue === null || isValidElement(propValue)) {
          return true;
        }

        var iteratorFn = getIteratorFn(propValue);
        if (iteratorFn) {
          var iterator = iteratorFn.call(propValue);
          var step;
          if (iteratorFn !== propValue.entries) {
            while (!(step = iterator.next()).done) {
              if (!isNode(step.value)) {
                return false;
              }
            }
          } else {
            // Iterator will provide entry [k,v] tuples rather than values.
            while (!(step = iterator.next()).done) {
              var entry = step.value;
              if (entry) {
                if (!isNode(entry[1])) {
                  return false;
                }
              }
            }
          }
        } else {
          return false;
        }

        return true;
      default:
        return false;
    }
  }

  function isSymbol(propType, propValue) {
    // Native Symbol.
    if (propType === 'symbol') {
      return true;
    }

    // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
    if (propValue['@@toStringTag'] === 'Symbol') {
      return true;
    }

    // Fallback for non-spec compliant Symbols which are polyfilled.
    if (typeof Symbol === 'function' && propValue instanceof Symbol) {
      return true;
    }

    return false;
  }

  // Equivalent of `typeof` but with special handling for array and regexp.
  function getPropType(propValue) {
    var propType = typeof propValue;
    if (Array.isArray(propValue)) {
      return 'array';
    }
    if (propValue instanceof RegExp) {
      // Old webkits (at least until Android 4.0) return 'function' rather than
      // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
      // passes PropTypes.object.
      return 'object';
    }
    if (isSymbol(propType, propValue)) {
      return 'symbol';
    }
    return propType;
  }

  // This handles more types than `getPropType`. Only used for error messages.
  // See `createPrimitiveTypeChecker`.
  function getPreciseType(propValue) {
    if (typeof propValue === 'undefined' || propValue === null) {
      return '' + propValue;
    }
    var propType = getPropType(propValue);
    if (propType === 'object') {
      if (propValue instanceof Date) {
        return 'date';
      } else if (propValue instanceof RegExp) {
        return 'regexp';
      }
    }
    return propType;
  }

  // Returns a string that is postfixed to a warning about an invalid type.
  // For example, "undefined" or "of type array"
  function getPostfixForTypeWarning(value) {
    var type = getPreciseType(value);
    switch (type) {
      case 'array':
      case 'object':
        return 'an ' + type;
      case 'boolean':
      case 'date':
      case 'regexp':
        return 'a ' + type;
      default:
        return type;
    }
  }

  // Returns class name of the object, if any.
  function getClassName(propValue) {
    if (!propValue.constructor || !propValue.constructor.name) {
      return ANONYMOUS;
    }
    return propValue.constructor.name;
  }

  ReactPropTypes.checkPropTypes = checkPropTypes;
  ReactPropTypes.PropTypes = ReactPropTypes;

  return ReactPropTypes;
};

}).call(this,require('_process'))

},{"./checkPropTypes":13,"./lib/ReactPropTypesSecret":17,"_process":12,"fbjs/lib/emptyFunction":8,"fbjs/lib/invariant":9,"fbjs/lib/warning":10,"object-assign":11}],16:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

if (process.env.NODE_ENV !== 'production') {
  var REACT_ELEMENT_TYPE = (typeof Symbol === 'function' &&
    Symbol.for &&
    Symbol.for('react.element')) ||
    0xeac7;

  var isValidElement = function(object) {
    return typeof object === 'object' &&
      object !== null &&
      object.$$typeof === REACT_ELEMENT_TYPE;
  };

  // By explicitly using `prop-types` you are opting into new development behavior.
  // http://fb.me/prop-types-in-prod
  var throwOnDirectAccess = true;
  module.exports = require('./factoryWithTypeCheckers')(isValidElement, throwOnDirectAccess);
} else {
  // By explicitly using `prop-types` you are opting into new production behavior.
  // http://fb.me/prop-types-in-prod
  module.exports = require('./factoryWithThrowingShims')();
}

}).call(this,require('_process'))

},{"./factoryWithThrowingShims":14,"./factoryWithTypeCheckers":15,"_process":12}],17:[function(require,module,exports){
/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

module.exports = ReactPropTypesSecret;

},{}],18:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('domkit/insertKeyframesRule');
var appendVendorPrefix = require('domkit/appendVendorPrefix');

var animation = {
    show: {
        animationDuration: '0.4s',
        animationTimingFunction: 'cubic-bezier(0.7,0,0.3,1)'
    },

    hide: {
        animationDuration: '0.4s',
        animationTimingFunction: 'cubic-bezier(0.7,0,0.3,1)'
    },

    showModalAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0,
            transform: 'translate(-50%, -300px)'
        },
        '100%': {
            opacity: 1,
            transform: 'translate(-50%, -50%)'
        }
    }),

    hideModalAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1,
            transform: 'translate(-50%, -50%)'
        },
        '100%': {
            opacity: 0,
            transform: 'translate(-50%, 100px)'
        }
    }),

    showBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 0.9
        }
    }),

    hideBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0.9
        },
        '100%': {
            opacity: 0
        }
    }),

    showContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0,
            transform: 'translate(0, -20px)'
        },
        '100%': {
            opacity: 1,
            transform: 'translate(0, 0)'
        }
    }),

    hideContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1,
            transform: 'translate(0, 0)'
        },
        '100%': {
            opacity: 0,
            transform: 'translate(0, 50px)'
        }
    })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showModalAnimation = animation.showModalAnimation;
var hideModalAnimation = animation.hideModalAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;

module.exports = modalFactory({
    getRef: function(willHidden) {
        return 'modal';
    },
    getModalStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            width: "500px",
            transform: "translate(-50%, -50%)",
            top: "50%",
            left: "50%",
            backgroundColor: "white",
            zIndex: 1050,
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideModalAnimation : showModalAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    },
    getBackdropStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1040,
            backgroundColor: "#373A47",
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        });
    },
    getContentStyle: function(willHidden) {
        return appendVendorPrefix({
            margin: 0,
            opacity: 0,
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationDelay: '0.25s',
            animationName: showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

},{"./modalFactory":24,"domkit/appendVendorPrefix":1,"domkit/insertKeyframesRule":5}],19:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('domkit/insertKeyframesRule');
var appendVendorPrefix = require('domkit/appendVendorPrefix');

var animation = {
    show: {
        animationDuration: '0.3s',
        animationTimingFunction: 'ease-out'
    },
    hide: {
        animationDuration: '0.3s',
        animationTimingFunction: 'ease-out'
    },
    showContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 1
        }
    }),

    hideContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1
        },
        '100%': {
            opacity: 0
        }
    }),

    showBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 0.9
        },
    }),

    hideBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0.9
        },
        '100%': {
            opacity: 0
        }
    })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;

module.exports = modalFactory({
    getRef: function(willHidden) {
        return 'content';
    },
    getModalStyle: function(willHidden) {
        return appendVendorPrefix({
            zIndex: 1050,
            position: "fixed",
            width: "500px",
            transform: "translate3d(-50%, -50%, 0)",
            top: "50%",
            left: "50%"
        })
    },
    getBackdropStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1040,
            backgroundColor: "#373A47",
            animationFillMode: 'forwards',
            animationDuration: '0.3s',
            animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        });
    },
    getContentStyle: function(willHidden) {
        return appendVendorPrefix({
            margin: 0,
            backgroundColor: "white",
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideContentAnimation : showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

},{"./modalFactory":24,"domkit/appendVendorPrefix":1,"domkit/insertKeyframesRule":5}],20:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('domkit/insertKeyframesRule');
var appendVendorPrefix = require('domkit/appendVendorPrefix');

var animation = {
    show: {
        animationDuration: '0.5s',
        animationTimingFunction: 'ease-out'
    },
    hide: {
        animationDuration: '0.5s',
        animationTimingFunction: 'ease-out'
    },
    showContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0,
            transform: 'translate3d(calc(-100vw - 50%), 0, 0)'
        },
        '50%': {
            opacity: 1,
            transform: 'translate3d(100px, 0, 0)'
        },
        '100%': {
            opacity: 1,
            transform: 'translate3d(0, 0, 0)'
        }
    }),

    hideContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1,
            transform: 'translate3d(0, 0, 0)'
        },
        '50%': {
            opacity: 1,
            transform: 'translate3d(-100px, 0, 0) scale3d(1.1, 1.1, 1)'
        },
        '100%': {
            opacity: 0,
            transform: 'translate3d(calc(100vw + 50%), 0, 0)'
        },
    }),

    showBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 0.9
        },
    }),

    hideBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0.9
        },
        '90%': {
            opactiy: 0.9
        },
        '100%': {
            opacity: 0
        }
    })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;

module.exports = modalFactory({
    getRef: function(willHidden) {
        return 'content';
    },
    getModalStyle: function(willHidden) {
        return appendVendorPrefix({
            zIndex: 1050,
            position: "fixed",
            width: "500px",
            transform: "translate3d(-50%, -50%, 0)",
            top: "50%",
            left: "50%"
        })
    },
    getBackdropStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1040,
            backgroundColor: "#373A47",
            animationFillMode: 'forwards',
            animationDuration: '0.3s',
            animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        });
    },
    getContentStyle: function(willHidden) {
        return appendVendorPrefix({
            margin: 0,
            backgroundColor: "white",
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideContentAnimation : showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

},{"./modalFactory":24,"domkit/appendVendorPrefix":1,"domkit/insertKeyframesRule":5}],21:[function(require,module,exports){
var React = require('react');
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('domkit/insertKeyframesRule');
var appendVendorPrefix = require('domkit/appendVendorPrefix');

var animation = {
    show: {
        animationDuration: '0.8s',
        animationTimingFunction: 'cubic-bezier(0.6,0,0.4,1)'
    },
    hide: {
        animationDuration: '0.4s',
        animationTimingFunction: 'ease-out'
    },
    showContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0,
        },
        '40%':{
            opacity: 0
        },
        '100%': {
            opacity: 1,
        }
    }),

    hideContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1
        },
        '100%': {
            opacity: 0,
        }
    }),

    showBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 0.9
        },
    }),

    hideBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0.9
        },
        '100%': {
            opacity: 0
        }
    })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;

module.exports = modalFactory({
    getRef: function(willHidden) {
        return 'content';
    },
    getSharp: function(willHidden) {
        var strokeDashLength = 1680;

        var showSharpAnimation = insertKeyframesRule({
            '0%': {
                'stroke-dashoffset': strokeDashLength
            },
            '100%': {
                'stroke-dashoffset': 0
            },
        });


        var sharpStyle = {
            position: 'absolute',
            width: 'calc(100%)',
            height: 'calc(100%)',
            zIndex: '-1'
        };

        var rectStyle = appendVendorPrefix({
            animationDuration: willHidden? '0.4s' :'0.8s',
            animationFillMode: 'forwards',
            animationName: willHidden? hideContentAnimation: showSharpAnimation,
            stroke: '#ffffff',
            strokeWidth: '2px',
            strokeDasharray: strokeDashLength
        });

        return React.createElement("div", {style: sharpStyle}, 
            React.createElement("svg", {
                xmlns: "http://www.w3.org/2000/svg", 
                width: "100%", 
                height: "100%", 
                viewBox: "0 0 496 136", 
                preserveAspectRatio: "none"}, 
                React.createElement("rect", {style: rectStyle, 
                    x: "2", 
                    y: "2", 
                    fill: "none", 
                    width: "492", 
                    height: "132"})
            )
        )
    },
    getModalStyle: function(willHidden) {
        return appendVendorPrefix({
            zIndex: 1050,
            position: "fixed",
            width: "500px",
            transform: "translate3d(-50%, -50%, 0)",
            top: "50%",
            left: "50%"
        })
    },
    getBackdropStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1040,
            backgroundColor: "#373A47",
            animationFillMode: 'forwards',
            animationDuration: '0.4s',
            animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        });
    },
    getContentStyle: function(willHidden) {
        return appendVendorPrefix({
            margin: 0,
            backgroundColor: "white",
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideContentAnimation : showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

},{"./modalFactory":24,"domkit/appendVendorPrefix":1,"domkit/insertKeyframesRule":5,"react":undefined}],22:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('domkit/insertKeyframesRule');
var appendVendorPrefix = require('domkit/appendVendorPrefix');

var animation = {
    show: {
        animationDuration: '0.4s',
        animationTimingFunction: 'cubic-bezier(0.6,0,0.4,1)'
    },
    hide: {
        animationDuration: '0.4s',
        animationTimingFunction: 'ease-out'
    },
    showContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0,
            transform: 'scale3d(0, 0, 1)'
        },
        '100%': {
            opacity: 1,
            transform: 'scale3d(1, 1, 1)'
        }
    }),

    hideContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1
        },
        '100%': {
            opacity: 0,
            transform: 'scale3d(0.5, 0.5, 1)'
        }
    }),

    showBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 0.9
        },
    }),

    hideBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0.9
        },
        '100%': {
            opacity: 0
        }
    })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;

module.exports = modalFactory({
    getRef: function(willHidden) {
        return 'content';
    },
    getModalStyle: function(willHidden) {
        return appendVendorPrefix({
            zIndex: 1050,
            position: "fixed",
            width: "500px",
            transform: "translate3d(-50%, -50%, 0)",
            top: "50%",
            left: "50%"
        })
    },
    getBackdropStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1040,
            backgroundColor: "#373A47",
            animationFillMode: 'forwards',
            animationDuration: '0.4s',
            animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        });
    },
    getContentStyle: function(willHidden) {
        return appendVendorPrefix({
            margin: 0,
            backgroundColor: "white",
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideContentAnimation : showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

},{"./modalFactory":24,"domkit/appendVendorPrefix":1,"domkit/insertKeyframesRule":5}],23:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('domkit/insertKeyframesRule');
var appendVendorPrefix = require('domkit/appendVendorPrefix');

var animation = {
    show: {
        animationDuration: '1s',
        animationTimingFunction: 'linear'
    },
    hide: {
        animationDuration: '0.3s',
        animationTimingFunction: 'ease-out'
    },
    showContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0,
            transform: 'matrix3d(0.7, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '2.083333%': {
            transform: 'matrix3d(0.75266, 0, 0, 0, 0, 0.76342, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '4.166667%': {
            transform: 'matrix3d(0.81071, 0, 0, 0, 0, 0.84545, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '6.25%': {
            transform: 'matrix3d(0.86808, 0, 0, 0, 0, 0.9286, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '8.333333%': {
            transform: 'matrix3d(0.92038, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '10.416667%': {
            transform: 'matrix3d(0.96482, 0, 0, 0, 0, 1.05202, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '12.5%': {
            transform: 'matrix3d(1, 0, 0, 0, 0, 1.08204, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '14.583333%': {
            transform: 'matrix3d(1.02563, 0, 0, 0, 0, 1.09149, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '16.666667%': {
            transform: 'matrix3d(1.04227, 0, 0, 0, 0, 1.08453, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '18.75%': {
            transform: 'matrix3d(1.05102, 0, 0, 0, 0, 1.06666, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '20.833333%': {
            transform: 'matrix3d(1.05334, 0, 0, 0, 0, 1.04355, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '22.916667%': {
            transform: 'matrix3d(1.05078, 0, 0, 0, 0, 1.02012, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '25%': {
            transform: 'matrix3d(1.04487, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '27.083333%': {
            transform: 'matrix3d(1.03699, 0, 0, 0, 0, 0.98534, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '29.166667%': {
            transform: 'matrix3d(1.02831, 0, 0, 0, 0, 0.97688, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '31.25%': {
            transform: 'matrix3d(1.01973, 0, 0, 0, 0, 0.97422, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '33.333333%': {
            transform: 'matrix3d(1.01191, 0, 0, 0, 0, 0.97618, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '35.416667%': {
            transform: 'matrix3d(1.00526, 0, 0, 0, 0, 0.98122, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '37.5%': {
            transform: 'matrix3d(1, 0, 0, 0, 0, 0.98773, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '39.583333%': {
            transform: 'matrix3d(0.99617, 0, 0, 0, 0, 0.99433, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '41.666667%': {
            transform: 'matrix3d(0.99368, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '43.75%': {
            transform: 'matrix3d(0.99237, 0, 0, 0, 0, 1.00413, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '45.833333%': {
            transform: 'matrix3d(0.99202, 0, 0, 0, 0, 1.00651, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '47.916667%': {
            transform: 'matrix3d(0.99241, 0, 0, 0, 0, 1.00726, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '50%': {
            opacity: 1,
            transform: 'matrix3d(0.99329, 0, 0, 0, 0, 1.00671, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '52.083333%': {
            transform: 'matrix3d(0.99447, 0, 0, 0, 0, 1.00529, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '54.166667%': {
            transform: 'matrix3d(0.99577, 0, 0, 0, 0, 1.00346, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '56.25%': {
            transform: 'matrix3d(0.99705, 0, 0, 0, 0, 1.0016, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '58.333333%': {
            transform: 'matrix3d(0.99822, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '60.416667%': {
            transform: 'matrix3d(0.99921, 0, 0, 0, 0, 0.99884, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '62.5%': {
            transform: 'matrix3d(1, 0, 0, 0, 0, 0.99816, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '64.583333%': {
            transform: 'matrix3d(1.00057, 0, 0, 0, 0, 0.99795, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '66.666667%': {
            transform: 'matrix3d(1.00095, 0, 0, 0, 0, 0.99811, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '68.75%': {
            transform: 'matrix3d(1.00114, 0, 0, 0, 0, 0.99851, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '70.833333%': {
            transform: 'matrix3d(1.00119, 0, 0, 0, 0, 0.99903, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '72.916667%': {
            transform: 'matrix3d(1.00114, 0, 0, 0, 0, 0.99955, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '75%': {
            transform: 'matrix3d(1.001, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '77.083333%': {
            transform: 'matrix3d(1.00083, 0, 0, 0, 0, 1.00033, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '79.166667%': {
            transform: 'matrix3d(1.00063, 0, 0, 0, 0, 1.00052, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '81.25%': {
            transform: 'matrix3d(1.00044, 0, 0, 0, 0, 1.00058, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '83.333333%': {
            transform: 'matrix3d(1.00027, 0, 0, 0, 0, 1.00053, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '85.416667%': {
            transform: 'matrix3d(1.00012, 0, 0, 0, 0, 1.00042, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '87.5%': {
            transform: 'matrix3d(1, 0, 0, 0, 0, 1.00027, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '89.583333%': {
            transform: 'matrix3d(0.99991, 0, 0, 0, 0, 1.00013, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '91.666667%': {
            transform: 'matrix3d(0.99986, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '93.75%': {
            transform: 'matrix3d(0.99983, 0, 0, 0, 0, 0.99991, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '95.833333%': {
            transform: 'matrix3d(0.99982, 0, 0, 0, 0, 0.99985, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '97.916667%': {
            transform: 'matrix3d(0.99983, 0, 0, 0, 0, 0.99984, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        },
        '100%': {
            opacity: 1,
            transform: 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'
        }
    }),

    hideContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1
        },
        '100%': {
            opacity: 0,
            transform: 'scale3d(0.8, 0.8, 1)'
        },
    }),

    showBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 0.9
        },
    }),

    hideBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0.9
        },
        '100%': {
            opacity: 0
        }
    })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;

module.exports = modalFactory({
    getRef: function(willHidden) {
        return 'content';
    },
    getModalStyle: function(willHidden) {
        return appendVendorPrefix({
            zIndex: 1050,
            position: "fixed",
            width: "500px",
            transform: "translate3d(-50%, -50%, 0)",
            top: "50%",
            left: "50%"
        })
    },
    getBackdropStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1040,
            backgroundColor: "#373A47",
            animationFillMode: 'forwards',
            animationDuration: '0.3s',
            animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        });
    },
    getContentStyle: function(willHidden) {
        return appendVendorPrefix({
            margin: 0,
            backgroundColor: "white",
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideContentAnimation : showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

},{"./modalFactory":24,"domkit/appendVendorPrefix":1,"domkit/insertKeyframesRule":5}],24:[function(require,module,exports){
var React = require('react');
var PropTypes = require('prop-types')
var transitionEvents = require('domkit/transitionEvents');
var appendVendorPrefix = require('domkit/appendVendorPrefix');

module.exports = function(animation){

    return React.createClass({
        propTypes: {
            className: PropTypes.string,
            // Close the modal when esc is pressed? Defaults to true.
            keyboard: PropTypes.bool,
            onShow: PropTypes.func,
            onHide: PropTypes.func,
            animation: PropTypes.object,
            backdrop: PropTypes.bool,
            closeOnClick: PropTypes.bool,
            modalStyle: PropTypes.object,
            backdropStyle: PropTypes.object,
            contentStyle: PropTypes.object,
        },

        getDefaultProps: function() {
            return {
                className: "",
                onShow: function(){},
                onHide: function(){},
                animation: animation,
                keyboard: true,
                backdrop: true,
                closeOnClick: true,
                modalStyle: {},
                backdropStyle: {},
                contentStyle: {},
            };
        },

        getInitialState: function(){
            return {
                willHidden: false,
                hidden: true
            };
        },

        hasHidden: function(){
            return this.state.hidden;
        },

        addTransitionListener: function(node, handle){
            if (node) {
              var endListener = function(e) {
                  if (e && e.target !== node) {
                      return;
                  }
                  transitionEvents.removeEndEventListener(node, endListener);
                  handle();
              };
              transitionEvents.addEndEventListener(node, endListener);
            }
        },

        handleBackdropClick: function() {
            if (this.props.closeOnClick) {
                this.hide("backdrop");
            }
        },

        render: function() {

            var hidden = this.hasHidden();
            if (hidden) return null;

            var willHidden = this.state.willHidden;
            var animation = this.props.animation;
            var modalStyle = animation.getModalStyle(willHidden);
            var backdropStyle = animation.getBackdropStyle(willHidden);
            var contentStyle = animation.getContentStyle(willHidden);
            var ref = animation.getRef(willHidden);
            var sharp = animation.getSharp && animation.getSharp(willHidden);

            // Apply custom style properties
            if (this.props.modalStyle) {
                var prefixedModalStyle = appendVendorPrefix(this.props.modalStyle);
                for (var style in prefixedModalStyle) {
                    modalStyle[style] = prefixedModalStyle[style];
                }
            }

            if (this.props.backdropStyle) {
              var prefixedBackdropStyle = appendVendorPrefix(this.props.backdropStyle);
                for (var style in prefixedBackdropStyle) {
                    backdropStyle[style] = prefixedBackdropStyle[style];
                }
            }

            if (this.props.contentStyle) {
              var prefixedContentStyle = appendVendorPrefix(this.props.contentStyle);
                for (var style in prefixedContentStyle) {
                    contentStyle[style] = prefixedContentStyle[style];
                }
            }

            var backdrop = this.props.backdrop? React.createElement("div", {style: backdropStyle, onClick: this.props.closeOnClick? this.handleBackdropClick: null}): undefined;

            if(willHidden) {
                var node = this.refs[ref];
                this.addTransitionListener(node, this.leave);
            }

            return (React.createElement("span", null, 
                React.createElement("div", {ref: "modal", style: modalStyle, className: this.props.className}, 
                    sharp, 
                    React.createElement("div", {ref: "content", tabIndex: "-1", style: contentStyle}, 
                        this.props.children
                    )
                ), 
                backdrop
             ))
            ;
        },

        leave: function(){
            this.setState({
                hidden: true
            });
            this.props.onHide(this.state.hideSource);
        },

        enter: function(){
            this.props.onShow();
        },

        show: function(){
            if (!this.hasHidden()) return;

            this.setState({
                willHidden: false,
                hidden: false
            });

            setTimeout(function(){
              var ref = this.props.animation.getRef();
              var node = this.refs[ref];
              this.addTransitionListener(node, this.enter);
            }.bind(this), 0);
        },

        hide: function(source){
            if (this.hasHidden()) return;

            if (!source) {
                source = "hide";
            }

            this.setState({
                hideSource: source,
                willHidden: true
            });
        },

        toggle: function(){
            if (this.hasHidden())
                this.show();
            else
                this.hide("toggle");
        },

        listenKeyboard: function(event) {
            (typeof(this.props.keyboard)=="function")
                ?this.props.keyboard(event)
                :this.closeOnEsc(event);
        },

        closeOnEsc: function(event){
            if (this.props.keyboard &&
                    (event.key === "Escape" ||
                     event.keyCode === 27)) {
                this.hide("keyboard");
            }
        },

        componentDidMount: function(){
            window.addEventListener("keydown", this.listenKeyboard, true);
        },

        componentWillUnmount: function() {
            window.removeEventListener("keydown", this.listenKeyboard, true);
        }
    });
};

},{"domkit/appendVendorPrefix":1,"domkit/transitionEvents":7,"prop-types":16,"react":undefined}],"boron":[function(require,module,exports){
module.exports = {
    DropModal: require('./DropModal'),
    WaveModal: require('./WaveModal'),
    FlyModal: require('./FlyModal'),
    FadeModal: require('./FadeModal'),
    ScaleModal: require('./ScaleModal'),
    OutlineModal: require('./OutlineModal'),
}

},{"./DropModal":18,"./FadeModal":19,"./FlyModal":20,"./OutlineModal":21,"./ScaleModal":22,"./WaveModal":23}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZG9ta2l0L2FwcGVuZFZlbmRvclByZWZpeC5qcyIsIm5vZGVfbW9kdWxlcy9kb21raXQvYnVpbHRpblN0eWxlLmpzIiwibm9kZV9tb2R1bGVzL2RvbWtpdC9nZXRWZW5kb3JQcmVmaXguanMiLCJub2RlX21vZHVsZXMvZG9ta2l0L2dldFZlbmRvclByb3BlcnR5TmFtZS5qcyIsIm5vZGVfbW9kdWxlcy9kb21raXQvaW5zZXJ0S2V5ZnJhbWVzUnVsZS5qcyIsIm5vZGVfbW9kdWxlcy9kb21raXQvaW5zZXJ0UnVsZS5qcyIsIm5vZGVfbW9kdWxlcy9kb21raXQvdHJhbnNpdGlvbkV2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9mYmpzL2xpYi9lbXB0eUZ1bmN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2ZianMvbGliL2ludmFyaWFudC5qcyIsIm5vZGVfbW9kdWxlcy9mYmpzL2xpYi93YXJuaW5nLmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1hc3NpZ24vaW5kZXguanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3Byb3AtdHlwZXMvY2hlY2tQcm9wVHlwZXMuanMiLCJub2RlX21vZHVsZXMvcHJvcC10eXBlcy9mYWN0b3J5V2l0aFRocm93aW5nU2hpbXMuanMiLCJub2RlX21vZHVsZXMvcHJvcC10eXBlcy9mYWN0b3J5V2l0aFR5cGVDaGVja2Vycy5qcyIsIm5vZGVfbW9kdWxlcy9wcm9wLXR5cGVzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb3AtdHlwZXMvbGliL1JlYWN0UHJvcFR5cGVzU2VjcmV0LmpzIiwiL1VzZXJzL3lpemkvY29kZS9ib3Jvbi9zcmMvRHJvcE1vZGFsLmpzIiwiL1VzZXJzL3lpemkvY29kZS9ib3Jvbi9zcmMvRmFkZU1vZGFsLmpzIiwiL1VzZXJzL3lpemkvY29kZS9ib3Jvbi9zcmMvRmx5TW9kYWwuanMiLCIvVXNlcnMveWl6aS9jb2RlL2Jvcm9uL3NyYy9PdXRsaW5lTW9kYWwuanMiLCIvVXNlcnMveWl6aS9jb2RlL2Jvcm9uL3NyYy9TY2FsZU1vZGFsLmpzIiwiL1VzZXJzL3lpemkvY29kZS9ib3Jvbi9zcmMvV2F2ZU1vZGFsLmpzIiwiL1VzZXJzL3lpemkvY29kZS9ib3Jvbi9zcmMvbW9kYWxGYWN0b3J5LmpzIiwiL1VzZXJzL3lpemkvY29kZS9ib3Jvbi9zcmMvQm9yb24uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDOWhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzdDLElBQUksbUJBQW1CLEdBQUcsT0FBTyxDQUFD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SSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUMxRSxTQUFTOztRQUVELG9CQUFvQixFQUFFLFdBQVc7WUFDN0IsTUFBTSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ3BFO0tBQ0osQ0FBQyxDQUFDO0NBQ04sQ0FBQzs7O0FDN0xGLE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDYixTQUFTLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQztJQUNqQyxTQUFTLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQztJQUNqQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFlBQVksQ0FBQztJQUMvQixTQUFTLEVBQUUsT0FBTyxDQUFDLGFBQWEsQ0FBQztJQUNqQyxVQUFVLEVBQUUsT0FBTyxDQUFDLGNBQWMsQ0FBQztJQUNuQyxZQUFZLEVBQUUsT0FBTyxDQUFDLGdCQUFnQixDQUFDO0NBQzFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldFZlbmRvclByb3BlcnR5TmFtZSA9IHJlcXVpcmUoJy4vZ2V0VmVuZG9yUHJvcGVydHlOYW1lJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24odGFyZ2V0LCBzb3VyY2VzKSB7XG4gIHZhciB0byA9IE9iamVjdCh0YXJnZXQpO1xuICB2YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4gIGZvciAodmFyIG5leHRJbmRleCA9IDE7IG5leHRJbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7IG5leHRJbmRleCsrKSB7XG4gICAgdmFyIG5leHRTb3VyY2UgPSBhcmd1bWVudHNbbmV4dEluZGV4XTtcbiAgICBpZiAobmV4dFNvdXJjZSA9PSBudWxsKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICB2YXIgZnJvbSA9IE9iamVjdChuZXh0U291cmNlKTtcblxuICAgIGZvciAodmFyIGtleSBpbiBmcm9tKSB7XG4gICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChmcm9tLCBrZXkpKSB7XG4gICAgICAgIHRvW2tleV0gPSBmcm9tW2tleV07XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdmFyIHByZWZpeGVkID0ge307XG4gIGZvciAodmFyIGtleSBpbiB0bykge1xuICAgIHByZWZpeGVkW2dldFZlbmRvclByb3BlcnR5TmFtZShrZXkpXSA9IHRvW2tleV1cbiAgfVxuXG4gIHJldHVybiBwcmVmaXhlZFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpLnN0eWxlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3NzVmVuZG9yUHJlZml4O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXG4gIGlmIChjc3NWZW5kb3JQcmVmaXgpIHJldHVybiBjc3NWZW5kb3JQcmVmaXg7XG5cbiAgdmFyIHN0eWxlcyA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJycpO1xuICB2YXIgcHJlID0gKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHN0eWxlcykuam9pbignJykubWF0Y2goLy0obW96fHdlYmtpdHxtcyktLykgfHwgKHN0eWxlcy5PTGluayA9PT0gJycgJiYgWycnLCAnbyddKSlbMV07XG5cbiAgcmV0dXJuIGNzc1ZlbmRvclByZWZpeCA9ICctJyArIHByZSArICctJztcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJ1aWx0aW5TdHlsZSA9IHJlcXVpcmUoJy4vYnVpbHRpblN0eWxlJyk7XG52YXIgcHJlZml4ZXMgPSBbJ01veicsICdXZWJraXQnLCAnTycsICdtcyddO1xudmFyIGRvbVZlbmRvclByZWZpeDtcblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGdldCB0aGUgcHJvcGVyIHZlbmRvciBwcm9wZXJ0eSBuYW1lLiAodHJhbnNpdGlvbiA9PiBXZWJraXRUcmFuc2l0aW9uKVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihwcm9wLCBpc1N1cHBvcnRUZXN0KSB7XG5cbiAgdmFyIHZlbmRvclByb3A7XG4gIGlmIChwcm9wIGluIGJ1aWx0aW5TdHlsZSkgcmV0dXJuIHByb3A7XG5cbiAgdmFyIFVwcGVyUHJvcCA9IHByb3AuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBwcm9wLnN1YnN0cigxKTtcblxuICBpZiAoZG9tVmVuZG9yUHJlZml4KSB7XG5cbiAgICB2ZW5kb3JQcm9wID0gZG9tVmVuZG9yUHJlZml4ICsgVXBwZXJQcm9wO1xuICAgIGlmICh2ZW5kb3JQcm9wIGluIGJ1aWx0aW5TdHlsZSkge1xuICAgICAgcmV0dXJuIHZlbmRvclByb3A7XG4gICAgfVxuICB9IGVsc2Uge1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcmVmaXhlcy5sZW5ndGg7ICsraSkge1xuICAgICAgdmVuZG9yUHJvcCA9IHByZWZpeGVzW2ldICsgVXBwZXJQcm9wO1xuICAgICAgaWYgKHZlbmRvclByb3AgaW4gYnVpbHRpblN0eWxlKSB7XG4gICAgICAgIGRvbVZlbmRvclByZWZpeCA9IHByZWZpeGVzW2ldO1xuICAgICAgICByZXR1cm4gdmVuZG9yUHJvcDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBpZiBzdXBwb3J0IHRlc3QsIG5vdCBmYWxsYmFjayB0byBvcmlnaW4gcHJvcCBuYW1lXG4gIGlmICghaXNTdXBwb3J0VGVzdCkge1xuICAgIHJldHVybiBwcm9wO1xuICB9XG5cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGluc2VydFJ1bGUgPSByZXF1aXJlKCcuL2luc2VydFJ1bGUnKTtcbnZhciB2ZW5kb3JQcmVmaXggPSByZXF1aXJlKCcuL2dldFZlbmRvclByZWZpeCcpKCk7XG52YXIgaW5kZXggPSAwO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGtleWZyYW1lcykge1xuICAvLyByYW5kb20gbmFtZVxuICB2YXIgbmFtZSA9ICdhbmltXycgKyAoKytpbmRleCkgKyAoK25ldyBEYXRlKTtcbiAgdmFyIGNzcyA9IFwiQFwiICsgdmVuZG9yUHJlZml4ICsgXCJrZXlmcmFtZXMgXCIgKyBuYW1lICsgXCIge1wiO1xuXG4gIGZvciAodmFyIGtleSBpbiBrZXlmcmFtZXMpIHtcbiAgICBjc3MgKz0ga2V5ICsgXCIge1wiO1xuXG4gICAgZm9yICh2YXIgcHJvcGVydHkgaW4ga2V5ZnJhbWVzW2tleV0pIHtcbiAgICAgIHZhciBwYXJ0ID0gXCI6XCIgKyBrZXlmcmFtZXNba2V5XVtwcm9wZXJ0eV0gKyBcIjtcIjtcbiAgICAgIC8vIFdlIGRvIHZlbmRvciBwcmVmaXggZm9yIGV2ZXJ5IHByb3BlcnR5XG4gICAgICBjc3MgKz0gdmVuZG9yUHJlZml4ICsgcHJvcGVydHkgKyBwYXJ0O1xuICAgICAgY3NzICs9IHByb3BlcnR5ICsgcGFydDtcbiAgICB9XG5cbiAgICBjc3MgKz0gXCJ9XCI7XG4gIH1cblxuICBjc3MgKz0gXCJ9XCI7XG5cbiAgaW5zZXJ0UnVsZShjc3MpO1xuXG4gIHJldHVybiBuYW1lXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBleHRyYVNoZWV0O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGNzcykge1xuXG4gIGlmICghZXh0cmFTaGVldCkge1xuICAgIC8vIEZpcnN0IHRpbWUsIGNyZWF0ZSBhbiBleHRyYSBzdHlsZXNoZWV0IGZvciBhZGRpbmcgcnVsZXNcbiAgICBleHRyYVNoZWV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGV4dHJhU2hlZXQpO1xuICAgIC8vIEtlZXAgcmVmZXJlbmNlIHRvIGFjdHVhbCBTdHlsZVNoZWV0IG9iamVjdCAoYHN0eWxlU2hlZXRgIGZvciBJRSA8IDkpXG4gICAgZXh0cmFTaGVldCA9IGV4dHJhU2hlZXQuc2hlZXQgfHwgZXh0cmFTaGVldC5zdHlsZVNoZWV0O1xuICB9XG5cbiAgdmFyIGluZGV4ID0gKGV4dHJhU2hlZXQuY3NzUnVsZXMgfHwgZXh0cmFTaGVldC5ydWxlcykubGVuZ3RoO1xuICBleHRyYVNoZWV0Lmluc2VydFJ1bGUoY3NzLCBpbmRleCk7XG5cbiAgcmV0dXJuIGV4dHJhU2hlZXQ7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogRVZFTlRfTkFNRV9NQVAgaXMgdXNlZCB0byBkZXRlcm1pbmUgd2hpY2ggZXZlbnQgZmlyZWQgd2hlbiBhXG4gKiB0cmFuc2l0aW9uL2FuaW1hdGlvbiBlbmRzLCBiYXNlZCBvbiB0aGUgc3R5bGUgcHJvcGVydHkgdXNlZCB0b1xuICogZGVmaW5lIHRoYXQgZXZlbnQuXG4gKi9cbnZhciBFVkVOVF9OQU1FX01BUCA9IHtcbiAgdHJhbnNpdGlvbmVuZDoge1xuICAgICd0cmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxuICAgICdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnLFxuICAgICdNb3pUcmFuc2l0aW9uJzogJ21velRyYW5zaXRpb25FbmQnLFxuICAgICdPVHJhbnNpdGlvbic6ICdvVHJhbnNpdGlvbkVuZCcsXG4gICAgJ21zVHJhbnNpdGlvbic6ICdNU1RyYW5zaXRpb25FbmQnXG4gIH0sXG5cbiAgYW5pbWF0aW9uZW5kOiB7XG4gICAgJ2FuaW1hdGlvbic6ICdhbmltYXRpb25lbmQnLFxuICAgICdXZWJraXRBbmltYXRpb24nOiAnd2Via2l0QW5pbWF0aW9uRW5kJyxcbiAgICAnTW96QW5pbWF0aW9uJzogJ21vekFuaW1hdGlvbkVuZCcsXG4gICAgJ09BbmltYXRpb24nOiAnb0FuaW1hdGlvbkVuZCcsXG4gICAgJ21zQW5pbWF0aW9uJzogJ01TQW5pbWF0aW9uRW5kJ1xuICB9XG59O1xuXG52YXIgZW5kRXZlbnRzID0gW107XG5cbmZ1bmN0aW9uIGRldGVjdEV2ZW50cygpIHtcbiAgdmFyIHRlc3RFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgc3R5bGUgPSB0ZXN0RWwuc3R5bGU7XG5cbiAgLy8gT24gc29tZSBwbGF0Zm9ybXMsIGluIHBhcnRpY3VsYXIgc29tZSByZWxlYXNlcyBvZiBBbmRyb2lkIDQueCxcbiAgLy8gdGhlIHVuLXByZWZpeGVkIFwiYW5pbWF0aW9uXCIgYW5kIFwidHJhbnNpdGlvblwiIHByb3BlcnRpZXMgYXJlIGRlZmluZWQgb24gdGhlXG4gIC8vIHN0eWxlIG9iamVjdCBidXQgdGhlIGV2ZW50cyB0aGF0IGZpcmUgd2lsbCBzdGlsbCBiZSBwcmVmaXhlZCwgc28gd2UgbmVlZFxuICAvLyB0byBjaGVjayBpZiB0aGUgdW4tcHJlZml4ZWQgZXZlbnRzIGFyZSB1c2VhYmxlLCBhbmQgaWYgbm90IHJlbW92ZSB0aGVtXG4gIC8vIGZyb20gdGhlIG1hcFxuICBpZiAoISgnQW5pbWF0aW9uRXZlbnQnIGluIHdpbmRvdykpIHtcbiAgICBkZWxldGUgRVZFTlRfTkFNRV9NQVAuYW5pbWF0aW9uZW5kLmFuaW1hdGlvbjtcbiAgfVxuXG4gIGlmICghKCdUcmFuc2l0aW9uRXZlbnQnIGluIHdpbmRvdykpIHtcbiAgICBkZWxldGUgRVZFTlRfTkFNRV9NQVAudHJhbnNpdGlvbmVuZC50cmFuc2l0aW9uO1xuICB9XG5cbiAgZm9yICh2YXIgYmFzZUV2ZW50TmFtZSBpbiBFVkVOVF9OQU1FX01BUCkge1xuICAgIHZhciBiYXNlRXZlbnRzID0gRVZFTlRfTkFNRV9NQVBbYmFzZUV2ZW50TmFtZV07XG4gICAgZm9yICh2YXIgc3R5bGVOYW1lIGluIGJhc2VFdmVudHMpIHtcbiAgICAgIGlmIChzdHlsZU5hbWUgaW4gc3R5bGUpIHtcbiAgICAgICAgZW5kRXZlbnRzLnB1c2goYmFzZUV2ZW50c1tzdHlsZU5hbWVdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICBkZXRlY3RFdmVudHMoKTtcbn1cblxuXG4vLyBXZSB1c2UgdGhlIHJhdyB7YWRkfHJlbW92ZX1FdmVudExpc3RlbmVyKCkgY2FsbCBiZWNhdXNlIEV2ZW50TGlzdGVuZXJcbi8vIGRvZXMgbm90IGtub3cgaG93IHRvIHJlbW92ZSBldmVudCBsaXN0ZW5lcnMgYW5kIHdlIHJlYWxseSBzaG91bGRcbi8vIGNsZWFuIHVwLiBBbHNvLCB0aGVzZSBldmVudHMgYXJlIG5vdCB0cmlnZ2VyZWQgaW4gb2xkZXIgYnJvd3NlcnNcbi8vIHNvIHdlIHNob3VsZCBiZSBBLU9LIGhlcmUuXG5cbmZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXIobm9kZSwgZXZlbnROYW1lLCBldmVudExpc3RlbmVyKSB7XG4gIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIsIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlRXZlbnRMaXN0ZW5lcihub2RlLCBldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIpIHtcbiAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYWRkRW5kRXZlbnRMaXN0ZW5lcjogZnVuY3Rpb24obm9kZSwgZXZlbnRMaXN0ZW5lcikge1xuICAgIGlmIChlbmRFdmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAvLyBJZiBDU1MgdHJhbnNpdGlvbnMgYXJlIG5vdCBzdXBwb3J0ZWQsIHRyaWdnZXIgYW4gXCJlbmQgYW5pbWF0aW9uXCJcbiAgICAgIC8vIGV2ZW50IGltbWVkaWF0ZWx5LlxuICAgICAgd2luZG93LnNldFRpbWVvdXQoZXZlbnRMaXN0ZW5lciwgMCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGVuZEV2ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGVuZEV2ZW50KSB7XG4gICAgICBhZGRFdmVudExpc3RlbmVyKG5vZGUsIGVuZEV2ZW50LCBldmVudExpc3RlbmVyKTtcbiAgICB9KTtcbiAgfSxcblxuICByZW1vdmVFbmRFdmVudExpc3RlbmVyOiBmdW5jdGlvbihub2RlLCBldmVudExpc3RlbmVyKSB7XG4gICAgaWYgKGVuZEV2ZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZW5kRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZW5kRXZlbnQpIHtcbiAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIobm9kZSwgZW5kRXZlbnQsIGV2ZW50TGlzdGVuZXIpO1xuICAgIH0pO1xuICB9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogXG4gKi9cblxuZnVuY3Rpb24gbWFrZUVtcHR5RnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFyZztcbiAgfTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGFjY2VwdHMgYW5kIGRpc2NhcmRzIGlucHV0czsgaXQgaGFzIG5vIHNpZGUgZWZmZWN0cy4gVGhpcyBpc1xuICogcHJpbWFyaWx5IHVzZWZ1bCBpZGlvbWF0aWNhbGx5IGZvciBvdmVycmlkYWJsZSBmdW5jdGlvbiBlbmRwb2ludHMgd2hpY2hcbiAqIGFsd2F5cyBuZWVkIHRvIGJlIGNhbGxhYmxlLCBzaW5jZSBKUyBsYWNrcyBhIG51bGwtY2FsbCBpZGlvbSBhbGEgQ29jb2EuXG4gKi9cbnZhciBlbXB0eUZ1bmN0aW9uID0gZnVuY3Rpb24gZW1wdHlGdW5jdGlvbigpIHt9O1xuXG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zID0gbWFrZUVtcHR5RnVuY3Rpb247XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zRmFsc2UgPSBtYWtlRW1wdHlGdW5jdGlvbihmYWxzZSk7XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zVHJ1ZSA9IG1ha2VFbXB0eUZ1bmN0aW9uKHRydWUpO1xuZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc051bGwgPSBtYWtlRW1wdHlGdW5jdGlvbihudWxsKTtcbmVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNUaGlzID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5lbXB0eUZ1bmN0aW9uLnRoYXRSZXR1cm5zQXJndW1lbnQgPSBmdW5jdGlvbiAoYXJnKSB7XG4gIHJldHVybiBhcmc7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGVtcHR5RnVuY3Rpb247IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIFVzZSBpbnZhcmlhbnQoKSB0byBhc3NlcnQgc3RhdGUgd2hpY2ggeW91ciBwcm9ncmFtIGFzc3VtZXMgdG8gYmUgdHJ1ZS5cbiAqXG4gKiBQcm92aWRlIHNwcmludGYtc3R5bGUgZm9ybWF0IChvbmx5ICVzIGlzIHN1cHBvcnRlZCkgYW5kIGFyZ3VtZW50c1xuICogdG8gcHJvdmlkZSBpbmZvcm1hdGlvbiBhYm91dCB3aGF0IGJyb2tlIGFuZCB3aGF0IHlvdSB3ZXJlXG4gKiBleHBlY3RpbmcuXG4gKlxuICogVGhlIGludmFyaWFudCBtZXNzYWdlIHdpbGwgYmUgc3RyaXBwZWQgaW4gcHJvZHVjdGlvbiwgYnV0IHRoZSBpbnZhcmlhbnRcbiAqIHdpbGwgcmVtYWluIHRvIGVuc3VyZSBsb2dpYyBkb2VzIG5vdCBkaWZmZXIgaW4gcHJvZHVjdGlvbi5cbiAqL1xuXG52YXIgdmFsaWRhdGVGb3JtYXQgPSBmdW5jdGlvbiB2YWxpZGF0ZUZvcm1hdChmb3JtYXQpIHt9O1xuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICB2YWxpZGF0ZUZvcm1hdCA9IGZ1bmN0aW9uIHZhbGlkYXRlRm9ybWF0KGZvcm1hdCkge1xuICAgIGlmIChmb3JtYXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdpbnZhcmlhbnQgcmVxdWlyZXMgYW4gZXJyb3IgbWVzc2FnZSBhcmd1bWVudCcpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gaW52YXJpYW50KGNvbmRpdGlvbiwgZm9ybWF0LCBhLCBiLCBjLCBkLCBlLCBmKSB7XG4gIHZhbGlkYXRlRm9ybWF0KGZvcm1hdCk7XG5cbiAgaWYgKCFjb25kaXRpb24pIHtcbiAgICB2YXIgZXJyb3I7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcignTWluaWZpZWQgZXhjZXB0aW9uIG9jY3VycmVkOyB1c2UgdGhlIG5vbi1taW5pZmllZCBkZXYgZW52aXJvbm1lbnQgJyArICdmb3IgdGhlIGZ1bGwgZXJyb3IgbWVzc2FnZSBhbmQgYWRkaXRpb25hbCBoZWxwZnVsIHdhcm5pbmdzLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYXJncyA9IFthLCBiLCBjLCBkLCBlLCBmXTtcbiAgICAgIHZhciBhcmdJbmRleCA9IDA7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcihmb3JtYXQucmVwbGFjZSgvJXMvZywgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYXJnc1thcmdJbmRleCsrXTtcbiAgICAgIH0pKTtcbiAgICAgIGVycm9yLm5hbWUgPSAnSW52YXJpYW50IFZpb2xhdGlvbic7XG4gICAgfVxuXG4gICAgZXJyb3IuZnJhbWVzVG9Qb3AgPSAxOyAvLyB3ZSBkb24ndCBjYXJlIGFib3V0IGludmFyaWFudCdzIG93biBmcmFtZVxuICAgIHRocm93IGVycm9yO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW52YXJpYW50OyIsIi8qKlxuICogQ29weXJpZ2h0IChjKSAyMDE0LXByZXNlbnQsIEZhY2Vib29rLCBJbmMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGVtcHR5RnVuY3Rpb24gPSByZXF1aXJlKCcuL2VtcHR5RnVuY3Rpb24nKTtcblxuLyoqXG4gKiBTaW1pbGFyIHRvIGludmFyaWFudCBidXQgb25seSBsb2dzIGEgd2FybmluZyBpZiB0aGUgY29uZGl0aW9uIGlzIG5vdCBtZXQuXG4gKiBUaGlzIGNhbiBiZSB1c2VkIHRvIGxvZyBpc3N1ZXMgaW4gZGV2ZWxvcG1lbnQgZW52aXJvbm1lbnRzIGluIGNyaXRpY2FsXG4gKiBwYXRocy4gUmVtb3ZpbmcgdGhlIGxvZ2dpbmcgY29kZSBmb3IgcHJvZHVjdGlvbiBlbnZpcm9ubWVudHMgd2lsbCBrZWVwIHRoZVxuICogc2FtZSBsb2dpYyBhbmQgZm9sbG93IHRoZSBzYW1lIGNvZGUgcGF0aHMuXG4gKi9cblxudmFyIHdhcm5pbmcgPSBlbXB0eUZ1bmN0aW9uO1xuXG5pZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICB2YXIgcHJpbnRXYXJuaW5nID0gZnVuY3Rpb24gcHJpbnRXYXJuaW5nKGZvcm1hdCkge1xuICAgIGZvciAodmFyIF9sZW4gPSBhcmd1bWVudHMubGVuZ3RoLCBhcmdzID0gQXJyYXkoX2xlbiA+IDEgPyBfbGVuIC0gMSA6IDApLCBfa2V5ID0gMTsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgICAgYXJnc1tfa2V5IC0gMV0gPSBhcmd1bWVudHNbX2tleV07XG4gICAgfVxuXG4gICAgdmFyIGFyZ0luZGV4ID0gMDtcbiAgICB2YXIgbWVzc2FnZSA9ICdXYXJuaW5nOiAnICsgZm9ybWF0LnJlcGxhY2UoLyVzL2csIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBhcmdzW2FyZ0luZGV4KytdO1xuICAgIH0pO1xuICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IobWVzc2FnZSk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAvLyAtLS0gV2VsY29tZSB0byBkZWJ1Z2dpbmcgUmVhY3QgLS0tXG4gICAgICAvLyBUaGlzIGVycm9yIHdhcyB0aHJvd24gYXMgYSBjb252ZW5pZW5jZSBzbyB0aGF0IHlvdSBjYW4gdXNlIHRoaXMgc3RhY2tcbiAgICAgIC8vIHRvIGZpbmQgdGhlIGNhbGxzaXRlIHRoYXQgY2F1c2VkIHRoaXMgd2FybmluZyB0byBmaXJlLlxuICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgIH0gY2F0Y2ggKHgpIHt9XG4gIH07XG5cbiAgd2FybmluZyA9IGZ1bmN0aW9uIHdhcm5pbmcoY29uZGl0aW9uLCBmb3JtYXQpIHtcbiAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYHdhcm5pbmcoY29uZGl0aW9uLCBmb3JtYXQsIC4uLmFyZ3MpYCByZXF1aXJlcyBhIHdhcm5pbmcgJyArICdtZXNzYWdlIGFyZ3VtZW50Jyk7XG4gICAgfVxuXG4gICAgaWYgKGZvcm1hdC5pbmRleE9mKCdGYWlsZWQgQ29tcG9zaXRlIHByb3BUeXBlOiAnKSA9PT0gMCkge1xuICAgICAgcmV0dXJuOyAvLyBJZ25vcmUgQ29tcG9zaXRlQ29tcG9uZW50IHByb3B0eXBlIGNoZWNrLlxuICAgIH1cblxuICAgIGlmICghY29uZGl0aW9uKSB7XG4gICAgICBmb3IgKHZhciBfbGVuMiA9IGFyZ3VtZW50cy5sZW5ndGgsIGFyZ3MgPSBBcnJheShfbGVuMiA+IDIgPyBfbGVuMiAtIDIgOiAwKSwgX2tleTIgPSAyOyBfa2V5MiA8IF9sZW4yOyBfa2V5MisrKSB7XG4gICAgICAgIGFyZ3NbX2tleTIgLSAyXSA9IGFyZ3VtZW50c1tfa2V5Ml07XG4gICAgICB9XG5cbiAgICAgIHByaW50V2FybmluZy5hcHBseSh1bmRlZmluZWQsIFtmb3JtYXRdLmNvbmNhdChhcmdzKSk7XG4gICAgfVxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdhcm5pbmc7IiwiLypcbm9iamVjdC1hc3NpZ25cbihjKSBTaW5kcmUgU29yaHVzXG5AbGljZW5zZSBNSVRcbiovXG5cbid1c2Ugc3RyaWN0Jztcbi8qIGVzbGludC1kaXNhYmxlIG5vLXVudXNlZC12YXJzICovXG52YXIgZ2V0T3duUHJvcGVydHlTeW1ib2xzID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scztcbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgcHJvcElzRW51bWVyYWJsZSA9IE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbmZ1bmN0aW9uIHRvT2JqZWN0KHZhbCkge1xuXHRpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignT2JqZWN0LmFzc2lnbiBjYW5ub3QgYmUgY2FsbGVkIHdpdGggbnVsbCBvciB1bmRlZmluZWQnKTtcblx0fVxuXG5cdHJldHVybiBPYmplY3QodmFsKTtcbn1cblxuZnVuY3Rpb24gc2hvdWxkVXNlTmF0aXZlKCkge1xuXHR0cnkge1xuXHRcdGlmICghT2JqZWN0LmFzc2lnbikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIERldGVjdCBidWdneSBwcm9wZXJ0eSBlbnVtZXJhdGlvbiBvcmRlciBpbiBvbGRlciBWOCB2ZXJzaW9ucy5cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTQxMThcblx0XHR2YXIgdGVzdDEgPSBuZXcgU3RyaW5nKCdhYmMnKTsgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3LXdyYXBwZXJzXG5cdFx0dGVzdDFbNV0gPSAnZGUnO1xuXHRcdGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MSlbMF0gPT09ICc1Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDIgPSB7fTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IDEwOyBpKyspIHtcblx0XHRcdHRlc3QyWydfJyArIFN0cmluZy5mcm9tQ2hhckNvZGUoaSldID0gaTtcblx0XHR9XG5cdFx0dmFyIG9yZGVyMiA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QyKS5tYXAoZnVuY3Rpb24gKG4pIHtcblx0XHRcdHJldHVybiB0ZXN0MltuXTtcblx0XHR9KTtcblx0XHRpZiAob3JkZXIyLmpvaW4oJycpICE9PSAnMDEyMzQ1Njc4OScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QzID0ge307XG5cdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jy5zcGxpdCgnJykuZm9yRWFjaChmdW5jdGlvbiAobGV0dGVyKSB7XG5cdFx0XHR0ZXN0M1tsZXR0ZXJdID0gbGV0dGVyO1xuXHRcdH0pO1xuXHRcdGlmIChPYmplY3Qua2V5cyhPYmplY3QuYXNzaWduKHt9LCB0ZXN0MykpLmpvaW4oJycpICE9PVxuXHRcdFx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGVycikge1xuXHRcdC8vIFdlIGRvbid0IGV4cGVjdCBhbnkgb2YgdGhlIGFib3ZlIHRvIHRocm93LCBidXQgYmV0dGVyIHRvIGJlIHNhZmUuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2hvdWxkVXNlTmF0aXZlKCkgPyBPYmplY3QuYXNzaWduIDogZnVuY3Rpb24gKHRhcmdldCwgc291cmNlKSB7XG5cdHZhciBmcm9tO1xuXHR2YXIgdG8gPSB0b09iamVjdCh0YXJnZXQpO1xuXHR2YXIgc3ltYm9scztcblxuXHRmb3IgKHZhciBzID0gMTsgcyA8IGFyZ3VtZW50cy5sZW5ndGg7IHMrKykge1xuXHRcdGZyb20gPSBPYmplY3QoYXJndW1lbnRzW3NdKTtcblxuXHRcdGZvciAodmFyIGtleSBpbiBmcm9tKSB7XG5cdFx0XHRpZiAoaGFzT3duUHJvcGVydHkuY2FsbChmcm9tLCBrZXkpKSB7XG5cdFx0XHRcdHRvW2tleV0gPSBmcm9tW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGdldE93blByb3BlcnR5U3ltYm9scykge1xuXHRcdFx0c3ltYm9scyA9IGdldE93blByb3BlcnR5U3ltYm9scyhmcm9tKTtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgc3ltYm9scy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZiAocHJvcElzRW51bWVyYWJsZS5jYWxsKGZyb20sIHN5bWJvbHNbaV0pKSB7XG5cdFx0XHRcdFx0dG9bc3ltYm9sc1tpXV0gPSBmcm9tW3N5bWJvbHNbaV1dO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHRvO1xufTtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgdmFyIGludmFyaWFudCA9IHJlcXVpcmUoJ2ZianMvbGliL2ludmFyaWFudCcpO1xuICB2YXIgd2FybmluZyA9IHJlcXVpcmUoJ2ZianMvbGliL3dhcm5pbmcnKTtcbiAgdmFyIFJlYWN0UHJvcFR5cGVzU2VjcmV0ID0gcmVxdWlyZSgnLi9saWIvUmVhY3RQcm9wVHlwZXNTZWNyZXQnKTtcbiAgdmFyIGxvZ2dlZFR5cGVGYWlsdXJlcyA9IHt9O1xufVxuXG4vKipcbiAqIEFzc2VydCB0aGF0IHRoZSB2YWx1ZXMgbWF0Y2ggd2l0aCB0aGUgdHlwZSBzcGVjcy5cbiAqIEVycm9yIG1lc3NhZ2VzIGFyZSBtZW1vcml6ZWQgYW5kIHdpbGwgb25seSBiZSBzaG93biBvbmNlLlxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSB0eXBlU3BlY3MgTWFwIG9mIG5hbWUgdG8gYSBSZWFjdFByb3BUeXBlXG4gKiBAcGFyYW0ge29iamVjdH0gdmFsdWVzIFJ1bnRpbWUgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSB0eXBlLWNoZWNrZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBsb2NhdGlvbiBlLmcuIFwicHJvcFwiLCBcImNvbnRleHRcIiwgXCJjaGlsZCBjb250ZXh0XCJcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb21wb25lbnROYW1lIE5hbWUgb2YgdGhlIGNvbXBvbmVudCBmb3IgZXJyb3IgbWVzc2FnZXMuXG4gKiBAcGFyYW0gez9GdW5jdGlvbn0gZ2V0U3RhY2sgUmV0dXJucyB0aGUgY29tcG9uZW50IHN0YWNrLlxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gY2hlY2tQcm9wVHlwZXModHlwZVNwZWNzLCB2YWx1ZXMsIGxvY2F0aW9uLCBjb21wb25lbnROYW1lLCBnZXRTdGFjaykge1xuICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJykge1xuICAgIGZvciAodmFyIHR5cGVTcGVjTmFtZSBpbiB0eXBlU3BlY3MpIHtcbiAgICAgIGlmICh0eXBlU3BlY3MuaGFzT3duUHJvcGVydHkodHlwZVNwZWNOYW1lKSkge1xuICAgICAgICB2YXIgZXJyb3I7XG4gICAgICAgIC8vIFByb3AgdHlwZSB2YWxpZGF0aW9uIG1heSB0aHJvdy4gSW4gY2FzZSB0aGV5IGRvLCB3ZSBkb24ndCB3YW50IHRvXG4gICAgICAgIC8vIGZhaWwgdGhlIHJlbmRlciBwaGFzZSB3aGVyZSBpdCBkaWRuJ3QgZmFpbCBiZWZvcmUuIFNvIHdlIGxvZyBpdC5cbiAgICAgICAgLy8gQWZ0ZXIgdGhlc2UgaGF2ZSBiZWVuIGNsZWFuZWQgdXAsIHdlJ2xsIGxldCB0aGVtIHRocm93LlxuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIFRoaXMgaXMgaW50ZW50aW9uYWxseSBhbiBpbnZhcmlhbnQgdGhhdCBnZXRzIGNhdWdodC4gSXQncyB0aGUgc2FtZVxuICAgICAgICAgIC8vIGJlaGF2aW9yIGFzIHdpdGhvdXQgdGhpcyBzdGF0ZW1lbnQgZXhjZXB0IHdpdGggYSBiZXR0ZXIgbWVzc2FnZS5cbiAgICAgICAgICBpbnZhcmlhbnQodHlwZW9mIHR5cGVTcGVjc1t0eXBlU3BlY05hbWVdID09PSAnZnVuY3Rpb24nLCAnJXM6ICVzIHR5cGUgYCVzYCBpcyBpbnZhbGlkOyBpdCBtdXN0IGJlIGEgZnVuY3Rpb24sIHVzdWFsbHkgZnJvbSAnICsgJ3RoZSBgcHJvcC10eXBlc2AgcGFja2FnZSwgYnV0IHJlY2VpdmVkIGAlc2AuJywgY29tcG9uZW50TmFtZSB8fCAnUmVhY3QgY2xhc3MnLCBsb2NhdGlvbiwgdHlwZVNwZWNOYW1lLCB0eXBlb2YgdHlwZVNwZWNzW3R5cGVTcGVjTmFtZV0pO1xuICAgICAgICAgIGVycm9yID0gdHlwZVNwZWNzW3R5cGVTcGVjTmFtZV0odmFsdWVzLCB0eXBlU3BlY05hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBudWxsLCBSZWFjdFByb3BUeXBlc1NlY3JldCk7XG4gICAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgICAgZXJyb3IgPSBleDtcbiAgICAgICAgfVxuICAgICAgICB3YXJuaW5nKCFlcnJvciB8fCBlcnJvciBpbnN0YW5jZW9mIEVycm9yLCAnJXM6IHR5cGUgc3BlY2lmaWNhdGlvbiBvZiAlcyBgJXNgIGlzIGludmFsaWQ7IHRoZSB0eXBlIGNoZWNrZXIgJyArICdmdW5jdGlvbiBtdXN0IHJldHVybiBgbnVsbGAgb3IgYW4gYEVycm9yYCBidXQgcmV0dXJuZWQgYSAlcy4gJyArICdZb3UgbWF5IGhhdmUgZm9yZ290dGVuIHRvIHBhc3MgYW4gYXJndW1lbnQgdG8gdGhlIHR5cGUgY2hlY2tlciAnICsgJ2NyZWF0b3IgKGFycmF5T2YsIGluc3RhbmNlT2YsIG9iamVjdE9mLCBvbmVPZiwgb25lT2ZUeXBlLCBhbmQgJyArICdzaGFwZSBhbGwgcmVxdWlyZSBhbiBhcmd1bWVudCkuJywgY29tcG9uZW50TmFtZSB8fCAnUmVhY3QgY2xhc3MnLCBsb2NhdGlvbiwgdHlwZVNwZWNOYW1lLCB0eXBlb2YgZXJyb3IpO1xuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiAhKGVycm9yLm1lc3NhZ2UgaW4gbG9nZ2VkVHlwZUZhaWx1cmVzKSkge1xuICAgICAgICAgIC8vIE9ubHkgbW9uaXRvciB0aGlzIGZhaWx1cmUgb25jZSBiZWNhdXNlIHRoZXJlIHRlbmRzIHRvIGJlIGEgbG90IG9mIHRoZVxuICAgICAgICAgIC8vIHNhbWUgZXJyb3IuXG4gICAgICAgICAgbG9nZ2VkVHlwZUZhaWx1cmVzW2Vycm9yLm1lc3NhZ2VdID0gdHJ1ZTtcblxuICAgICAgICAgIHZhciBzdGFjayA9IGdldFN0YWNrID8gZ2V0U3RhY2soKSA6ICcnO1xuXG4gICAgICAgICAgd2FybmluZyhmYWxzZSwgJ0ZhaWxlZCAlcyB0eXBlOiAlcyVzJywgbG9jYXRpb24sIGVycm9yLm1lc3NhZ2UsIHN0YWNrICE9IG51bGwgPyBzdGFjayA6ICcnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNoZWNrUHJvcFR5cGVzO1xuIiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtcHJlc2VudCwgRmFjZWJvb2ssIEluYy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBlbXB0eUZ1bmN0aW9uID0gcmVxdWlyZSgnZmJqcy9saWIvZW1wdHlGdW5jdGlvbicpO1xudmFyIGludmFyaWFudCA9IHJlcXVpcmUoJ2ZianMvbGliL2ludmFyaWFudCcpO1xudmFyIFJlYWN0UHJvcFR5cGVzU2VjcmV0ID0gcmVxdWlyZSgnLi9saWIvUmVhY3RQcm9wVHlwZXNTZWNyZXQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcbiAgZnVuY3Rpb24gc2hpbShwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUsIHNlY3JldCkge1xuICAgIGlmIChzZWNyZXQgPT09IFJlYWN0UHJvcFR5cGVzU2VjcmV0KSB7XG4gICAgICAvLyBJdCBpcyBzdGlsbCBzYWZlIHdoZW4gY2FsbGVkIGZyb20gUmVhY3QuXG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGludmFyaWFudChcbiAgICAgIGZhbHNlLFxuICAgICAgJ0NhbGxpbmcgUHJvcFR5cGVzIHZhbGlkYXRvcnMgZGlyZWN0bHkgaXMgbm90IHN1cHBvcnRlZCBieSB0aGUgYHByb3AtdHlwZXNgIHBhY2thZ2UuICcgK1xuICAgICAgJ1VzZSBQcm9wVHlwZXMuY2hlY2tQcm9wVHlwZXMoKSB0byBjYWxsIHRoZW0uICcgK1xuICAgICAgJ1JlYWQgbW9yZSBhdCBodHRwOi8vZmIubWUvdXNlLWNoZWNrLXByb3AtdHlwZXMnXG4gICAgKTtcbiAgfTtcbiAgc2hpbS5pc1JlcXVpcmVkID0gc2hpbTtcbiAgZnVuY3Rpb24gZ2V0U2hpbSgpIHtcbiAgICByZXR1cm4gc2hpbTtcbiAgfTtcbiAgLy8gSW1wb3J0YW50IVxuICAvLyBLZWVwIHRoaXMgbGlzdCBpbiBzeW5jIHdpdGggcHJvZHVjdGlvbiB2ZXJzaW9uIGluIGAuL2ZhY3RvcnlXaXRoVHlwZUNoZWNrZXJzLmpzYC5cbiAgdmFyIFJlYWN0UHJvcFR5cGVzID0ge1xuICAgIGFycmF5OiBzaGltLFxuICAgIGJvb2w6IHNoaW0sXG4gICAgZnVuYzogc2hpbSxcbiAgICBudW1iZXI6IHNoaW0sXG4gICAgb2JqZWN0OiBzaGltLFxuICAgIHN0cmluZzogc2hpbSxcbiAgICBzeW1ib2w6IHNoaW0sXG5cbiAgICBhbnk6IHNoaW0sXG4gICAgYXJyYXlPZjogZ2V0U2hpbSxcbiAgICBlbGVtZW50OiBzaGltLFxuICAgIGluc3RhbmNlT2Y6IGdldFNoaW0sXG4gICAgbm9kZTogc2hpbSxcbiAgICBvYmplY3RPZjogZ2V0U2hpbSxcbiAgICBvbmVPZjogZ2V0U2hpbSxcbiAgICBvbmVPZlR5cGU6IGdldFNoaW0sXG4gICAgc2hhcGU6IGdldFNoaW0sXG4gICAgZXhhY3Q6IGdldFNoaW1cbiAgfTtcblxuICBSZWFjdFByb3BUeXBlcy5jaGVja1Byb3BUeXBlcyA9IGVtcHR5RnVuY3Rpb247XG4gIFJlYWN0UHJvcFR5cGVzLlByb3BUeXBlcyA9IFJlYWN0UHJvcFR5cGVzO1xuXG4gIHJldHVybiBSZWFjdFByb3BUeXBlcztcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGVtcHR5RnVuY3Rpb24gPSByZXF1aXJlKCdmYmpzL2xpYi9lbXB0eUZ1bmN0aW9uJyk7XG52YXIgaW52YXJpYW50ID0gcmVxdWlyZSgnZmJqcy9saWIvaW52YXJpYW50Jyk7XG52YXIgd2FybmluZyA9IHJlcXVpcmUoJ2ZianMvbGliL3dhcm5pbmcnKTtcbnZhciBhc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbnZhciBSZWFjdFByb3BUeXBlc1NlY3JldCA9IHJlcXVpcmUoJy4vbGliL1JlYWN0UHJvcFR5cGVzU2VjcmV0Jyk7XG52YXIgY2hlY2tQcm9wVHlwZXMgPSByZXF1aXJlKCcuL2NoZWNrUHJvcFR5cGVzJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaXNWYWxpZEVsZW1lbnQsIHRocm93T25EaXJlY3RBY2Nlc3MpIHtcbiAgLyogZ2xvYmFsIFN5bWJvbCAqL1xuICB2YXIgSVRFUkFUT1JfU1lNQk9MID0gdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiBTeW1ib2wuaXRlcmF0b3I7XG4gIHZhciBGQVVYX0lURVJBVE9SX1NZTUJPTCA9ICdAQGl0ZXJhdG9yJzsgLy8gQmVmb3JlIFN5bWJvbCBzcGVjLlxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBpdGVyYXRvciBtZXRob2QgZnVuY3Rpb24gY29udGFpbmVkIG9uIHRoZSBpdGVyYWJsZSBvYmplY3QuXG4gICAqXG4gICAqIEJlIHN1cmUgdG8gaW52b2tlIHRoZSBmdW5jdGlvbiB3aXRoIHRoZSBpdGVyYWJsZSBhcyBjb250ZXh0OlxuICAgKlxuICAgKiAgICAgdmFyIGl0ZXJhdG9yRm4gPSBnZXRJdGVyYXRvckZuKG15SXRlcmFibGUpO1xuICAgKiAgICAgaWYgKGl0ZXJhdG9yRm4pIHtcbiAgICogICAgICAgdmFyIGl0ZXJhdG9yID0gaXRlcmF0b3JGbi5jYWxsKG15SXRlcmFibGUpO1xuICAgKiAgICAgICAuLi5cbiAgICogICAgIH1cbiAgICpcbiAgICogQHBhcmFtIHs/b2JqZWN0fSBtYXliZUl0ZXJhYmxlXG4gICAqIEByZXR1cm4gez9mdW5jdGlvbn1cbiAgICovXG4gIGZ1bmN0aW9uIGdldEl0ZXJhdG9yRm4obWF5YmVJdGVyYWJsZSkge1xuICAgIHZhciBpdGVyYXRvckZuID0gbWF5YmVJdGVyYWJsZSAmJiAoSVRFUkFUT1JfU1lNQk9MICYmIG1heWJlSXRlcmFibGVbSVRFUkFUT1JfU1lNQk9MXSB8fCBtYXliZUl0ZXJhYmxlW0ZBVVhfSVRFUkFUT1JfU1lNQk9MXSk7XG4gICAgaWYgKHR5cGVvZiBpdGVyYXRvckZuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gaXRlcmF0b3JGbjtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29sbGVjdGlvbiBvZiBtZXRob2RzIHRoYXQgYWxsb3cgZGVjbGFyYXRpb24gYW5kIHZhbGlkYXRpb24gb2YgcHJvcHMgdGhhdCBhcmVcbiAgICogc3VwcGxpZWQgdG8gUmVhY3QgY29tcG9uZW50cy4gRXhhbXBsZSB1c2FnZTpcbiAgICpcbiAgICogICB2YXIgUHJvcHMgPSByZXF1aXJlKCdSZWFjdFByb3BUeXBlcycpO1xuICAgKiAgIHZhciBNeUFydGljbGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAqICAgICBwcm9wVHlwZXM6IHtcbiAgICogICAgICAgLy8gQW4gb3B0aW9uYWwgc3RyaW5nIHByb3AgbmFtZWQgXCJkZXNjcmlwdGlvblwiLlxuICAgKiAgICAgICBkZXNjcmlwdGlvbjogUHJvcHMuc3RyaW5nLFxuICAgKlxuICAgKiAgICAgICAvLyBBIHJlcXVpcmVkIGVudW0gcHJvcCBuYW1lZCBcImNhdGVnb3J5XCIuXG4gICAqICAgICAgIGNhdGVnb3J5OiBQcm9wcy5vbmVPZihbJ05ld3MnLCdQaG90b3MnXSkuaXNSZXF1aXJlZCxcbiAgICpcbiAgICogICAgICAgLy8gQSBwcm9wIG5hbWVkIFwiZGlhbG9nXCIgdGhhdCByZXF1aXJlcyBhbiBpbnN0YW5jZSBvZiBEaWFsb2cuXG4gICAqICAgICAgIGRpYWxvZzogUHJvcHMuaW5zdGFuY2VPZihEaWFsb2cpLmlzUmVxdWlyZWRcbiAgICogICAgIH0sXG4gICAqICAgICByZW5kZXI6IGZ1bmN0aW9uKCkgeyAuLi4gfVxuICAgKiAgIH0pO1xuICAgKlxuICAgKiBBIG1vcmUgZm9ybWFsIHNwZWNpZmljYXRpb24gb2YgaG93IHRoZXNlIG1ldGhvZHMgYXJlIHVzZWQ6XG4gICAqXG4gICAqICAgdHlwZSA6PSBhcnJheXxib29sfGZ1bmN8b2JqZWN0fG51bWJlcnxzdHJpbmd8b25lT2YoWy4uLl0pfGluc3RhbmNlT2YoLi4uKVxuICAgKiAgIGRlY2wgOj0gUmVhY3RQcm9wVHlwZXMue3R5cGV9KC5pc1JlcXVpcmVkKT9cbiAgICpcbiAgICogRWFjaCBhbmQgZXZlcnkgZGVjbGFyYXRpb24gcHJvZHVjZXMgYSBmdW5jdGlvbiB3aXRoIHRoZSBzYW1lIHNpZ25hdHVyZS4gVGhpc1xuICAgKiBhbGxvd3MgdGhlIGNyZWF0aW9uIG9mIGN1c3RvbSB2YWxpZGF0aW9uIGZ1bmN0aW9ucy4gRm9yIGV4YW1wbGU6XG4gICAqXG4gICAqICB2YXIgTXlMaW5rID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICAgKiAgICBwcm9wVHlwZXM6IHtcbiAgICogICAgICAvLyBBbiBvcHRpb25hbCBzdHJpbmcgb3IgVVJJIHByb3AgbmFtZWQgXCJocmVmXCIuXG4gICAqICAgICAgaHJlZjogZnVuY3Rpb24ocHJvcHMsIHByb3BOYW1lLCBjb21wb25lbnROYW1lKSB7XG4gICAqICAgICAgICB2YXIgcHJvcFZhbHVlID0gcHJvcHNbcHJvcE5hbWVdO1xuICAgKiAgICAgICAgaWYgKHByb3BWYWx1ZSAhPSBudWxsICYmIHR5cGVvZiBwcm9wVmFsdWUgIT09ICdzdHJpbmcnICYmXG4gICAqICAgICAgICAgICAgIShwcm9wVmFsdWUgaW5zdGFuY2VvZiBVUkkpKSB7XG4gICAqICAgICAgICAgIHJldHVybiBuZXcgRXJyb3IoXG4gICAqICAgICAgICAgICAgJ0V4cGVjdGVkIGEgc3RyaW5nIG9yIGFuIFVSSSBmb3IgJyArIHByb3BOYW1lICsgJyBpbiAnICtcbiAgICogICAgICAgICAgICBjb21wb25lbnROYW1lXG4gICAqICAgICAgICAgICk7XG4gICAqICAgICAgICB9XG4gICAqICAgICAgfVxuICAgKiAgICB9LFxuICAgKiAgICByZW5kZXI6IGZ1bmN0aW9uKCkgey4uLn1cbiAgICogIH0pO1xuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG5cbiAgdmFyIEFOT05ZTU9VUyA9ICc8PGFub255bW91cz4+JztcblxuICAvLyBJbXBvcnRhbnQhXG4gIC8vIEtlZXAgdGhpcyBsaXN0IGluIHN5bmMgd2l0aCBwcm9kdWN0aW9uIHZlcnNpb24gaW4gYC4vZmFjdG9yeVdpdGhUaHJvd2luZ1NoaW1zLmpzYC5cbiAgdmFyIFJlYWN0UHJvcFR5cGVzID0ge1xuICAgIGFycmF5OiBjcmVhdGVQcmltaXRpdmVUeXBlQ2hlY2tlcignYXJyYXknKSxcbiAgICBib29sOiBjcmVhdGVQcmltaXRpdmVUeXBlQ2hlY2tlcignYm9vbGVhbicpLFxuICAgIGZ1bmM6IGNyZWF0ZVByaW1pdGl2ZVR5cGVDaGVja2VyKCdmdW5jdGlvbicpLFxuICAgIG51bWJlcjogY3JlYXRlUHJpbWl0aXZlVHlwZUNoZWNrZXIoJ251bWJlcicpLFxuICAgIG9iamVjdDogY3JlYXRlUHJpbWl0aXZlVHlwZUNoZWNrZXIoJ29iamVjdCcpLFxuICAgIHN0cmluZzogY3JlYXRlUHJpbWl0aXZlVHlwZUNoZWNrZXIoJ3N0cmluZycpLFxuICAgIHN5bWJvbDogY3JlYXRlUHJpbWl0aXZlVHlwZUNoZWNrZXIoJ3N5bWJvbCcpLFxuXG4gICAgYW55OiBjcmVhdGVBbnlUeXBlQ2hlY2tlcigpLFxuICAgIGFycmF5T2Y6IGNyZWF0ZUFycmF5T2ZUeXBlQ2hlY2tlcixcbiAgICBlbGVtZW50OiBjcmVhdGVFbGVtZW50VHlwZUNoZWNrZXIoKSxcbiAgICBpbnN0YW5jZU9mOiBjcmVhdGVJbnN0YW5jZVR5cGVDaGVja2VyLFxuICAgIG5vZGU6IGNyZWF0ZU5vZGVDaGVja2VyKCksXG4gICAgb2JqZWN0T2Y6IGNyZWF0ZU9iamVjdE9mVHlwZUNoZWNrZXIsXG4gICAgb25lT2Y6IGNyZWF0ZUVudW1UeXBlQ2hlY2tlcixcbiAgICBvbmVPZlR5cGU6IGNyZWF0ZVVuaW9uVHlwZUNoZWNrZXIsXG4gICAgc2hhcGU6IGNyZWF0ZVNoYXBlVHlwZUNoZWNrZXIsXG4gICAgZXhhY3Q6IGNyZWF0ZVN0cmljdFNoYXBlVHlwZUNoZWNrZXIsXG4gIH07XG5cbiAgLyoqXG4gICAqIGlubGluZWQgT2JqZWN0LmlzIHBvbHlmaWxsIHRvIGF2b2lkIHJlcXVpcmluZyBjb25zdW1lcnMgc2hpcCB0aGVpciBvd25cbiAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvT2JqZWN0L2lzXG4gICAqL1xuICAvKmVzbGludC1kaXNhYmxlIG5vLXNlbGYtY29tcGFyZSovXG4gIGZ1bmN0aW9uIGlzKHgsIHkpIHtcbiAgICAvLyBTYW1lVmFsdWUgYWxnb3JpdGhtXG4gICAgaWYgKHggPT09IHkpIHtcbiAgICAgIC8vIFN0ZXBzIDEtNSwgNy0xMFxuICAgICAgLy8gU3RlcHMgNi5iLTYuZTogKzAgIT0gLTBcbiAgICAgIHJldHVybiB4ICE9PSAwIHx8IDEgLyB4ID09PSAxIC8geTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU3RlcCA2LmE6IE5hTiA9PSBOYU5cbiAgICAgIHJldHVybiB4ICE9PSB4ICYmIHkgIT09IHk7XG4gICAgfVxuICB9XG4gIC8qZXNsaW50LWVuYWJsZSBuby1zZWxmLWNvbXBhcmUqL1xuXG4gIC8qKlxuICAgKiBXZSB1c2UgYW4gRXJyb3ItbGlrZSBvYmplY3QgZm9yIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgYXMgcGVvcGxlIG1heSBjYWxsXG4gICAqIFByb3BUeXBlcyBkaXJlY3RseSBhbmQgaW5zcGVjdCB0aGVpciBvdXRwdXQuIEhvd2V2ZXIsIHdlIGRvbid0IHVzZSByZWFsXG4gICAqIEVycm9ycyBhbnltb3JlLiBXZSBkb24ndCBpbnNwZWN0IHRoZWlyIHN0YWNrIGFueXdheSwgYW5kIGNyZWF0aW5nIHRoZW1cbiAgICogaXMgcHJvaGliaXRpdmVseSBleHBlbnNpdmUgaWYgdGhleSBhcmUgY3JlYXRlZCB0b28gb2Z0ZW4sIHN1Y2ggYXMgd2hhdFxuICAgKiBoYXBwZW5zIGluIG9uZU9mVHlwZSgpIGZvciBhbnkgdHlwZSBiZWZvcmUgdGhlIG9uZSB0aGF0IG1hdGNoZWQuXG4gICAqL1xuICBmdW5jdGlvbiBQcm9wVHlwZUVycm9yKG1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIHRoaXMuc3RhY2sgPSAnJztcbiAgfVxuICAvLyBNYWtlIGBpbnN0YW5jZW9mIEVycm9yYCBzdGlsbCB3b3JrIGZvciByZXR1cm5lZCBlcnJvcnMuXG4gIFByb3BUeXBlRXJyb3IucHJvdG90eXBlID0gRXJyb3IucHJvdG90eXBlO1xuXG4gIGZ1bmN0aW9uIGNyZWF0ZUNoYWluYWJsZVR5cGVDaGVja2VyKHZhbGlkYXRlKSB7XG4gICAgaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIHtcbiAgICAgIHZhciBtYW51YWxQcm9wVHlwZUNhbGxDYWNoZSA9IHt9O1xuICAgICAgdmFyIG1hbnVhbFByb3BUeXBlV2FybmluZ0NvdW50ID0gMDtcbiAgICB9XG4gICAgZnVuY3Rpb24gY2hlY2tUeXBlKGlzUmVxdWlyZWQsIHByb3BzLCBwcm9wTmFtZSwgY29tcG9uZW50TmFtZSwgbG9jYXRpb24sIHByb3BGdWxsTmFtZSwgc2VjcmV0KSB7XG4gICAgICBjb21wb25lbnROYW1lID0gY29tcG9uZW50TmFtZSB8fCBBTk9OWU1PVVM7XG4gICAgICBwcm9wRnVsbE5hbWUgPSBwcm9wRnVsbE5hbWUgfHwgcHJvcE5hbWU7XG5cbiAgICAgIGlmIChzZWNyZXQgIT09IFJlYWN0UHJvcFR5cGVzU2VjcmV0KSB7XG4gICAgICAgIGlmICh0aHJvd09uRGlyZWN0QWNjZXNzKSB7XG4gICAgICAgICAgLy8gTmV3IGJlaGF2aW9yIG9ubHkgZm9yIHVzZXJzIG9mIGBwcm9wLXR5cGVzYCBwYWNrYWdlXG4gICAgICAgICAgaW52YXJpYW50KFxuICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAnQ2FsbGluZyBQcm9wVHlwZXMgdmFsaWRhdG9ycyBkaXJlY3RseSBpcyBub3Qgc3VwcG9ydGVkIGJ5IHRoZSBgcHJvcC10eXBlc2AgcGFja2FnZS4gJyArXG4gICAgICAgICAgICAnVXNlIGBQcm9wVHlwZXMuY2hlY2tQcm9wVHlwZXMoKWAgdG8gY2FsbCB0aGVtLiAnICtcbiAgICAgICAgICAgICdSZWFkIG1vcmUgYXQgaHR0cDovL2ZiLm1lL3VzZS1jaGVjay1wcm9wLXR5cGVzJ1xuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyAmJiB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAvLyBPbGQgYmVoYXZpb3IgZm9yIHBlb3BsZSB1c2luZyBSZWFjdC5Qcm9wVHlwZXNcbiAgICAgICAgICB2YXIgY2FjaGVLZXkgPSBjb21wb25lbnROYW1lICsgJzonICsgcHJvcE5hbWU7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgIW1hbnVhbFByb3BUeXBlQ2FsbENhY2hlW2NhY2hlS2V5XSAmJlxuICAgICAgICAgICAgLy8gQXZvaWQgc3BhbW1pbmcgdGhlIGNvbnNvbGUgYmVjYXVzZSB0aGV5IGFyZSBvZnRlbiBub3QgYWN0aW9uYWJsZSBleGNlcHQgZm9yIGxpYiBhdXRob3JzXG4gICAgICAgICAgICBtYW51YWxQcm9wVHlwZVdhcm5pbmdDb3VudCA8IDNcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHdhcm5pbmcoXG4gICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAnWW91IGFyZSBtYW51YWxseSBjYWxsaW5nIGEgUmVhY3QuUHJvcFR5cGVzIHZhbGlkYXRpb24gJyArXG4gICAgICAgICAgICAgICdmdW5jdGlvbiBmb3IgdGhlIGAlc2AgcHJvcCBvbiBgJXNgLiBUaGlzIGlzIGRlcHJlY2F0ZWQgJyArXG4gICAgICAgICAgICAgICdhbmQgd2lsbCB0aHJvdyBpbiB0aGUgc3RhbmRhbG9uZSBgcHJvcC10eXBlc2AgcGFja2FnZS4gJyArXG4gICAgICAgICAgICAgICdZb3UgbWF5IGJlIHNlZWluZyB0aGlzIHdhcm5pbmcgZHVlIHRvIGEgdGhpcmQtcGFydHkgUHJvcFR5cGVzICcgK1xuICAgICAgICAgICAgICAnbGlicmFyeS4gU2VlIGh0dHBzOi8vZmIubWUvcmVhY3Qtd2FybmluZy1kb250LWNhbGwtcHJvcHR5cGVzICcgKyAnZm9yIGRldGFpbHMuJyxcbiAgICAgICAgICAgICAgcHJvcEZ1bGxOYW1lLFxuICAgICAgICAgICAgICBjb21wb25lbnROYW1lXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgbWFudWFsUHJvcFR5cGVDYWxsQ2FjaGVbY2FjaGVLZXldID0gdHJ1ZTtcbiAgICAgICAgICAgIG1hbnVhbFByb3BUeXBlV2FybmluZ0NvdW50Kys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocHJvcHNbcHJvcE5hbWVdID09IG51bGwpIHtcbiAgICAgICAgaWYgKGlzUmVxdWlyZWQpIHtcbiAgICAgICAgICBpZiAocHJvcHNbcHJvcE5hbWVdID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb3BUeXBlRXJyb3IoJ1RoZSAnICsgbG9jYXRpb24gKyAnIGAnICsgcHJvcEZ1bGxOYW1lICsgJ2AgaXMgbWFya2VkIGFzIHJlcXVpcmVkICcgKyAoJ2luIGAnICsgY29tcG9uZW50TmFtZSArICdgLCBidXQgaXRzIHZhbHVlIGlzIGBudWxsYC4nKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXcgUHJvcFR5cGVFcnJvcignVGhlICcgKyBsb2NhdGlvbiArICcgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBpcyBtYXJrZWQgYXMgcmVxdWlyZWQgaW4gJyArICgnYCcgKyBjb21wb25lbnROYW1lICsgJ2AsIGJ1dCBpdHMgdmFsdWUgaXMgYHVuZGVmaW5lZGAuJykpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZhbGlkYXRlKHByb3BzLCBwcm9wTmFtZSwgY29tcG9uZW50TmFtZSwgbG9jYXRpb24sIHByb3BGdWxsTmFtZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIGNoYWluZWRDaGVja1R5cGUgPSBjaGVja1R5cGUuYmluZChudWxsLCBmYWxzZSk7XG4gICAgY2hhaW5lZENoZWNrVHlwZS5pc1JlcXVpcmVkID0gY2hlY2tUeXBlLmJpbmQobnVsbCwgdHJ1ZSk7XG5cbiAgICByZXR1cm4gY2hhaW5lZENoZWNrVHlwZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVByaW1pdGl2ZVR5cGVDaGVja2VyKGV4cGVjdGVkVHlwZSkge1xuICAgIGZ1bmN0aW9uIHZhbGlkYXRlKHByb3BzLCBwcm9wTmFtZSwgY29tcG9uZW50TmFtZSwgbG9jYXRpb24sIHByb3BGdWxsTmFtZSwgc2VjcmV0KSB7XG4gICAgICB2YXIgcHJvcFZhbHVlID0gcHJvcHNbcHJvcE5hbWVdO1xuICAgICAgdmFyIHByb3BUeXBlID0gZ2V0UHJvcFR5cGUocHJvcFZhbHVlKTtcbiAgICAgIGlmIChwcm9wVHlwZSAhPT0gZXhwZWN0ZWRUeXBlKSB7XG4gICAgICAgIC8vIGBwcm9wVmFsdWVgIGJlaW5nIGluc3RhbmNlIG9mLCBzYXksIGRhdGUvcmVnZXhwLCBwYXNzIHRoZSAnb2JqZWN0J1xuICAgICAgICAvLyBjaGVjaywgYnV0IHdlIGNhbiBvZmZlciBhIG1vcmUgcHJlY2lzZSBlcnJvciBtZXNzYWdlIGhlcmUgcmF0aGVyIHRoYW5cbiAgICAgICAgLy8gJ29mIHR5cGUgYG9iamVjdGAnLlxuICAgICAgICB2YXIgcHJlY2lzZVR5cGUgPSBnZXRQcmVjaXNlVHlwZShwcm9wVmFsdWUpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvcFR5cGVFcnJvcignSW52YWxpZCAnICsgbG9jYXRpb24gKyAnIGAnICsgcHJvcEZ1bGxOYW1lICsgJ2Agb2YgdHlwZSAnICsgKCdgJyArIHByZWNpc2VUeXBlICsgJ2Agc3VwcGxpZWQgdG8gYCcgKyBjb21wb25lbnROYW1lICsgJ2AsIGV4cGVjdGVkICcpICsgKCdgJyArIGV4cGVjdGVkVHlwZSArICdgLicpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlQ2hhaW5hYmxlVHlwZUNoZWNrZXIodmFsaWRhdGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlQW55VHlwZUNoZWNrZXIoKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUNoYWluYWJsZVR5cGVDaGVja2VyKGVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNOdWxsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUFycmF5T2ZUeXBlQ2hlY2tlcih0eXBlQ2hlY2tlcikge1xuICAgIGZ1bmN0aW9uIHZhbGlkYXRlKHByb3BzLCBwcm9wTmFtZSwgY29tcG9uZW50TmFtZSwgbG9jYXRpb24sIHByb3BGdWxsTmFtZSkge1xuICAgICAgaWYgKHR5cGVvZiB0eXBlQ2hlY2tlciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gbmV3IFByb3BUeXBlRXJyb3IoJ1Byb3BlcnR5IGAnICsgcHJvcEZ1bGxOYW1lICsgJ2Agb2YgY29tcG9uZW50IGAnICsgY29tcG9uZW50TmFtZSArICdgIGhhcyBpbnZhbGlkIFByb3BUeXBlIG5vdGF0aW9uIGluc2lkZSBhcnJheU9mLicpO1xuICAgICAgfVxuICAgICAgdmFyIHByb3BWYWx1ZSA9IHByb3BzW3Byb3BOYW1lXTtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShwcm9wVmFsdWUpKSB7XG4gICAgICAgIHZhciBwcm9wVHlwZSA9IGdldFByb3BUeXBlKHByb3BWYWx1ZSk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvcFR5cGVFcnJvcignSW52YWxpZCAnICsgbG9jYXRpb24gKyAnIGAnICsgcHJvcEZ1bGxOYW1lICsgJ2Agb2YgdHlwZSAnICsgKCdgJyArIHByb3BUeXBlICsgJ2Agc3VwcGxpZWQgdG8gYCcgKyBjb21wb25lbnROYW1lICsgJ2AsIGV4cGVjdGVkIGFuIGFycmF5LicpKTtcbiAgICAgIH1cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHJvcFZhbHVlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBlcnJvciA9IHR5cGVDaGVja2VyKHByb3BWYWx1ZSwgaSwgY29tcG9uZW50TmFtZSwgbG9jYXRpb24sIHByb3BGdWxsTmFtZSArICdbJyArIGkgKyAnXScsIFJlYWN0UHJvcFR5cGVzU2VjcmV0KTtcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlQ2hhaW5hYmxlVHlwZUNoZWNrZXIodmFsaWRhdGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlRWxlbWVudFR5cGVDaGVja2VyKCkge1xuICAgIGZ1bmN0aW9uIHZhbGlkYXRlKHByb3BzLCBwcm9wTmFtZSwgY29tcG9uZW50TmFtZSwgbG9jYXRpb24sIHByb3BGdWxsTmFtZSkge1xuICAgICAgdmFyIHByb3BWYWx1ZSA9IHByb3BzW3Byb3BOYW1lXTtcbiAgICAgIGlmICghaXNWYWxpZEVsZW1lbnQocHJvcFZhbHVlKSkge1xuICAgICAgICB2YXIgcHJvcFR5cGUgPSBnZXRQcm9wVHlwZShwcm9wVmFsdWUpO1xuICAgICAgICByZXR1cm4gbmV3IFByb3BUeXBlRXJyb3IoJ0ludmFsaWQgJyArIGxvY2F0aW9uICsgJyBgJyArIHByb3BGdWxsTmFtZSArICdgIG9mIHR5cGUgJyArICgnYCcgKyBwcm9wVHlwZSArICdgIHN1cHBsaWVkIHRvIGAnICsgY29tcG9uZW50TmFtZSArICdgLCBleHBlY3RlZCBhIHNpbmdsZSBSZWFjdEVsZW1lbnQuJykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVDaGFpbmFibGVUeXBlQ2hlY2tlcih2YWxpZGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVJbnN0YW5jZVR5cGVDaGVja2VyKGV4cGVjdGVkQ2xhc3MpIHtcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZShwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUpIHtcbiAgICAgIGlmICghKHByb3BzW3Byb3BOYW1lXSBpbnN0YW5jZW9mIGV4cGVjdGVkQ2xhc3MpKSB7XG4gICAgICAgIHZhciBleHBlY3RlZENsYXNzTmFtZSA9IGV4cGVjdGVkQ2xhc3MubmFtZSB8fCBBTk9OWU1PVVM7XG4gICAgICAgIHZhciBhY3R1YWxDbGFzc05hbWUgPSBnZXRDbGFzc05hbWUocHJvcHNbcHJvcE5hbWVdKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKCdJbnZhbGlkICcgKyBsb2NhdGlvbiArICcgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBvZiB0eXBlICcgKyAoJ2AnICsgYWN0dWFsQ2xhc3NOYW1lICsgJ2Agc3VwcGxpZWQgdG8gYCcgKyBjb21wb25lbnROYW1lICsgJ2AsIGV4cGVjdGVkICcpICsgKCdpbnN0YW5jZSBvZiBgJyArIGV4cGVjdGVkQ2xhc3NOYW1lICsgJ2AuJykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVDaGFpbmFibGVUeXBlQ2hlY2tlcih2YWxpZGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVFbnVtVHlwZUNoZWNrZXIoZXhwZWN0ZWRWYWx1ZXMpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoZXhwZWN0ZWRWYWx1ZXMpKSB7XG4gICAgICBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gd2FybmluZyhmYWxzZSwgJ0ludmFsaWQgYXJndW1lbnQgc3VwcGxpZWQgdG8gb25lT2YsIGV4cGVjdGVkIGFuIGluc3RhbmNlIG9mIGFycmF5LicpIDogdm9pZCAwO1xuICAgICAgcmV0dXJuIGVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNOdWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHZhbGlkYXRlKHByb3BzLCBwcm9wTmFtZSwgY29tcG9uZW50TmFtZSwgbG9jYXRpb24sIHByb3BGdWxsTmFtZSkge1xuICAgICAgdmFyIHByb3BWYWx1ZSA9IHByb3BzW3Byb3BOYW1lXTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXhwZWN0ZWRWYWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGlzKHByb3BWYWx1ZSwgZXhwZWN0ZWRWYWx1ZXNbaV0pKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIHZhbHVlc1N0cmluZyA9IEpTT04uc3RyaW5naWZ5KGV4cGVjdGVkVmFsdWVzKTtcbiAgICAgIHJldHVybiBuZXcgUHJvcFR5cGVFcnJvcignSW52YWxpZCAnICsgbG9jYXRpb24gKyAnIGAnICsgcHJvcEZ1bGxOYW1lICsgJ2Agb2YgdmFsdWUgYCcgKyBwcm9wVmFsdWUgKyAnYCAnICsgKCdzdXBwbGllZCB0byBgJyArIGNvbXBvbmVudE5hbWUgKyAnYCwgZXhwZWN0ZWQgb25lIG9mICcgKyB2YWx1ZXNTdHJpbmcgKyAnLicpKTtcbiAgICB9XG4gICAgcmV0dXJuIGNyZWF0ZUNoYWluYWJsZVR5cGVDaGVja2VyKHZhbGlkYXRlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZU9iamVjdE9mVHlwZUNoZWNrZXIodHlwZUNoZWNrZXIpIHtcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZShwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUpIHtcbiAgICAgIGlmICh0eXBlb2YgdHlwZUNoZWNrZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKCdQcm9wZXJ0eSBgJyArIHByb3BGdWxsTmFtZSArICdgIG9mIGNvbXBvbmVudCBgJyArIGNvbXBvbmVudE5hbWUgKyAnYCBoYXMgaW52YWxpZCBQcm9wVHlwZSBub3RhdGlvbiBpbnNpZGUgb2JqZWN0T2YuJyk7XG4gICAgICB9XG4gICAgICB2YXIgcHJvcFZhbHVlID0gcHJvcHNbcHJvcE5hbWVdO1xuICAgICAgdmFyIHByb3BUeXBlID0gZ2V0UHJvcFR5cGUocHJvcFZhbHVlKTtcbiAgICAgIGlmIChwcm9wVHlwZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKCdJbnZhbGlkICcgKyBsb2NhdGlvbiArICcgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBvZiB0eXBlICcgKyAoJ2AnICsgcHJvcFR5cGUgKyAnYCBzdXBwbGllZCB0byBgJyArIGNvbXBvbmVudE5hbWUgKyAnYCwgZXhwZWN0ZWQgYW4gb2JqZWN0LicpKTtcbiAgICAgIH1cbiAgICAgIGZvciAodmFyIGtleSBpbiBwcm9wVmFsdWUpIHtcbiAgICAgICAgaWYgKHByb3BWYWx1ZS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgdmFyIGVycm9yID0gdHlwZUNoZWNrZXIocHJvcFZhbHVlLCBrZXksIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUgKyAnLicgKyBrZXksIFJlYWN0UHJvcFR5cGVzU2VjcmV0KTtcbiAgICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVDaGFpbmFibGVUeXBlQ2hlY2tlcih2YWxpZGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVVbmlvblR5cGVDaGVja2VyKGFycmF5T2ZUeXBlQ2hlY2tlcnMpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoYXJyYXlPZlR5cGVDaGVja2VycykpIHtcbiAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicgPyB3YXJuaW5nKGZhbHNlLCAnSW52YWxpZCBhcmd1bWVudCBzdXBwbGllZCB0byBvbmVPZlR5cGUsIGV4cGVjdGVkIGFuIGluc3RhbmNlIG9mIGFycmF5LicpIDogdm9pZCAwO1xuICAgICAgcmV0dXJuIGVtcHR5RnVuY3Rpb24udGhhdFJldHVybnNOdWxsO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXlPZlR5cGVDaGVja2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGNoZWNrZXIgPSBhcnJheU9mVHlwZUNoZWNrZXJzW2ldO1xuICAgICAgaWYgKHR5cGVvZiBjaGVja2VyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHdhcm5pbmcoXG4gICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgJ0ludmFsaWQgYXJndW1lbnQgc3VwcGxpZWQgdG8gb25lT2ZUeXBlLiBFeHBlY3RlZCBhbiBhcnJheSBvZiBjaGVjayBmdW5jdGlvbnMsIGJ1dCAnICtcbiAgICAgICAgICAncmVjZWl2ZWQgJXMgYXQgaW5kZXggJXMuJyxcbiAgICAgICAgICBnZXRQb3N0Zml4Rm9yVHlwZVdhcm5pbmcoY2hlY2tlciksXG4gICAgICAgICAgaVxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gZW1wdHlGdW5jdGlvbi50aGF0UmV0dXJuc051bGw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdmFsaWRhdGUocHJvcHMsIHByb3BOYW1lLCBjb21wb25lbnROYW1lLCBsb2NhdGlvbiwgcHJvcEZ1bGxOYW1lKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5T2ZUeXBlQ2hlY2tlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoZWNrZXIgPSBhcnJheU9mVHlwZUNoZWNrZXJzW2ldO1xuICAgICAgICBpZiAoY2hlY2tlcihwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUsIFJlYWN0UHJvcFR5cGVzU2VjcmV0KSA9PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKCdJbnZhbGlkICcgKyBsb2NhdGlvbiArICcgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBzdXBwbGllZCB0byAnICsgKCdgJyArIGNvbXBvbmVudE5hbWUgKyAnYC4nKSk7XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVDaGFpbmFibGVUeXBlQ2hlY2tlcih2YWxpZGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVOb2RlQ2hlY2tlcigpIHtcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZShwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUpIHtcbiAgICAgIGlmICghaXNOb2RlKHByb3BzW3Byb3BOYW1lXSkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKCdJbnZhbGlkICcgKyBsb2NhdGlvbiArICcgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBzdXBwbGllZCB0byAnICsgKCdgJyArIGNvbXBvbmVudE5hbWUgKyAnYCwgZXhwZWN0ZWQgYSBSZWFjdE5vZGUuJykpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBjcmVhdGVDaGFpbmFibGVUeXBlQ2hlY2tlcih2YWxpZGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBjcmVhdGVTaGFwZVR5cGVDaGVja2VyKHNoYXBlVHlwZXMpIHtcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZShwcm9wcywgcHJvcE5hbWUsIGNvbXBvbmVudE5hbWUsIGxvY2F0aW9uLCBwcm9wRnVsbE5hbWUpIHtcbiAgICAgIHZhciBwcm9wVmFsdWUgPSBwcm9wc1twcm9wTmFtZV07XG4gICAgICB2YXIgcHJvcFR5cGUgPSBnZXRQcm9wVHlwZShwcm9wVmFsdWUpO1xuICAgICAgaWYgKHByb3BUeXBlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gbmV3IFByb3BUeXBlRXJyb3IoJ0ludmFsaWQgJyArIGxvY2F0aW9uICsgJyBgJyArIHByb3BGdWxsTmFtZSArICdgIG9mIHR5cGUgYCcgKyBwcm9wVHlwZSArICdgICcgKyAoJ3N1cHBsaWVkIHRvIGAnICsgY29tcG9uZW50TmFtZSArICdgLCBleHBlY3RlZCBgb2JqZWN0YC4nKSk7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBrZXkgaW4gc2hhcGVUeXBlcykge1xuICAgICAgICB2YXIgY2hlY2tlciA9IHNoYXBlVHlwZXNba2V5XTtcbiAgICAgICAgaWYgKCFjaGVja2VyKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVycm9yID0gY2hlY2tlcihwcm9wVmFsdWUsIGtleSwgY29tcG9uZW50TmFtZSwgbG9jYXRpb24sIHByb3BGdWxsTmFtZSArICcuJyArIGtleSwgUmVhY3RQcm9wVHlwZXNTZWNyZXQpO1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlQ2hhaW5hYmxlVHlwZUNoZWNrZXIodmFsaWRhdGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlU3RyaWN0U2hhcGVUeXBlQ2hlY2tlcihzaGFwZVR5cGVzKSB7XG4gICAgZnVuY3Rpb24gdmFsaWRhdGUocHJvcHMsIHByb3BOYW1lLCBjb21wb25lbnROYW1lLCBsb2NhdGlvbiwgcHJvcEZ1bGxOYW1lKSB7XG4gICAgICB2YXIgcHJvcFZhbHVlID0gcHJvcHNbcHJvcE5hbWVdO1xuICAgICAgdmFyIHByb3BUeXBlID0gZ2V0UHJvcFR5cGUocHJvcFZhbHVlKTtcbiAgICAgIGlmIChwcm9wVHlwZSAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKCdJbnZhbGlkICcgKyBsb2NhdGlvbiArICcgYCcgKyBwcm9wRnVsbE5hbWUgKyAnYCBvZiB0eXBlIGAnICsgcHJvcFR5cGUgKyAnYCAnICsgKCdzdXBwbGllZCB0byBgJyArIGNvbXBvbmVudE5hbWUgKyAnYCwgZXhwZWN0ZWQgYG9iamVjdGAuJykpO1xuICAgICAgfVxuICAgICAgLy8gV2UgbmVlZCB0byBjaGVjayBhbGwga2V5cyBpbiBjYXNlIHNvbWUgYXJlIHJlcXVpcmVkIGJ1dCBtaXNzaW5nIGZyb21cbiAgICAgIC8vIHByb3BzLlxuICAgICAgdmFyIGFsbEtleXMgPSBhc3NpZ24oe30sIHByb3BzW3Byb3BOYW1lXSwgc2hhcGVUeXBlcyk7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gYWxsS2V5cykge1xuICAgICAgICB2YXIgY2hlY2tlciA9IHNoYXBlVHlwZXNba2V5XTtcbiAgICAgICAgaWYgKCFjaGVja2VyKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9wVHlwZUVycm9yKFxuICAgICAgICAgICAgJ0ludmFsaWQgJyArIGxvY2F0aW9uICsgJyBgJyArIHByb3BGdWxsTmFtZSArICdgIGtleSBgJyArIGtleSArICdgIHN1cHBsaWVkIHRvIGAnICsgY29tcG9uZW50TmFtZSArICdgLicgK1xuICAgICAgICAgICAgJ1xcbkJhZCBvYmplY3Q6ICcgKyBKU09OLnN0cmluZ2lmeShwcm9wc1twcm9wTmFtZV0sIG51bGwsICcgICcpICtcbiAgICAgICAgICAgICdcXG5WYWxpZCBrZXlzOiAnICsgIEpTT04uc3RyaW5naWZ5KE9iamVjdC5rZXlzKHNoYXBlVHlwZXMpLCBudWxsLCAnICAnKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVycm9yID0gY2hlY2tlcihwcm9wVmFsdWUsIGtleSwgY29tcG9uZW50TmFtZSwgbG9jYXRpb24sIHByb3BGdWxsTmFtZSArICcuJyArIGtleSwgUmVhY3RQcm9wVHlwZXNTZWNyZXQpO1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBjcmVhdGVDaGFpbmFibGVUeXBlQ2hlY2tlcih2YWxpZGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBpc05vZGUocHJvcFZhbHVlKSB7XG4gICAgc3dpdGNoICh0eXBlb2YgcHJvcFZhbHVlKSB7XG4gICAgICBjYXNlICdudW1iZXInOlxuICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgIGNhc2UgJ3VuZGVmaW5lZCc6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIHJldHVybiAhcHJvcFZhbHVlO1xuICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkocHJvcFZhbHVlKSkge1xuICAgICAgICAgIHJldHVybiBwcm9wVmFsdWUuZXZlcnkoaXNOb2RlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJvcFZhbHVlID09PSBudWxsIHx8IGlzVmFsaWRFbGVtZW50KHByb3BWYWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpdGVyYXRvckZuID0gZ2V0SXRlcmF0b3JGbihwcm9wVmFsdWUpO1xuICAgICAgICBpZiAoaXRlcmF0b3JGbikge1xuICAgICAgICAgIHZhciBpdGVyYXRvciA9IGl0ZXJhdG9yRm4uY2FsbChwcm9wVmFsdWUpO1xuICAgICAgICAgIHZhciBzdGVwO1xuICAgICAgICAgIGlmIChpdGVyYXRvckZuICE9PSBwcm9wVmFsdWUuZW50cmllcykge1xuICAgICAgICAgICAgd2hpbGUgKCEoc3RlcCA9IGl0ZXJhdG9yLm5leHQoKSkuZG9uZSkge1xuICAgICAgICAgICAgICBpZiAoIWlzTm9kZShzdGVwLnZhbHVlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBJdGVyYXRvciB3aWxsIHByb3ZpZGUgZW50cnkgW2ssdl0gdHVwbGVzIHJhdGhlciB0aGFuIHZhbHVlcy5cbiAgICAgICAgICAgIHdoaWxlICghKHN0ZXAgPSBpdGVyYXRvci5uZXh0KCkpLmRvbmUpIHtcbiAgICAgICAgICAgICAgdmFyIGVudHJ5ID0gc3RlcC52YWx1ZTtcbiAgICAgICAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgICAgICAgaWYgKCFpc05vZGUoZW50cnlbMV0pKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlzU3ltYm9sKHByb3BUeXBlLCBwcm9wVmFsdWUpIHtcbiAgICAvLyBOYXRpdmUgU3ltYm9sLlxuICAgIGlmIChwcm9wVHlwZSA9PT0gJ3N5bWJvbCcpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIDE5LjQuMy41IFN5bWJvbC5wcm90b3R5cGVbQEB0b1N0cmluZ1RhZ10gPT09ICdTeW1ib2wnXG4gICAgaWYgKHByb3BWYWx1ZVsnQEB0b1N0cmluZ1RhZyddID09PSAnU3ltYm9sJykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gRmFsbGJhY2sgZm9yIG5vbi1zcGVjIGNvbXBsaWFudCBTeW1ib2xzIHdoaWNoIGFyZSBwb2x5ZmlsbGVkLlxuICAgIGlmICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIHByb3BWYWx1ZSBpbnN0YW5jZW9mIFN5bWJvbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gRXF1aXZhbGVudCBvZiBgdHlwZW9mYCBidXQgd2l0aCBzcGVjaWFsIGhhbmRsaW5nIGZvciBhcnJheSBhbmQgcmVnZXhwLlxuICBmdW5jdGlvbiBnZXRQcm9wVHlwZShwcm9wVmFsdWUpIHtcbiAgICB2YXIgcHJvcFR5cGUgPSB0eXBlb2YgcHJvcFZhbHVlO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHByb3BWYWx1ZSkpIHtcbiAgICAgIHJldHVybiAnYXJyYXknO1xuICAgIH1cbiAgICBpZiAocHJvcFZhbHVlIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgICAvLyBPbGQgd2Via2l0cyAoYXQgbGVhc3QgdW50aWwgQW5kcm9pZCA0LjApIHJldHVybiAnZnVuY3Rpb24nIHJhdGhlciB0aGFuXG4gICAgICAvLyAnb2JqZWN0JyBmb3IgdHlwZW9mIGEgUmVnRXhwLiBXZSdsbCBub3JtYWxpemUgdGhpcyBoZXJlIHNvIHRoYXQgL2JsYS9cbiAgICAgIC8vIHBhc3NlcyBQcm9wVHlwZXMub2JqZWN0LlxuICAgICAgcmV0dXJuICdvYmplY3QnO1xuICAgIH1cbiAgICBpZiAoaXNTeW1ib2wocHJvcFR5cGUsIHByb3BWYWx1ZSkpIHtcbiAgICAgIHJldHVybiAnc3ltYm9sJztcbiAgICB9XG4gICAgcmV0dXJuIHByb3BUeXBlO1xuICB9XG5cbiAgLy8gVGhpcyBoYW5kbGVzIG1vcmUgdHlwZXMgdGhhbiBgZ2V0UHJvcFR5cGVgLiBPbmx5IHVzZWQgZm9yIGVycm9yIG1lc3NhZ2VzLlxuICAvLyBTZWUgYGNyZWF0ZVByaW1pdGl2ZVR5cGVDaGVja2VyYC5cbiAgZnVuY3Rpb24gZ2V0UHJlY2lzZVR5cGUocHJvcFZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiBwcm9wVmFsdWUgPT09ICd1bmRlZmluZWQnIHx8IHByb3BWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuICcnICsgcHJvcFZhbHVlO1xuICAgIH1cbiAgICB2YXIgcHJvcFR5cGUgPSBnZXRQcm9wVHlwZShwcm9wVmFsdWUpO1xuICAgIGlmIChwcm9wVHlwZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGlmIChwcm9wVmFsdWUgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICAgIHJldHVybiAnZGF0ZSc7XG4gICAgICB9IGVsc2UgaWYgKHByb3BWYWx1ZSBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgICAgICByZXR1cm4gJ3JlZ2V4cCc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcm9wVHlwZTtcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBzdHJpbmcgdGhhdCBpcyBwb3N0Zml4ZWQgdG8gYSB3YXJuaW5nIGFib3V0IGFuIGludmFsaWQgdHlwZS5cbiAgLy8gRm9yIGV4YW1wbGUsIFwidW5kZWZpbmVkXCIgb3IgXCJvZiB0eXBlIGFycmF5XCJcbiAgZnVuY3Rpb24gZ2V0UG9zdGZpeEZvclR5cGVXYXJuaW5nKHZhbHVlKSB7XG4gICAgdmFyIHR5cGUgPSBnZXRQcmVjaXNlVHlwZSh2YWx1ZSk7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlICdhcnJheSc6XG4gICAgICBjYXNlICdvYmplY3QnOlxuICAgICAgICByZXR1cm4gJ2FuICcgKyB0eXBlO1xuICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICBjYXNlICdkYXRlJzpcbiAgICAgIGNhc2UgJ3JlZ2V4cCc6XG4gICAgICAgIHJldHVybiAnYSAnICsgdHlwZTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB0eXBlO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJldHVybnMgY2xhc3MgbmFtZSBvZiB0aGUgb2JqZWN0LCBpZiBhbnkuXG4gIGZ1bmN0aW9uIGdldENsYXNzTmFtZShwcm9wVmFsdWUpIHtcbiAgICBpZiAoIXByb3BWYWx1ZS5jb25zdHJ1Y3RvciB8fCAhcHJvcFZhbHVlLmNvbnN0cnVjdG9yLm5hbWUpIHtcbiAgICAgIHJldHVybiBBTk9OWU1PVVM7XG4gICAgfVxuICAgIHJldHVybiBwcm9wVmFsdWUuY29uc3RydWN0b3IubmFtZTtcbiAgfVxuXG4gIFJlYWN0UHJvcFR5cGVzLmNoZWNrUHJvcFR5cGVzID0gY2hlY2tQcm9wVHlwZXM7XG4gIFJlYWN0UHJvcFR5cGVzLlByb3BUeXBlcyA9IFJlYWN0UHJvcFR5cGVzO1xuXG4gIHJldHVybiBSZWFjdFByb3BUeXBlcztcbn07XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gIHZhciBSRUFDVF9FTEVNRU5UX1RZUEUgPSAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIFN5bWJvbC5mb3IgJiZcbiAgICBTeW1ib2wuZm9yKCdyZWFjdC5lbGVtZW50JykpIHx8XG4gICAgMHhlYWM3O1xuXG4gIHZhciBpc1ZhbGlkRWxlbWVudCA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICAgIHJldHVybiB0eXBlb2Ygb2JqZWN0ID09PSAnb2JqZWN0JyAmJlxuICAgICAgb2JqZWN0ICE9PSBudWxsICYmXG4gICAgICBvYmplY3QuJCR0eXBlb2YgPT09IFJFQUNUX0VMRU1FTlRfVFlQRTtcbiAgfTtcblxuICAvLyBCeSBleHBsaWNpdGx5IHVzaW5nIGBwcm9wLXR5cGVzYCB5b3UgYXJlIG9wdGluZyBpbnRvIG5ldyBkZXZlbG9wbWVudCBiZWhhdmlvci5cbiAgLy8gaHR0cDovL2ZiLm1lL3Byb3AtdHlwZXMtaW4tcHJvZFxuICB2YXIgdGhyb3dPbkRpcmVjdEFjY2VzcyA9IHRydWU7XG4gIG1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9mYWN0b3J5V2l0aFR5cGVDaGVja2VycycpKGlzVmFsaWRFbGVtZW50LCB0aHJvd09uRGlyZWN0QWNjZXNzKTtcbn0gZWxzZSB7XG4gIC8vIEJ5IGV4cGxpY2l0bHkgdXNpbmcgYHByb3AtdHlwZXNgIHlvdSBhcmUgb3B0aW5nIGludG8gbmV3IHByb2R1Y3Rpb24gYmVoYXZpb3IuXG4gIC8vIGh0dHA6Ly9mYi5tZS9wcm9wLXR5cGVzLWluLXByb2RcbiAgbW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2ZhY3RvcnlXaXRoVGhyb3dpbmdTaGltcycpKCk7XG59XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxMy1wcmVzZW50LCBGYWNlYm9vaywgSW5jLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFJlYWN0UHJvcFR5cGVzU2VjcmV0ID0gJ1NFQ1JFVF9ET19OT1RfUEFTU19USElTX09SX1lPVV9XSUxMX0JFX0ZJUkVEJztcblxubW9kdWxlLmV4cG9ydHMgPSBSZWFjdFByb3BUeXBlc1NlY3JldDtcbiIsInZhciBtb2RhbEZhY3RvcnkgPSByZXF1aXJlKCcuL21vZGFsRmFjdG9yeScpO1xudmFyIGluc2VydEtleWZyYW1lc1J1bGUgPSByZXF1aXJlKCdkb21raXQvaW5zZXJ0S2V5ZnJhbWVzUnVsZScpO1xudmFyIGFwcGVuZFZlbmRvclByZWZpeCA9IHJlcXVpcmUoJ2RvbWtpdC9hcHBlbmRWZW5kb3JQcmVmaXgnKTtcblxudmFyIGFuaW1hdGlvbiA9IHtcbiAgICBzaG93OiB7XG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAnMC40cycsXG4gICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAnY3ViaWMtYmV6aWVyKDAuNywwLDAuMywxKSdcbiAgICB9LFxuXG4gICAgaGlkZToge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuNHMnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2N1YmljLWJlemllcigwLjcsMCwwLjMsMSknXG4gICAgfSxcblxuICAgIHNob3dNb2RhbEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUoLTUwJSwgLTMwMHB4KSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlKC01MCUsIC01MCUpJ1xuICAgICAgICB9XG4gICAgfSksXG5cbiAgICBoaWRlTW9kYWxBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlKC01MCUsIC01MCUpJ1xuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUoLTUwJSwgMTAwcHgpJ1xuICAgICAgICB9XG4gICAgfSksXG5cbiAgICBzaG93QmFja2Ryb3BBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH0sXG4gICAgICAgICcxMDAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMC45XG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pLFxuXG4gICAgc2hvd0NvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlKDAsIC0yMHB4KSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlKDAsIDApJ1xuICAgICAgICB9XG4gICAgfSksXG5cbiAgICBoaWRlQ29udGVudEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUoMCwgMCknXG4gICAgICAgIH0sXG4gICAgICAgICcxMDAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZSgwLCA1MHB4KSdcbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG52YXIgc2hvd0FuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93O1xudmFyIGhpZGVBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZTtcbnZhciBzaG93TW9kYWxBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd01vZGFsQW5pbWF0aW9uO1xudmFyIGhpZGVNb2RhbEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlTW9kYWxBbmltYXRpb247XG52YXIgc2hvd0JhY2tkcm9wQW5pbWF0aW9uID0gYW5pbWF0aW9uLnNob3dCYWNrZHJvcEFuaW1hdGlvbjtcbnZhciBoaWRlQmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZUJhY2tkcm9wQW5pbWF0aW9uO1xudmFyIHNob3dDb250ZW50QW5pbWF0aW9uID0gYW5pbWF0aW9uLnNob3dDb250ZW50QW5pbWF0aW9uO1xudmFyIGhpZGVDb250ZW50QW5pbWF0aW9uID0gYW5pbWF0aW9uLmhpZGVDb250ZW50QW5pbWF0aW9uO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1vZGFsRmFjdG9yeSh7XG4gICAgZ2V0UmVmOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiAnbW9kYWwnO1xuICAgIH0sXG4gICAgZ2V0TW9kYWxTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB3aWR0aDogXCI1MDBweFwiLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZSgtNTAlLCAtNTAlKVwiLFxuICAgICAgICAgICAgdG9wOiBcIjUwJVwiLFxuICAgICAgICAgICAgbGVmdDogXCI1MCVcIixcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgekluZGV4OiAxMDUwLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZU1vZGFsQW5pbWF0aW9uIDogc2hvd01vZGFsQW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBnZXRCYWNrZHJvcFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgIHpJbmRleDogMTA0MCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjMzczQTQ3XCIsXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogKHdpbGxIaWRkZW4gPyBoaWRlQW5pbWF0aW9uIDogc2hvd0FuaW1hdGlvbikuYW5pbWF0aW9uRHVyYXRpb24sXG4gICAgICAgICAgICBhbmltYXRpb25GaWxsTW9kZTogJ2ZvcndhcmRzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbk5hbWU6IHdpbGxIaWRkZW4gPyBoaWRlQmFja2Ryb3BBbmltYXRpb24gOiBzaG93QmFja2Ryb3BBbmltYXRpb24sXG4gICAgICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogKHdpbGxIaWRkZW4gPyBoaWRlQW5pbWF0aW9uIDogc2hvd0FuaW1hdGlvbikuYW5pbWF0aW9uVGltaW5nRnVuY3Rpb25cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBnZXRDb250ZW50U3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25EZWxheTogJzAuMjVzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbk5hbWU6IHNob3dDb250ZW50QW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pXG4gICAgfVxufSk7XG4iLCJ2YXIgbW9kYWxGYWN0b3J5ID0gcmVxdWlyZSgnLi9tb2RhbEZhY3RvcnknKTtcbnZhciBpbnNlcnRLZXlmcmFtZXNSdWxlID0gcmVxdWlyZSgnZG9ta2l0L2luc2VydEtleWZyYW1lc1J1bGUnKTtcbnZhciBhcHBlbmRWZW5kb3JQcmVmaXggPSByZXF1aXJlKCdkb21raXQvYXBwZW5kVmVuZG9yUHJlZml4Jyk7XG5cbnZhciBhbmltYXRpb24gPSB7XG4gICAgc2hvdzoge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuM3MnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2Vhc2Utb3V0J1xuICAgIH0sXG4gICAgaGlkZToge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuM3MnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2Vhc2Utb3V0J1xuICAgIH0sXG4gICAgc2hvd0NvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH0sXG4gICAgICAgICcxMDAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMVxuICAgICAgICB9XG4gICAgfSksXG5cbiAgICBoaWRlQ29udGVudEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDFcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIHNob3dCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLjlcbiAgICAgICAgfSxcbiAgICB9KSxcblxuICAgIGhpZGVCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG52YXIgc2hvd0FuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93O1xudmFyIGhpZGVBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZTtcbnZhciBzaG93Q29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93Q29udGVudEFuaW1hdGlvbjtcbnZhciBoaWRlQ29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQ29udGVudEFuaW1hdGlvbjtcbnZhciBzaG93QmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0JhY2tkcm9wQW5pbWF0aW9uO1xudmFyIGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQmFja2Ryb3BBbmltYXRpb247XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kYWxGYWN0b3J5KHtcbiAgICBnZXRSZWY6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuICdjb250ZW50JztcbiAgICB9LFxuICAgIGdldE1vZGFsU3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICB6SW5kZXg6IDEwNTAsXG4gICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgICAgICAgd2lkdGg6IFwiNTAwcHhcIixcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUzZCgtNTAlLCAtNTAlLCAwKVwiLFxuICAgICAgICAgICAgdG9wOiBcIjUwJVwiLFxuICAgICAgICAgICAgbGVmdDogXCI1MCVcIlxuICAgICAgICB9KVxuICAgIH0sXG4gICAgZ2V0QmFja2Ryb3BTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICB6SW5kZXg6IDEwNDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiIzM3M0E0N1wiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuM3MnLFxuICAgICAgICAgICAgYW5pbWF0aW9uTmFtZTogd2lsbEhpZGRlbiA/IGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA6IHNob3dCYWNrZHJvcEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldENvbnRlbnRTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIG1hcmdpbjogMCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUNvbnRlbnRBbmltYXRpb24gOiBzaG93Q29udGVudEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KVxuICAgIH1cbn0pO1xuIiwidmFyIG1vZGFsRmFjdG9yeSA9IHJlcXVpcmUoJy4vbW9kYWxGYWN0b3J5Jyk7XG52YXIgaW5zZXJ0S2V5ZnJhbWVzUnVsZSA9IHJlcXVpcmUoJ2RvbWtpdC9pbnNlcnRLZXlmcmFtZXNSdWxlJyk7XG52YXIgYXBwZW5kVmVuZG9yUHJlZml4ID0gcmVxdWlyZSgnZG9ta2l0L2FwcGVuZFZlbmRvclByZWZpeCcpO1xuXG52YXIgYW5pbWF0aW9uID0ge1xuICAgIHNob3c6IHtcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICcwLjVzJyxcbiAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICdlYXNlLW91dCdcbiAgICB9LFxuICAgIGhpZGU6IHtcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICcwLjVzJyxcbiAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICdlYXNlLW91dCdcbiAgICB9LFxuICAgIHNob3dDb250ZW50QW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZTNkKGNhbGMoLTEwMHZ3IC0gNTAlKSwgMCwgMCknXG4gICAgICAgIH0sXG4gICAgICAgICc1MCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMTAwcHgsIDAsIDApJ1xuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUzZCgwLCAwLCAwKSdcbiAgICAgICAgfVxuICAgIH0pLFxuXG4gICAgaGlkZUNvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMCwgMCwgMCknXG4gICAgICAgIH0sXG4gICAgICAgICc1MCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoLTEwMHB4LCAwLCAwKSBzY2FsZTNkKDEuMSwgMS4xLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoY2FsYygxMDB2dyArIDUwJSksIDAsIDApJ1xuICAgICAgICB9LFxuICAgIH0pLFxuXG4gICAgc2hvd0JhY2tkcm9wQW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgIH0pLFxuXG4gICAgaGlkZUJhY2tkcm9wQW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMC45XG4gICAgICAgIH0sXG4gICAgICAgICc5MCUnOiB7XG4gICAgICAgICAgICBvcGFjdGl5OiAwLjlcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH1cbiAgICB9KVxufTtcblxudmFyIHNob3dBbmltYXRpb24gPSBhbmltYXRpb24uc2hvdztcbnZhciBoaWRlQW5pbWF0aW9uID0gYW5pbWF0aW9uLmhpZGU7XG52YXIgc2hvd0NvbnRlbnRBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0NvbnRlbnRBbmltYXRpb247XG52YXIgaGlkZUNvbnRlbnRBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZUNvbnRlbnRBbmltYXRpb247XG52YXIgc2hvd0JhY2tkcm9wQW5pbWF0aW9uID0gYW5pbWF0aW9uLnNob3dCYWNrZHJvcEFuaW1hdGlvbjtcbnZhciBoaWRlQmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZUJhY2tkcm9wQW5pbWF0aW9uO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1vZGFsRmFjdG9yeSh7XG4gICAgZ2V0UmVmOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiAnY29udGVudCc7XG4gICAgfSxcbiAgICBnZXRNb2RhbFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgekluZGV4OiAxMDUwLFxuICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgIHdpZHRoOiBcIjUwMHB4XCIsXG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwidHJhbnNsYXRlM2QoLTUwJSwgLTUwJSwgMClcIixcbiAgICAgICAgICAgIHRvcDogXCI1MCVcIixcbiAgICAgICAgICAgIGxlZnQ6IFwiNTAlXCJcbiAgICAgICAgfSlcbiAgICB9LFxuICAgIGdldEJhY2tkcm9wU3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgICAgICBib3R0b206IDAsXG4gICAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICAgICAgekluZGV4OiAxMDQwLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiMzNzNBNDdcIixcbiAgICAgICAgICAgIGFuaW1hdGlvbkZpbGxNb2RlOiAnZm9yd2FyZHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICcwLjNzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbk5hbWU6IHdpbGxIaWRkZW4gPyBoaWRlQmFja2Ryb3BBbmltYXRpb24gOiBzaG93QmFja2Ryb3BBbmltYXRpb24sXG4gICAgICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogKHdpbGxIaWRkZW4gPyBoaWRlQW5pbWF0aW9uIDogc2hvd0FuaW1hdGlvbikuYW5pbWF0aW9uVGltaW5nRnVuY3Rpb25cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBnZXRDb250ZW50U3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwid2hpdGVcIixcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25EdXJhdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvbkZpbGxNb2RlOiAnZm9yd2FyZHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uTmFtZTogd2lsbEhpZGRlbiA/IGhpZGVDb250ZW50QW5pbWF0aW9uIDogc2hvd0NvbnRlbnRBbmltYXRpb24sXG4gICAgICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogKHdpbGxIaWRkZW4gPyBoaWRlQW5pbWF0aW9uIDogc2hvd0FuaW1hdGlvbikuYW5pbWF0aW9uVGltaW5nRnVuY3Rpb25cbiAgICAgICAgfSlcbiAgICB9XG59KTtcbiIsInZhciBSZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG52YXIgbW9kYWxGYWN0b3J5ID0gcmVxdWlyZSgnLi9tb2RhbEZhY3RvcnknKTtcbnZhciBpbnNlcnRLZXlmcmFtZXNSdWxlID0gcmVxdWlyZSgnZG9ta2l0L2luc2VydEtleWZyYW1lc1J1bGUnKTtcbnZhciBhcHBlbmRWZW5kb3JQcmVmaXggPSByZXF1aXJlKCdkb21raXQvYXBwZW5kVmVuZG9yUHJlZml4Jyk7XG5cbnZhciBhbmltYXRpb24gPSB7XG4gICAgc2hvdzoge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuOHMnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2N1YmljLWJlemllcigwLjYsMCwwLjQsMSknXG4gICAgfSxcbiAgICBoaWRlOiB7XG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAnMC40cycsXG4gICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAnZWFzZS1vdXQnXG4gICAgfSxcbiAgICBzaG93Q29udGVudEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgIH0sXG4gICAgICAgICc0MCUnOntcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICB9XG4gICAgfSksXG5cbiAgICBoaWRlQ29udGVudEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDFcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICB9XG4gICAgfSksXG5cbiAgICBzaG93QmFja2Ryb3BBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH0sXG4gICAgICAgICcxMDAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMC45XG4gICAgICAgIH0sXG4gICAgfSksXG5cbiAgICBoaWRlQmFja2Ryb3BBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLjlcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH1cbiAgICB9KVxufTtcblxudmFyIHNob3dBbmltYXRpb24gPSBhbmltYXRpb24uc2hvdztcbnZhciBoaWRlQW5pbWF0aW9uID0gYW5pbWF0aW9uLmhpZGU7XG52YXIgc2hvd0NvbnRlbnRBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0NvbnRlbnRBbmltYXRpb247XG52YXIgaGlkZUNvbnRlbnRBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZUNvbnRlbnRBbmltYXRpb247XG52YXIgc2hvd0JhY2tkcm9wQW5pbWF0aW9uID0gYW5pbWF0aW9uLnNob3dCYWNrZHJvcEFuaW1hdGlvbjtcbnZhciBoaWRlQmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZUJhY2tkcm9wQW5pbWF0aW9uO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1vZGFsRmFjdG9yeSh7XG4gICAgZ2V0UmVmOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiAnY29udGVudCc7XG4gICAgfSxcbiAgICBnZXRTaGFycDogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICB2YXIgc3Ryb2tlRGFzaExlbmd0aCA9IDE2ODA7XG5cbiAgICAgICAgdmFyIHNob3dTaGFycEFuaW1hdGlvbiA9IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgICAgICdzdHJva2UtZGFzaG9mZnNldCc6IHN0cm9rZURhc2hMZW5ndGhcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgICAgICAnc3Ryb2tlLWRhc2hvZmZzZXQnOiAwXG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcblxuXG4gICAgICAgIHZhciBzaGFycFN0eWxlID0ge1xuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICB3aWR0aDogJ2NhbGMoMTAwJSknLFxuICAgICAgICAgICAgaGVpZ2h0OiAnY2FsYygxMDAlKScsXG4gICAgICAgICAgICB6SW5kZXg6ICctMSdcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgcmVjdFN0eWxlID0gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiB3aWxsSGlkZGVuPyAnMC40cycgOicwLjhzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbkZpbGxNb2RlOiAnZm9yd2FyZHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uTmFtZTogd2lsbEhpZGRlbj8gaGlkZUNvbnRlbnRBbmltYXRpb246IHNob3dTaGFycEFuaW1hdGlvbixcbiAgICAgICAgICAgIHN0cm9rZTogJyNmZmZmZmYnLFxuICAgICAgICAgICAgc3Ryb2tlV2lkdGg6ICcycHgnLFxuICAgICAgICAgICAgc3Ryb2tlRGFzaGFycmF5OiBzdHJva2VEYXNoTGVuZ3RoXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiA8ZGl2IHN0eWxlID0ge3NoYXJwU3R5bGV9PlxuICAgICAgICAgICAgPHN2Z1xuICAgICAgICAgICAgICAgIHhtbG5zID0gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG4gICAgICAgICAgICAgICAgd2lkdGggPSBcIjEwMCVcIlxuICAgICAgICAgICAgICAgIGhlaWdodCA9IFwiMTAwJVwiXG4gICAgICAgICAgICAgICAgdmlld0JveCA9IFwiMCAwIDQ5NiAxMzZcIlxuICAgICAgICAgICAgICAgIHByZXNlcnZlQXNwZWN0UmF0aW8gPSBcIm5vbmVcIj5cbiAgICAgICAgICAgICAgICA8cmVjdCBzdHlsZT17cmVjdFN0eWxlfVxuICAgICAgICAgICAgICAgICAgICB4ID0gXCIyXCJcbiAgICAgICAgICAgICAgICAgICAgeSA9IFwiMlwiXG4gICAgICAgICAgICAgICAgICAgIGZpbGwgPSBcIm5vbmVcIlxuICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IFwiNDkyXCJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gXCIxMzJcIiAvPlxuICAgICAgICAgICAgPC9zdmc+XG4gICAgICAgIDwvZGl2PlxuICAgIH0sXG4gICAgZ2V0TW9kYWxTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHpJbmRleDogMTA1MCxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB3aWR0aDogXCI1MDBweFwiLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZTNkKC01MCUsIC01MCUsIDApXCIsXG4gICAgICAgICAgICB0b3A6IFwiNTAlXCIsXG4gICAgICAgICAgICBsZWZ0OiBcIjUwJVwiXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBnZXRCYWNrZHJvcFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgIHpJbmRleDogMTA0MCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjMzczQTQ3XCIsXG4gICAgICAgICAgICBhbmltYXRpb25GaWxsTW9kZTogJ2ZvcndhcmRzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAnMC40cycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUJhY2tkcm9wQW5pbWF0aW9uIDogc2hvd0JhY2tkcm9wQW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0Q29udGVudFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIndoaXRlXCIsXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogKHdpbGxIaWRkZW4gPyBoaWRlQW5pbWF0aW9uIDogc2hvd0FuaW1hdGlvbikuYW5pbWF0aW9uRHVyYXRpb24sXG4gICAgICAgICAgICBhbmltYXRpb25GaWxsTW9kZTogJ2ZvcndhcmRzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbk5hbWU6IHdpbGxIaWRkZW4gPyBoaWRlQ29udGVudEFuaW1hdGlvbiA6IHNob3dDb250ZW50QW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pXG4gICAgfVxufSk7XG4iLCJ2YXIgbW9kYWxGYWN0b3J5ID0gcmVxdWlyZSgnLi9tb2RhbEZhY3RvcnknKTtcbnZhciBpbnNlcnRLZXlmcmFtZXNSdWxlID0gcmVxdWlyZSgnZG9ta2l0L2luc2VydEtleWZyYW1lc1J1bGUnKTtcbnZhciBhcHBlbmRWZW5kb3JQcmVmaXggPSByZXF1aXJlKCdkb21raXQvYXBwZW5kVmVuZG9yUHJlZml4Jyk7XG5cbnZhciBhbmltYXRpb24gPSB7XG4gICAgc2hvdzoge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuNHMnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2N1YmljLWJlemllcigwLjYsMCwwLjQsMSknXG4gICAgfSxcbiAgICBoaWRlOiB7XG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAnMC40cycsXG4gICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAnZWFzZS1vdXQnXG4gICAgfSxcbiAgICBzaG93Q29udGVudEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdzY2FsZTNkKDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdzY2FsZTNkKDEsIDEsIDEpJ1xuICAgICAgICB9XG4gICAgfSksXG5cbiAgICBoaWRlQ29udGVudEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDFcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAnc2NhbGUzZCgwLjUsIDAuNSwgMSknXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIHNob3dCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLjlcbiAgICAgICAgfSxcbiAgICB9KSxcblxuICAgIGhpZGVCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG52YXIgc2hvd0FuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93O1xudmFyIGhpZGVBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZTtcbnZhciBzaG93Q29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93Q29udGVudEFuaW1hdGlvbjtcbnZhciBoaWRlQ29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQ29udGVudEFuaW1hdGlvbjtcbnZhciBzaG93QmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0JhY2tkcm9wQW5pbWF0aW9uO1xudmFyIGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQmFja2Ryb3BBbmltYXRpb247XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kYWxGYWN0b3J5KHtcbiAgICBnZXRSZWY6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuICdjb250ZW50JztcbiAgICB9LFxuICAgIGdldE1vZGFsU3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICB6SW5kZXg6IDEwNTAsXG4gICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgICAgICAgd2lkdGg6IFwiNTAwcHhcIixcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUzZCgtNTAlLCAtNTAlLCAwKVwiLFxuICAgICAgICAgICAgdG9wOiBcIjUwJVwiLFxuICAgICAgICAgICAgbGVmdDogXCI1MCVcIlxuICAgICAgICB9KVxuICAgIH0sXG4gICAgZ2V0QmFja2Ryb3BTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICB6SW5kZXg6IDEwNDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiIzM3M0E0N1wiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuNHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uTmFtZTogd2lsbEhpZGRlbiA/IGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA6IHNob3dCYWNrZHJvcEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldENvbnRlbnRTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIG1hcmdpbjogMCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUNvbnRlbnRBbmltYXRpb24gOiBzaG93Q29udGVudEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KVxuICAgIH1cbn0pO1xuIiwidmFyIG1vZGFsRmFjdG9yeSA9IHJlcXVpcmUoJy4vbW9kYWxGYWN0b3J5Jyk7XG52YXIgaW5zZXJ0S2V5ZnJhbWVzUnVsZSA9IHJlcXVpcmUoJ2RvbWtpdC9pbnNlcnRLZXlmcmFtZXNSdWxlJyk7XG52YXIgYXBwZW5kVmVuZG9yUHJlZml4ID0gcmVxdWlyZSgnZG9ta2l0L2FwcGVuZFZlbmRvclByZWZpeCcpO1xuXG52YXIgYW5pbWF0aW9uID0ge1xuICAgIHNob3c6IHtcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICcxcycsXG4gICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAnbGluZWFyJ1xuICAgIH0sXG4gICAgaGlkZToge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuM3MnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2Vhc2Utb3V0J1xuICAgIH0sXG4gICAgc2hvd0NvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC43LCAwLCAwLCAwLCAwLCAwLjcsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMi4wODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC43NTI2NiwgMCwgMCwgMCwgMCwgMC43NjM0MiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc0LjE2NjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjgxMDcxLCAwLCAwLCAwLCAwLCAwLjg0NTQ1LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzYuMjUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC44NjgwOCwgMCwgMCwgMCwgMCwgMC45Mjg2LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzguMzMzMzMzJSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDAuOTIwMzgsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMTAuNDE2NjY3JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDAuOTY0ODIsIDAsIDAsIDAsIDAsIDEuMDUyMDIsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMTIuNSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLCAwLCAwLCAwLCAwLCAxLjA4MjA0LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzE0LjU4MzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAyNTYzLCAwLCAwLCAwLCAwLCAxLjA5MTQ5LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzE2LjY2NjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjA0MjI3LCAwLCAwLCAwLCAwLCAxLjA4NDUzLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzE4Ljc1JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDUxMDIsIDAsIDAsIDAsIDAsIDEuMDY2NjYsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMjAuODMzMzMzJSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDUzMzQsIDAsIDAsIDAsIDAsIDEuMDQzNTUsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMjIuOTE2NjY3JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDUwNzgsIDAsIDAsIDAsIDAsIDEuMDIwMTIsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMjUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wNDQ4NywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICcyNy4wODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMzY5OSwgMCwgMCwgMCwgMCwgMC45ODUzNCwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICcyOS4xNjY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMjgzMSwgMCwgMCwgMCwgMCwgMC45NzY4OCwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICczMS4yNSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAxOTczLCAwLCAwLCAwLCAwLCAwLjk3NDIyLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzMzLjMzMzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAxMTkxLCAwLCAwLCAwLCAwLCAwLjk3NjE4LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzM1LjQxNjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwNTI2LCAwLCAwLCAwLCAwLCAwLjk4MTIyLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzM3LjUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMSwgMCwgMCwgMCwgMCwgMC45ODc3MywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICczOS41ODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTYxNywgMCwgMCwgMCwgMCwgMC45OTQzMywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc0MS42NjY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTM2OCwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc0My43NSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5MjM3LCAwLCAwLCAwLCAwLCAxLjAwNDEzLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzQ1LjgzMzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5MjAyLCAwLCAwLCAwLCAwLCAxLjAwNjUxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzQ3LjkxNjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5MjQxLCAwLCAwLCAwLCAwLCAxLjAwNzI2LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzUwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5MzI5LCAwLCAwLCAwLCAwLCAxLjAwNjcxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzUyLjA4MzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5NDQ3LCAwLCAwLCAwLCAwLCAxLjAwNTI5LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzU0LjE2NjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5NTc3LCAwLCAwLCAwLCAwLCAxLjAwMzQ2LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzU2LjI1JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDAuOTk3MDUsIDAsIDAsIDAsIDAsIDEuMDAxNiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc1OC4zMzMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTgyMiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc2MC40MTY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTkyMSwgMCwgMCwgMCwgMCwgMC45OTg4NCwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc2Mi41JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEsIDAsIDAsIDAsIDAsIDAuOTk4MTYsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnNjQuNTgzMzMzJSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDAwNTcsIDAsIDAsIDAsIDAsIDAuOTk3OTUsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnNjYuNjY2NjY3JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDAwOTUsIDAsIDAsIDAsIDAsIDAuOTk4MTEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnNjguNzUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDExNCwgMCwgMCwgMCwgMCwgMC45OTg1MSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3MC44MzMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDExOSwgMCwgMCwgMCwgMCwgMC45OTkwMywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3Mi45MTY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDExNCwgMCwgMCwgMCwgMCwgMC45OTk1NSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3NSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3Ny4wODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDA4MywgMCwgMCwgMCwgMCwgMS4wMDAzMywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3OS4xNjY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDA2MywgMCwgMCwgMCwgMCwgMS4wMDA1MiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc4MS4yNSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwMDQ0LCAwLCAwLCAwLCAwLCAxLjAwMDU4LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzgzLjMzMzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwMDI3LCAwLCAwLCAwLCAwLCAxLjAwMDUzLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzg1LjQxNjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwMDEyLCAwLCAwLCAwLCAwLCAxLjAwMDQyLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzg3LjUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMSwgMCwgMCwgMCwgMCwgMS4wMDAyNywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc4OS41ODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTk5MSwgMCwgMCwgMCwgMCwgMS4wMDAxMywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc5MS42NjY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTk4NiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc5My43NSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5OTgzLCAwLCAwLCAwLCAwLCAwLjk5OTkxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzk1LjgzMzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5OTgyLCAwLCAwLCAwLCAwLCAwLjk5OTg1LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzk3LjkxNjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5OTgzLCAwLCAwLCAwLCAwLCAwLjk5OTg0LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVDb250ZW50QW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdzY2FsZTNkKDAuOCwgMC44LCAxKSdcbiAgICAgICAgfSxcbiAgICB9KSxcblxuICAgIHNob3dCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLjlcbiAgICAgICAgfSxcbiAgICB9KSxcblxuICAgIGhpZGVCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG52YXIgc2hvd0FuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93O1xudmFyIGhpZGVBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZTtcbnZhciBzaG93Q29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93Q29udGVudEFuaW1hdGlvbjtcbnZhciBoaWRlQ29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQ29udGVudEFuaW1hdGlvbjtcbnZhciBzaG93QmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0JhY2tkcm9wQW5pbWF0aW9uO1xudmFyIGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQmFja2Ryb3BBbmltYXRpb247XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kYWxGYWN0b3J5KHtcbiAgICBnZXRSZWY6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuICdjb250ZW50JztcbiAgICB9LFxuICAgIGdldE1vZGFsU3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICB6SW5kZXg6IDEwNTAsXG4gICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgICAgICAgd2lkdGg6IFwiNTAwcHhcIixcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUzZCgtNTAlLCAtNTAlLCAwKVwiLFxuICAgICAgICAgICAgdG9wOiBcIjUwJVwiLFxuICAgICAgICAgICAgbGVmdDogXCI1MCVcIlxuICAgICAgICB9KVxuICAgIH0sXG4gICAgZ2V0QmFja2Ryb3BTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICB6SW5kZXg6IDEwNDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiIzM3M0E0N1wiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuM3MnLFxuICAgICAgICAgICAgYW5pbWF0aW9uTmFtZTogd2lsbEhpZGRlbiA/IGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA6IHNob3dCYWNrZHJvcEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldENvbnRlbnRTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIG1hcmdpbjogMCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUNvbnRlbnRBbmltYXRpb24gOiBzaG93Q29udGVudEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KVxuICAgIH1cbn0pO1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbnZhciBQcm9wVHlwZXMgPSByZXF1aXJlKCdwcm9wLXR5cGVzJylcbnZhciB0cmFuc2l0aW9uRXZlbnRzID0gcmVxdWlyZSgnZG9ta2l0L3RyYW5zaXRpb25FdmVudHMnKTtcbnZhciBhcHBlbmRWZW5kb3JQcmVmaXggPSByZXF1aXJlKCdkb21raXQvYXBwZW5kVmVuZG9yUHJlZml4Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oYW5pbWF0aW9uKXtcblxuICAgIHJldHVybiBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gICAgICAgIHByb3BUeXBlczoge1xuICAgICAgICAgICAgY2xhc3NOYW1lOiBQcm9wVHlwZXMuc3RyaW5nLFxuICAgICAgICAgICAgLy8gQ2xvc2UgdGhlIG1vZGFsIHdoZW4gZXNjIGlzIHByZXNzZWQ/IERlZmF1bHRzIHRvIHRydWUuXG4gICAgICAgICAgICBrZXlib2FyZDogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgICAgICBvblNob3c6IFByb3BUeXBlcy5mdW5jLFxuICAgICAgICAgICAgb25IaWRlOiBQcm9wVHlwZXMuZnVuYyxcbiAgICAgICAgICAgIGFuaW1hdGlvbjogUHJvcFR5cGVzLm9iamVjdCxcbiAgICAgICAgICAgIGJhY2tkcm9wOiBQcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgICAgIGNsb3NlT25DbGljazogUHJvcFR5cGVzLmJvb2wsXG4gICAgICAgICAgICBtb2RhbFN0eWxlOiBQcm9wVHlwZXMub2JqZWN0LFxuICAgICAgICAgICAgYmFja2Ryb3BTdHlsZTogUHJvcFR5cGVzLm9iamVjdCxcbiAgICAgICAgICAgIGNvbnRlbnRTdHlsZTogUHJvcFR5cGVzLm9iamVjdCxcbiAgICAgICAgfSxcblxuICAgICAgICBnZXREZWZhdWx0UHJvcHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU6IFwiXCIsXG4gICAgICAgICAgICAgICAgb25TaG93OiBmdW5jdGlvbigpe30sXG4gICAgICAgICAgICAgICAgb25IaWRlOiBmdW5jdGlvbigpe30sXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiBhbmltYXRpb24sXG4gICAgICAgICAgICAgICAga2V5Ym9hcmQ6IHRydWUsXG4gICAgICAgICAgICAgICAgYmFja2Ryb3A6IHRydWUsXG4gICAgICAgICAgICAgICAgY2xvc2VPbkNsaWNrOiB0cnVlLFxuICAgICAgICAgICAgICAgIG1vZGFsU3R5bGU6IHt9LFxuICAgICAgICAgICAgICAgIGJhY2tkcm9wU3R5bGU6IHt9LFxuICAgICAgICAgICAgICAgIGNvbnRlbnRTdHlsZToge30sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgd2lsbEhpZGRlbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgaGlkZGVuOiB0cnVlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhc0hpZGRlbjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0YXRlLmhpZGRlbjtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRUcmFuc2l0aW9uTGlzdGVuZXI6IGZ1bmN0aW9uKG5vZGUsIGhhbmRsZSl7XG4gICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICB2YXIgZW5kTGlzdGVuZXIgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICBpZiAoZSAmJiBlLnRhcmdldCAhPT0gbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25FdmVudHMucmVtb3ZlRW5kRXZlbnRMaXN0ZW5lcihub2RlLCBlbmRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICBoYW5kbGUoKTtcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbkV2ZW50cy5hZGRFbmRFdmVudExpc3RlbmVyKG5vZGUsIGVuZExpc3RlbmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBoYW5kbGVCYWNrZHJvcENsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLmNsb3NlT25DbGljaykge1xuICAgICAgICAgICAgICAgIHRoaXMuaGlkZShcImJhY2tkcm9wXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIHZhciBoaWRkZW4gPSB0aGlzLmhhc0hpZGRlbigpO1xuICAgICAgICAgICAgaWYgKGhpZGRlbikgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgIHZhciB3aWxsSGlkZGVuID0gdGhpcy5zdGF0ZS53aWxsSGlkZGVuO1xuICAgICAgICAgICAgdmFyIGFuaW1hdGlvbiA9IHRoaXMucHJvcHMuYW5pbWF0aW9uO1xuICAgICAgICAgICAgdmFyIG1vZGFsU3R5bGUgPSBhbmltYXRpb24uZ2V0TW9kYWxTdHlsZSh3aWxsSGlkZGVuKTtcbiAgICAgICAgICAgIHZhciBiYWNrZHJvcFN0eWxlID0gYW5pbWF0aW9uLmdldEJhY2tkcm9wU3R5bGUod2lsbEhpZGRlbik7XG4gICAgICAgICAgICB2YXIgY29udGVudFN0eWxlID0gYW5pbWF0aW9uLmdldENvbnRlbnRTdHlsZSh3aWxsSGlkZGVuKTtcbiAgICAgICAgICAgIHZhciByZWYgPSBhbmltYXRpb24uZ2V0UmVmKHdpbGxIaWRkZW4pO1xuICAgICAgICAgICAgdmFyIHNoYXJwID0gYW5pbWF0aW9uLmdldFNoYXJwICYmIGFuaW1hdGlvbi5nZXRTaGFycCh3aWxsSGlkZGVuKTtcblxuICAgICAgICAgICAgLy8gQXBwbHkgY3VzdG9tIHN0eWxlIHByb3BlcnRpZXNcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLm1vZGFsU3R5bGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJlZml4ZWRNb2RhbFN0eWxlID0gYXBwZW5kVmVuZG9yUHJlZml4KHRoaXMucHJvcHMubW9kYWxTdHlsZSk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgc3R5bGUgaW4gcHJlZml4ZWRNb2RhbFN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZGFsU3R5bGVbc3R5bGVdID0gcHJlZml4ZWRNb2RhbFN0eWxlW3N0eWxlXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLmJhY2tkcm9wU3R5bGUpIHtcbiAgICAgICAgICAgICAgdmFyIHByZWZpeGVkQmFja2Ryb3BTdHlsZSA9IGFwcGVuZFZlbmRvclByZWZpeCh0aGlzLnByb3BzLmJhY2tkcm9wU3R5bGUpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHN0eWxlIGluIHByZWZpeGVkQmFja2Ryb3BTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcFN0eWxlW3N0eWxlXSA9IHByZWZpeGVkQmFja2Ryb3BTdHlsZVtzdHlsZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5jb250ZW50U3R5bGUpIHtcbiAgICAgICAgICAgICAgdmFyIHByZWZpeGVkQ29udGVudFN0eWxlID0gYXBwZW5kVmVuZG9yUHJlZml4KHRoaXMucHJvcHMuY29udGVudFN0eWxlKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBzdHlsZSBpbiBwcmVmaXhlZENvbnRlbnRTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZW50U3R5bGVbc3R5bGVdID0gcHJlZml4ZWRDb250ZW50U3R5bGVbc3R5bGVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGJhY2tkcm9wID0gdGhpcy5wcm9wcy5iYWNrZHJvcD8gPGRpdiBzdHlsZT17YmFja2Ryb3BTdHlsZX0gb25DbGljaz17dGhpcy5wcm9wcy5jbG9zZU9uQ2xpY2s/IHRoaXMuaGFuZGxlQmFja2Ryb3BDbGljazogbnVsbH0gLz46IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgaWYod2lsbEhpZGRlbikge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5yZWZzW3JlZl07XG4gICAgICAgICAgICAgICAgdGhpcy5hZGRUcmFuc2l0aW9uTGlzdGVuZXIobm9kZSwgdGhpcy5sZWF2ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAoPHNwYW4+XG4gICAgICAgICAgICAgICAgPGRpdiByZWY9XCJtb2RhbFwiIHN0eWxlPXttb2RhbFN0eWxlfSBjbGFzc05hbWU9e3RoaXMucHJvcHMuY2xhc3NOYW1lfT5cbiAgICAgICAgICAgICAgICAgICAge3NoYXJwfVxuICAgICAgICAgICAgICAgICAgICA8ZGl2IHJlZj1cImNvbnRlbnRcIiB0YWJJbmRleD1cIi0xXCIgc3R5bGU9e2NvbnRlbnRTdHlsZX0+XG4gICAgICAgICAgICAgICAgICAgICAgICB7dGhpcy5wcm9wcy5jaGlsZHJlbn1cbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAge2JhY2tkcm9wfVxuICAgICAgICAgICAgIDwvc3Bhbj4pXG4gICAgICAgICAgICA7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbGVhdmU6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICBoaWRkZW46IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vbkhpZGUodGhpcy5zdGF0ZS5oaWRlU291cmNlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBlbnRlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRoaXMucHJvcHMub25TaG93KCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2hvdzogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGlmICghdGhpcy5oYXNIaWRkZW4oKSkgcmV0dXJuO1xuXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgICAgICAgICB3aWxsSGlkZGVuOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBoaWRkZW46IGZhbHNlXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICB2YXIgcmVmID0gdGhpcy5wcm9wcy5hbmltYXRpb24uZ2V0UmVmKCk7XG4gICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5yZWZzW3JlZl07XG4gICAgICAgICAgICAgIHRoaXMuYWRkVHJhbnNpdGlvbkxpc3RlbmVyKG5vZGUsIHRoaXMuZW50ZXIpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCAwKTtcbiAgICAgICAgfSxcblxuICAgICAgICBoaWRlOiBmdW5jdGlvbihzb3VyY2Upe1xuICAgICAgICAgICAgaWYgKHRoaXMuaGFzSGlkZGVuKCkpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKCFzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICBzb3VyY2UgPSBcImhpZGVcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgaGlkZVNvdXJjZTogc291cmNlLFxuICAgICAgICAgICAgICAgIHdpbGxIaWRkZW46IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGlmICh0aGlzLmhhc0hpZGRlbigpKVxuICAgICAgICAgICAgICAgIHRoaXMuc2hvdygpO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRoaXMuaGlkZShcInRvZ2dsZVwiKTtcbiAgICAgICAgfSxcblxuICAgICAgICBsaXN0ZW5LZXlib2FyZDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgICh0eXBlb2YodGhpcy5wcm9wcy5rZXlib2FyZCk9PVwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgICAgICA/dGhpcy5wcm9wcy5rZXlib2FyZChldmVudClcbiAgICAgICAgICAgICAgICA6dGhpcy5jbG9zZU9uRXNjKGV2ZW50KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjbG9zZU9uRXNjOiBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICBpZiAodGhpcy5wcm9wcy5rZXlib2FyZCAmJlxuICAgICAgICAgICAgICAgICAgICAoZXZlbnQua2V5ID09PSBcIkVzY2FwZVwiIHx8XG4gICAgICAgICAgICAgICAgICAgICBldmVudC5rZXlDb2RlID09PSAyNykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGUoXCJrZXlib2FyZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmxpc3RlbktleWJvYXJkLCB0cnVlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5saXN0ZW5LZXlib2FyZCwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBEcm9wTW9kYWw6IHJlcXVpcmUoJy4vRHJvcE1vZGFsJyksXG4gICAgV2F2ZU1vZGFsOiByZXF1aXJlKCcuL1dhdmVNb2RhbCcpLFxuICAgIEZseU1vZGFsOiByZXF1aXJlKCcuL0ZseU1vZGFsJyksXG4gICAgRmFkZU1vZGFsOiByZXF1aXJlKCcuL0ZhZGVNb2RhbCcpLFxuICAgIFNjYWxlTW9kYWw6IHJlcXVpcmUoJy4vU2NhbGVNb2RhbCcpLFxuICAgIE91dGxpbmVNb2RhbDogcmVxdWlyZSgnLi9PdXRsaW5lTW9kYWwnKSxcbn1cbiJdfQ==
