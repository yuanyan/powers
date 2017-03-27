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
var modalFactory = require('./modalFactory');
var canUseDOM = require('./canUseDOM');
var insertKeyframesRule =  canUseDOM ? require('domkit/insertKeyframesRule') : function() {};
var appendVendorPrefix = canUseDOM ? require('domkit/appendVendorPrefix') : function() {};


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

},{"./canUseDOM":14,"./modalFactory":15,"domkit/appendVendorPrefix":1,"domkit/insertKeyframesRule":5}],9:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var canUseDOM = require('./canUseDOM');
var insertKeyframesRule = canUseDOM ? require('domkit/insertKeyframesRule') : function() {};
var appendVendorPrefix = canUseDOM ? require('domkit/appendVendorPrefix') : function() {};

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

},{"./canUseDOM":14,"./modalFactory":15,"domkit/appendVendorPrefix":1,"domkit/insertKeyframesRule":5}],10:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var canUseDOM = require('./canUseDOM');
var insertKeyframesRule = canUseDOM ? require('domkit/insertKeyframesRule') : function() {};
var appendVendorPrefix = canUseDOM ? require('domkit/appendVendorPrefix') : function() {};

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

},{"./canUseDOM":14,"./modalFactory":15,"domkit/appendVendorPrefix":1,"domkit/insertKeyframesRule":5}],11:[function(require,module,exports){
var React = require('react');
var modalFactory = require('./modalFactory');
var canUseDOM = require('./canUseDOM');
var insertKeyframesRule = canUseDOM ? require('domkit/insertKeyframesRule') : function() {};
var appendVendorPrefix = canUseDOM ? require('domkit/appendVendorPrefix') : function() {};

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

},{"./canUseDOM":14,"./modalFactory":15,"domkit/appendVendorPrefix":1,"domkit/insertKeyframesRule":5,"react":undefined}],12:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var canUseDOM = require('./canUseDOM');
var insertKeyframesRule = canUseDOM ? require('domkit/insertKeyframesRule') : function() {};
var appendVendorPrefix = canUseDOM ? require('domkit/appendVendorPrefix') : function() {};

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

},{"./canUseDOM":14,"./modalFactory":15,"domkit/appendVendorPrefix":1,"domkit/insertKeyframesRule":5}],13:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var canUseDOM = require('./canUseDOM');
var insertKeyframesRule = canUseDOM ? require('domkit/insertKeyframesRule') : function() {};
var appendVendorPrefix = canUseDOM ? require('domkit/appendVendorPrefix') : function() {};

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

},{"./canUseDOM":14,"./modalFactory":15,"domkit/appendVendorPrefix":1,"domkit/insertKeyframesRule":5}],14:[function(require,module,exports){
const canUseDOM = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);
module.exports = canUseDOM;
},{}],15:[function(require,module,exports){
var React = require('react');
var canUseDOM = require('./canUseDOM');
var transitionEvents = canUseDOM ? require('domkit/transitionEvents') : function() {};
var appendVendorPrefix = canUseDOM ? require('domkit/appendVendorPrefix') : function() {};

module.exports = function(animation){

    return React.createClass({
        propTypes: {
            className: React.PropTypes.string,
            // Close the modal when esc is pressed? Defaults to true.
            keyboard: React.PropTypes.bool,
            onShow: React.PropTypes.func,
            onHide: React.PropTypes.func,
            animation: React.PropTypes.object,
            backdrop: React.PropTypes.bool,
            closeOnClick: React.PropTypes.bool,
            modalStyle: React.PropTypes.object,
            backdropStyle: React.PropTypes.object,
            contentStyle: React.PropTypes.object,
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

},{"./canUseDOM":14,"domkit/appendVendorPrefix":1,"domkit/transitionEvents":7,"react":undefined}],"boron":[function(require,module,exports){
module.exports = {
    DropModal: require('./DropModal'),
    WaveModal: require('./WaveModal'),
    FlyModal: require('./FlyModal'),
    FadeModal: require('./FadeModal'),
    ScaleModal: require('./ScaleModal'),
    OutlineModal: require('./OutlineModal'),
}

},{"./DropModal":8,"./FadeModal":9,"./FlyModal":10,"./OutlineModal":11,"./ScaleModal":12,"./WaveModal":13}]},{},[]);
