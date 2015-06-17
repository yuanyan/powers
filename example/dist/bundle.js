require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var getVendorPropertyName = require('./getVendorPropertyName');

module.exports = function (target, sources){
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

},{"./getVendorPropertyName":3}],2:[function(require,module,exports){
'use strict';

var cssVendorPrefix;

module.exports = function (){

    if(cssVendorPrefix) return cssVendorPrefix;

    var styles = window.getComputedStyle(document.documentElement, '');
    var pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
    )[1];

    return cssVendorPrefix = '-' + pre + '-';
}

},{}],3:[function(require,module,exports){
'use strict';

var div = document.createElement('div');
var prefixes = ['Moz', 'Webkit', 'O', 'ms'];
var domVendorPrefix;

// Helper function to get the proper vendor property name. (transition => WebkitTransition)
module.exports = function (prop) {

    if (prop in div.style) return prop;

    var prop = prop.charAt(0).toUpperCase() + prop.substr(1);
    if(domVendorPrefix){
        return domVendorPrefix + prop;
    }else{
        for (var i=0; i<prefixes.length; ++i) {
            var vendorProp = prefixes[i] + prop;
            if (vendorProp in div.style) {
                domVendorPrefix = prefixes[i];
                return vendorProp;
            }
        }
    }
}

},{}],4:[function(require,module,exports){
'use strict';

var insertRule = require('./insertRule');
var vendorPrefix = require('./getVendorPrefix')();
var index = 0;

module.exports = function (keyframes) {
    // random name
    var name = 'anim_'+ (++index) + (+new Date);
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

},{"./getVendorPrefix":2,"./insertRule":5}],5:[function(require,module,exports){
'use strict';

var extraSheet;

module.exports = function (css) {

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

},{}],6:[function(require,module,exports){
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

if(typeof window !== 'undefined'){
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

},{}],7:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('react-kit/insertKeyframesRule');
var appendVendorPrefix = require('react-kit/appendVendorPrefix');

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
            transform: 'translate3d(-50%, -300px, 0)'
        },
        '100%': {
            opacity: 1,
            transform: 'translate3d(-50%, -50%, 0)'
        }
    }),

    hideModalAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1,
            transform: 'translate3d(-50%, -50%, 0)'
        },
        '100%': {
            opacity: 0,
            transform: 'translate3d(-50%, 100px, 0)'
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
            transform: 'translate3d(0, -20px, 0)'
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
        '100%': {
            opacity: 0,
            transform: 'translate3d(0, 50px, 0)'
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
            transform: "translate3d(-50%, -50%, 0)",
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
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationDelay: '0.25s',
            animationName: showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

},{"./modalFactory":13,"react-kit/appendVendorPrefix":1,"react-kit/insertKeyframesRule":4}],8:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('react-kit/insertKeyframesRule');
var appendVendorPrefix = require('react-kit/appendVendorPrefix');

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

},{"./modalFactory":13,"react-kit/appendVendorPrefix":1,"react-kit/insertKeyframesRule":4}],9:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('react-kit/insertKeyframesRule');
var appendVendorPrefix = require('react-kit/appendVendorPrefix');

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

},{"./modalFactory":13,"react-kit/appendVendorPrefix":1,"react-kit/insertKeyframesRule":4}],10:[function(require,module,exports){
var modalFactory = require('./modalFactory');

var React = require('react');
var insertKeyframesRule = require('react-kit/insertKeyframesRule');
var appendVendorPrefix = require('react-kit/appendVendorPrefix');

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

},{"./modalFactory":13,"react":undefined,"react-kit/appendVendorPrefix":1,"react-kit/insertKeyframesRule":4}],11:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('react-kit/insertKeyframesRule');
var appendVendorPrefix = require('react-kit/appendVendorPrefix');

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

},{"./modalFactory":13,"react-kit/appendVendorPrefix":1,"react-kit/insertKeyframesRule":4}],12:[function(require,module,exports){
var modalFactory = require('./modalFactory');
var insertKeyframesRule = require('react-kit/insertKeyframesRule');
var appendVendorPrefix = require('react-kit/appendVendorPrefix');

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

},{"./modalFactory":13,"react-kit/appendVendorPrefix":1,"react-kit/insertKeyframesRule":4}],13:[function(require,module,exports){
var React = require('react');
var transitionEvents = require('react-kit/transitionEvents');

module.exports = function(animation){

    return React.createClass({
        propTypes: {
            className: React.PropTypes.string,
            // Close the modal when esc is pressed? Defaults to true.
            keyboard: React.PropTypes.bool,
            onShow: React.PropTypes.func,
            onHide: React.PropTypes.func,
            animation: React.PropTypes.object,
            backdrop: React.PropTypes.oneOfType([
                React.PropTypes.bool,
                React.PropTypes.string
            ])
        },

        getDefaultProps: function() {
            return {
                className: "",
                onShow: function(){},
                onHide: function(){},
                animation: animation,
                keyboard: true,
                backdrop: true
            };
        },

        getInitialState: function(){
            return {
                willHidden: false,
                hidden: true
            }
        },

        hasHidden: function(){
            return this.state.hidden;
        },

        handleBackdropClick: function() {
            if(this.props.closeOnClick) {
                this.hide();
            }
        },

        componentDidMount: function(){
            var ref = this.props.animation.getRef();
            var node = this.refs[ref].getDOMNode();
            var endListener = function(e) {
                if (e && e.target !== node) {
                    return;
                }
                transitionEvents.removeEndEventListener(node, endListener);
                this.enter();

            }.bind(this);
            transitionEvents.addEndEventListener(node, endListener);
        },

        render: function() {

            var hidden = this.hasHidden();
            if(hidden) return null;

            var willHidden = this.state.willHidden;
            var animation = this.props.animation;
            var modalStyle = animation.getModalStyle(willHidden);
            var backdropStyle = animation.getBackdropStyle(willHidden);
            var contentStyle = animation.getContentStyle(willHidden);
            var ref = animation.getRef(willHidden);
            var sharp = animation.getSharp && animation.getSharp(willHidden);
            var backdrop = this.props.backdrop? React.createElement("div", {onClick: this.handleBackdropClick, style: backdropStyle}): undefined;

            if(willHidden) {
                var node = this.refs[ref].getDOMNode();
                var endListener = function(e) {
                    if (e && e.target !== node) {
                        return;
                    }

                    transitionEvents.removeEndEventListener(node, endListener);
                    this.leave();

                }.bind(this);
                transitionEvents.addEndEventListener(node, endListener);
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
            this.props.onHide();
        },

        enter: function(){
            this.props.onShow();
        },

        show: function(){
            if(!this.hasHidden()) return;

            this.setState({
                willHidden: false,
                hidden: false
            });
        },

        hide: function(){
            if(this.hasHidden()) return;

            this.setState({
                willHidden: true
            });
        },

        toggle: function(){
            if(this.hasHidden())
                this.show();
            else
                this.hide();
        },

        listenKeyboard: function(event) {
            if (this.props.keyboard &&
                    (event.key === "Escape" ||
                     event.keyCode === 27)) {
                this.hide();
            }
        },

        componentDidMount: function() {
            window.addEventListener("keydown", this.listenKeyboard, true);
        },

        componentWillUnmount: function() {
            window.removeEventListener("keydown", this.listenKeyboard, true);
        },

    });

}

},{"react":undefined,"react-kit/transitionEvents":6}],"boron":[function(require,module,exports){
module.exports = {
    DropModal: require('./DropModal'),
    WaveModal: require('./WaveModal'),
    FlyModal: require('./FlyModal'),
    FadeModal: require('./FadeModal'),
    ScaleModal: require('./ScaleModal'),
    OutlineModal: require('./OutlineModal'),
}

},{"./DropModal":7,"./FadeModal":8,"./FlyModal":9,"./OutlineModal":10,"./ScaleModal":11,"./WaveModal":12}]},{},[])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcmVhY3Qta2l0L2FwcGVuZFZlbmRvclByZWZpeC5qcyIsIm5vZGVfbW9kdWxlcy9yZWFjdC1raXQvZ2V0VmVuZG9yUHJlZml4LmpzIiwibm9kZV9tb2R1bGVzL3JlYWN0LWtpdC9nZXRWZW5kb3JQcm9wZXJ0eU5hbWUuanMiLCJub2RlX21vZHVsZXMvcmVhY3Qta2l0L2luc2VydEtleWZyYW1lc1J1bGUuanMiLCJub2RlX21vZHVsZXMvcmVhY3Qta2l0L2luc2VydFJ1bGUuanMiLCJub2RlX21vZHVsZXMvcmVhY3Qta2l0L3RyYW5zaXRpb25FdmVudHMuanMiLCJzcmMvRHJvcE1vZGFsLmpzIiwic3JjL0ZhZGVNb2RhbC5qcyIsInNyYy9GbHlNb2RhbC5qcyIsInNyYy9PdXRsaW5lTW9kYWwuanMiLCJzcmMvU2NhbGVNb2RhbC5qcyIsInNyYy9XYXZlTW9kYWwuanMiLCJzcmMvbW9kYWxGYWN0b3J5LmpzIiwic3JjL0Jvcm9uLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIGdldFZlbmRvclByb3BlcnR5TmFtZSA9IHJlcXVpcmUoJy4vZ2V0VmVuZG9yUHJvcGVydHlOYW1lJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHRhcmdldCwgc291cmNlcyl7XG4gICAgdmFyIHRvID0gT2JqZWN0KHRhcmdldCk7XG4gICAgdmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuICAgIGZvciAodmFyIG5leHRJbmRleCA9IDE7IG5leHRJbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7IG5leHRJbmRleCsrKSB7XG4gICAgICAgIHZhciBuZXh0U291cmNlID0gYXJndW1lbnRzW25leHRJbmRleF07XG4gICAgICAgIGlmIChuZXh0U291cmNlID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZyb20gPSBPYmplY3QobmV4dFNvdXJjZSk7XG5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIGZyb20pIHtcbiAgICAgICAgICAgIGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGZyb20sIGtleSkpIHtcbiAgICAgICAgICAgICAgICB0b1trZXldID0gZnJvbVtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHByZWZpeGVkID0ge307XG4gICAgZm9yICh2YXIga2V5IGluIHRvKSB7XG4gICAgICAgIHByZWZpeGVkW2dldFZlbmRvclByb3BlcnR5TmFtZShrZXkpXSA9IHRvW2tleV1cbiAgICB9XG5cbiAgICByZXR1cm4gcHJlZml4ZWRcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNzc1ZlbmRvclByZWZpeDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKXtcblxuICAgIGlmKGNzc1ZlbmRvclByZWZpeCkgcmV0dXJuIGNzc1ZlbmRvclByZWZpeDtcblxuICAgIHZhciBzdHlsZXMgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICcnKTtcbiAgICB2YXIgcHJlID0gKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHN0eWxlcykuam9pbignJykubWF0Y2goLy0obW96fHdlYmtpdHxtcyktLykgfHwgKHN0eWxlcy5PTGluayA9PT0gJycgJiYgWycnLCAnbyddKVxuICAgIClbMV07XG5cbiAgICByZXR1cm4gY3NzVmVuZG9yUHJlZml4ID0gJy0nICsgcHJlICsgJy0nO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG52YXIgcHJlZml4ZXMgPSBbJ01veicsICdXZWJraXQnLCAnTycsICdtcyddO1xudmFyIGRvbVZlbmRvclByZWZpeDtcblxuLy8gSGVscGVyIGZ1bmN0aW9uIHRvIGdldCB0aGUgcHJvcGVyIHZlbmRvciBwcm9wZXJ0eSBuYW1lLiAodHJhbnNpdGlvbiA9PiBXZWJraXRUcmFuc2l0aW9uKVxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocHJvcCkge1xuXG4gICAgaWYgKHByb3AgaW4gZGl2LnN0eWxlKSByZXR1cm4gcHJvcDtcblxuICAgIHZhciBwcm9wID0gcHJvcC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHByb3Auc3Vic3RyKDEpO1xuICAgIGlmKGRvbVZlbmRvclByZWZpeCl7XG4gICAgICAgIHJldHVybiBkb21WZW5kb3JQcmVmaXggKyBwcm9wO1xuICAgIH1lbHNle1xuICAgICAgICBmb3IgKHZhciBpPTA7IGk8cHJlZml4ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciB2ZW5kb3JQcm9wID0gcHJlZml4ZXNbaV0gKyBwcm9wO1xuICAgICAgICAgICAgaWYgKHZlbmRvclByb3AgaW4gZGl2LnN0eWxlKSB7XG4gICAgICAgICAgICAgICAgZG9tVmVuZG9yUHJlZml4ID0gcHJlZml4ZXNbaV07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZlbmRvclByb3A7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpbnNlcnRSdWxlID0gcmVxdWlyZSgnLi9pbnNlcnRSdWxlJyk7XG52YXIgdmVuZG9yUHJlZml4ID0gcmVxdWlyZSgnLi9nZXRWZW5kb3JQcmVmaXgnKSgpO1xudmFyIGluZGV4ID0gMDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoa2V5ZnJhbWVzKSB7XG4gICAgLy8gcmFuZG9tIG5hbWVcbiAgICB2YXIgbmFtZSA9ICdhbmltXycrICgrK2luZGV4KSArICgrbmV3IERhdGUpO1xuICAgIHZhciBjc3MgPSBcIkBcIiArIHZlbmRvclByZWZpeCArIFwia2V5ZnJhbWVzIFwiICsgbmFtZSArIFwiIHtcIjtcblxuICAgIGZvciAodmFyIGtleSBpbiBrZXlmcmFtZXMpIHtcbiAgICAgICAgY3NzICs9IGtleSArIFwiIHtcIjtcblxuICAgICAgICBmb3IgKHZhciBwcm9wZXJ0eSBpbiBrZXlmcmFtZXNba2V5XSkge1xuICAgICAgICAgICAgdmFyIHBhcnQgPSBcIjpcIiArIGtleWZyYW1lc1trZXldW3Byb3BlcnR5XSArIFwiO1wiO1xuICAgICAgICAgICAgLy8gV2UgZG8gdmVuZG9yIHByZWZpeCBmb3IgZXZlcnkgcHJvcGVydHlcbiAgICAgICAgICAgIGNzcyArPSB2ZW5kb3JQcmVmaXggKyBwcm9wZXJ0eSArIHBhcnQ7XG4gICAgICAgICAgICBjc3MgKz0gcHJvcGVydHkgKyBwYXJ0O1xuICAgICAgICB9XG5cbiAgICAgICAgY3NzICs9IFwifVwiO1xuICAgIH1cblxuICAgIGNzcyArPSBcIn1cIjtcblxuICAgIGluc2VydFJ1bGUoY3NzKTtcblxuICAgIHJldHVybiBuYW1lXG59XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBleHRyYVNoZWV0O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjc3MpIHtcblxuICAgIGlmICghZXh0cmFTaGVldCkge1xuICAgICAgICAvLyBGaXJzdCB0aW1lLCBjcmVhdGUgYW4gZXh0cmEgc3R5bGVzaGVldCBmb3IgYWRkaW5nIHJ1bGVzXG4gICAgICAgIGV4dHJhU2hlZXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdLmFwcGVuZENoaWxkKGV4dHJhU2hlZXQpO1xuICAgICAgICAvLyBLZWVwIHJlZmVyZW5jZSB0byBhY3R1YWwgU3R5bGVTaGVldCBvYmplY3QgKGBzdHlsZVNoZWV0YCBmb3IgSUUgPCA5KVxuICAgICAgICBleHRyYVNoZWV0ID0gZXh0cmFTaGVldC5zaGVldCB8fCBleHRyYVNoZWV0LnN0eWxlU2hlZXQ7XG4gICAgfVxuXG4gICAgdmFyIGluZGV4ID0gKGV4dHJhU2hlZXQuY3NzUnVsZXMgfHwgZXh0cmFTaGVldC5ydWxlcykubGVuZ3RoO1xuICAgIGV4dHJhU2hlZXQuaW5zZXJ0UnVsZShjc3MsIGluZGV4KTtcblxuICAgIHJldHVybiBleHRyYVNoZWV0O1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEVWRU5UX05BTUVfTUFQIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIHdoaWNoIGV2ZW50IGZpcmVkIHdoZW4gYVxuICogdHJhbnNpdGlvbi9hbmltYXRpb24gZW5kcywgYmFzZWQgb24gdGhlIHN0eWxlIHByb3BlcnR5IHVzZWQgdG9cbiAqIGRlZmluZSB0aGF0IGV2ZW50LlxuICovXG52YXIgRVZFTlRfTkFNRV9NQVAgPSB7XG4gIHRyYW5zaXRpb25lbmQ6IHtcbiAgICAndHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAnV2Via2l0VHJhbnNpdGlvbic6ICd3ZWJraXRUcmFuc2l0aW9uRW5kJyxcbiAgICAnTW96VHJhbnNpdGlvbic6ICdtb3pUcmFuc2l0aW9uRW5kJyxcbiAgICAnT1RyYW5zaXRpb24nOiAnb1RyYW5zaXRpb25FbmQnLFxuICAgICdtc1RyYW5zaXRpb24nOiAnTVNUcmFuc2l0aW9uRW5kJ1xuICB9LFxuXG4gIGFuaW1hdGlvbmVuZDoge1xuICAgICdhbmltYXRpb24nOiAnYW5pbWF0aW9uZW5kJyxcbiAgICAnV2Via2l0QW5pbWF0aW9uJzogJ3dlYmtpdEFuaW1hdGlvbkVuZCcsXG4gICAgJ01vekFuaW1hdGlvbic6ICdtb3pBbmltYXRpb25FbmQnLFxuICAgICdPQW5pbWF0aW9uJzogJ29BbmltYXRpb25FbmQnLFxuICAgICdtc0FuaW1hdGlvbic6ICdNU0FuaW1hdGlvbkVuZCdcbiAgfVxufTtcblxudmFyIGVuZEV2ZW50cyA9IFtdO1xuXG5mdW5jdGlvbiBkZXRlY3RFdmVudHMoKSB7XG4gIHZhciB0ZXN0RWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdmFyIHN0eWxlID0gdGVzdEVsLnN0eWxlO1xuXG4gIC8vIE9uIHNvbWUgcGxhdGZvcm1zLCBpbiBwYXJ0aWN1bGFyIHNvbWUgcmVsZWFzZXMgb2YgQW5kcm9pZCA0LngsXG4gIC8vIHRoZSB1bi1wcmVmaXhlZCBcImFuaW1hdGlvblwiIGFuZCBcInRyYW5zaXRpb25cIiBwcm9wZXJ0aWVzIGFyZSBkZWZpbmVkIG9uIHRoZVxuICAvLyBzdHlsZSBvYmplY3QgYnV0IHRoZSBldmVudHMgdGhhdCBmaXJlIHdpbGwgc3RpbGwgYmUgcHJlZml4ZWQsIHNvIHdlIG5lZWRcbiAgLy8gdG8gY2hlY2sgaWYgdGhlIHVuLXByZWZpeGVkIGV2ZW50cyBhcmUgdXNlYWJsZSwgYW5kIGlmIG5vdCByZW1vdmUgdGhlbVxuICAvLyBmcm9tIHRoZSBtYXBcbiAgaWYgKCEoJ0FuaW1hdGlvbkV2ZW50JyBpbiB3aW5kb3cpKSB7XG4gICAgZGVsZXRlIEVWRU5UX05BTUVfTUFQLmFuaW1hdGlvbmVuZC5hbmltYXRpb247XG4gIH1cblxuICBpZiAoISgnVHJhbnNpdGlvbkV2ZW50JyBpbiB3aW5kb3cpKSB7XG4gICAgZGVsZXRlIEVWRU5UX05BTUVfTUFQLnRyYW5zaXRpb25lbmQudHJhbnNpdGlvbjtcbiAgfVxuXG4gIGZvciAodmFyIGJhc2VFdmVudE5hbWUgaW4gRVZFTlRfTkFNRV9NQVApIHtcbiAgICB2YXIgYmFzZUV2ZW50cyA9IEVWRU5UX05BTUVfTUFQW2Jhc2VFdmVudE5hbWVdO1xuICAgIGZvciAodmFyIHN0eWxlTmFtZSBpbiBiYXNlRXZlbnRzKSB7XG4gICAgICBpZiAoc3R5bGVOYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGVuZEV2ZW50cy5wdXNoKGJhc2VFdmVudHNbc3R5bGVOYW1lXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5pZih0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyl7XG4gIGRldGVjdEV2ZW50cygpO1xufVxuXG5cbi8vIFdlIHVzZSB0aGUgcmF3IHthZGR8cmVtb3ZlfUV2ZW50TGlzdGVuZXIoKSBjYWxsIGJlY2F1c2UgRXZlbnRMaXN0ZW5lclxuLy8gZG9lcyBub3Qga25vdyBob3cgdG8gcmVtb3ZlIGV2ZW50IGxpc3RlbmVycyBhbmQgd2UgcmVhbGx5IHNob3VsZFxuLy8gY2xlYW4gdXAuIEFsc28sIHRoZXNlIGV2ZW50cyBhcmUgbm90IHRyaWdnZXJlZCBpbiBvbGRlciBicm93c2Vyc1xuLy8gc28gd2Ugc2hvdWxkIGJlIEEtT0sgaGVyZS5cblxuZnVuY3Rpb24gYWRkRXZlbnRMaXN0ZW5lcihub2RlLCBldmVudE5hbWUsIGV2ZW50TGlzdGVuZXIpIHtcbiAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVyKG5vZGUsIGV2ZW50TmFtZSwgZXZlbnRMaXN0ZW5lcikge1xuICBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBldmVudExpc3RlbmVyLCBmYWxzZSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhZGRFbmRFdmVudExpc3RlbmVyOiBmdW5jdGlvbihub2RlLCBldmVudExpc3RlbmVyKSB7XG4gICAgaWYgKGVuZEV2ZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgIC8vIElmIENTUyB0cmFuc2l0aW9ucyBhcmUgbm90IHN1cHBvcnRlZCwgdHJpZ2dlciBhbiBcImVuZCBhbmltYXRpb25cIlxuICAgICAgLy8gZXZlbnQgaW1tZWRpYXRlbHkuXG4gICAgICB3aW5kb3cuc2V0VGltZW91dChldmVudExpc3RlbmVyLCAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZW5kRXZlbnRzLmZvckVhY2goZnVuY3Rpb24oZW5kRXZlbnQpIHtcbiAgICAgIGFkZEV2ZW50TGlzdGVuZXIobm9kZSwgZW5kRXZlbnQsIGV2ZW50TGlzdGVuZXIpO1xuICAgIH0pO1xuICB9LFxuXG4gIHJlbW92ZUVuZEV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uKG5vZGUsIGV2ZW50TGlzdGVuZXIpIHtcbiAgICBpZiAoZW5kRXZlbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBlbmRFdmVudHMuZm9yRWFjaChmdW5jdGlvbihlbmRFdmVudCkge1xuICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcihub2RlLCBlbmRFdmVudCwgZXZlbnRMaXN0ZW5lcik7XG4gICAgfSk7XG4gIH1cbn07XG4iLCJ2YXIgbW9kYWxGYWN0b3J5ID0gcmVxdWlyZSgnLi9tb2RhbEZhY3RvcnknKTtcbnZhciBpbnNlcnRLZXlmcmFtZXNSdWxlID0gcmVxdWlyZSgncmVhY3Qta2l0L2luc2VydEtleWZyYW1lc1J1bGUnKTtcbnZhciBhcHBlbmRWZW5kb3JQcmVmaXggPSByZXF1aXJlKCdyZWFjdC1raXQvYXBwZW5kVmVuZG9yUHJlZml4Jyk7XG5cbnZhciBhbmltYXRpb24gPSB7XG4gICAgc2hvdzoge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuNHMnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2N1YmljLWJlemllcigwLjcsMCwwLjMsMSknXG4gICAgfSxcblxuICAgIGhpZGU6IHtcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICcwLjRzJyxcbiAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICdjdWJpYy1iZXppZXIoMC43LDAsMC4zLDEpJ1xuICAgIH0sXG5cbiAgICBzaG93TW9kYWxBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoLTUwJSwgLTMwMHB4LCAwKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoLTUwJSwgLTUwJSwgMCknXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVNb2RhbEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUzZCgtNTAlLCAtNTAlLCAwKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoLTUwJSwgMTAwcHgsIDApJ1xuICAgICAgICB9XG4gICAgfSksXG5cbiAgICBzaG93QmFja2Ryb3BBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH0sXG4gICAgICAgICcxMDAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMC45XG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pLFxuXG4gICAgc2hvd0NvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMCwgLTIwcHgsIDApJ1xuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUzZCgwLCAwLCAwKSdcbiAgICAgICAgfVxuICAgIH0pLFxuXG4gICAgaGlkZUNvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMCwgMCwgMCknXG4gICAgICAgIH0sXG4gICAgICAgICcxMDAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZTNkKDAsIDUwcHgsIDApJ1xuICAgICAgICB9XG4gICAgfSlcbn07XG5cbnZhciBzaG93QW5pbWF0aW9uID0gYW5pbWF0aW9uLnNob3c7XG52YXIgaGlkZUFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlO1xudmFyIHNob3dNb2RhbEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93TW9kYWxBbmltYXRpb247XG52YXIgaGlkZU1vZGFsQW5pbWF0aW9uID0gYW5pbWF0aW9uLmhpZGVNb2RhbEFuaW1hdGlvbjtcbnZhciBzaG93QmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0JhY2tkcm9wQW5pbWF0aW9uO1xudmFyIGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQmFja2Ryb3BBbmltYXRpb247XG52YXIgc2hvd0NvbnRlbnRBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0NvbnRlbnRBbmltYXRpb247XG52YXIgaGlkZUNvbnRlbnRBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZUNvbnRlbnRBbmltYXRpb247XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kYWxGYWN0b3J5KHtcbiAgICBnZXRSZWY6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuICdtb2RhbCc7XG4gICAgfSxcbiAgICBnZXRNb2RhbFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgIHdpZHRoOiBcIjUwMHB4XCIsXG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwidHJhbnNsYXRlM2QoLTUwJSwgLTUwJSwgMClcIixcbiAgICAgICAgICAgIHRvcDogXCI1MCVcIixcbiAgICAgICAgICAgIGxlZnQ6IFwiNTAlXCIsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwid2hpdGVcIixcbiAgICAgICAgICAgIHpJbmRleDogMTA1MCxcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25EdXJhdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvbkZpbGxNb2RlOiAnZm9yd2FyZHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uTmFtZTogd2lsbEhpZGRlbiA/IGhpZGVNb2RhbEFuaW1hdGlvbiA6IHNob3dNb2RhbEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KVxuICAgIH0sXG4gICAgZ2V0QmFja2Ryb3BTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICB6SW5kZXg6IDEwNDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiIzM3M0E0N1wiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUJhY2tkcm9wQW5pbWF0aW9uIDogc2hvd0JhY2tkcm9wQW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0Q29udGVudFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25EZWxheTogJzAuMjVzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbk5hbWU6IHNob3dDb250ZW50QW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pXG4gICAgfVxufSk7XG4iLCJ2YXIgbW9kYWxGYWN0b3J5ID0gcmVxdWlyZSgnLi9tb2RhbEZhY3RvcnknKTtcbnZhciBpbnNlcnRLZXlmcmFtZXNSdWxlID0gcmVxdWlyZSgncmVhY3Qta2l0L2luc2VydEtleWZyYW1lc1J1bGUnKTtcbnZhciBhcHBlbmRWZW5kb3JQcmVmaXggPSByZXF1aXJlKCdyZWFjdC1raXQvYXBwZW5kVmVuZG9yUHJlZml4Jyk7XG5cbnZhciBhbmltYXRpb24gPSB7XG4gICAgc2hvdzoge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuM3MnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2Vhc2Utb3V0J1xuICAgIH0sXG4gICAgaGlkZToge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuM3MnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2Vhc2Utb3V0J1xuICAgIH0sXG4gICAgc2hvd0NvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuXG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVDb250ZW50QW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pLFxuXG4gICAgc2hvd0JhY2tkcm9wQW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgIH0pLFxuXG4gICAgaGlkZUJhY2tkcm9wQW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMC45XG4gICAgICAgIH0sXG4gICAgICAgICcxMDAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICB9XG4gICAgfSlcbn07XG5cbnZhciBzaG93QW5pbWF0aW9uID0gYW5pbWF0aW9uLnNob3c7XG52YXIgaGlkZUFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlO1xudmFyIHNob3dDb250ZW50QW5pbWF0aW9uID0gYW5pbWF0aW9uLnNob3dDb250ZW50QW5pbWF0aW9uO1xudmFyIGhpZGVDb250ZW50QW5pbWF0aW9uID0gYW5pbWF0aW9uLmhpZGVDb250ZW50QW5pbWF0aW9uO1xudmFyIHNob3dCYWNrZHJvcEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93QmFja2Ryb3BBbmltYXRpb247XG52YXIgaGlkZUJhY2tkcm9wQW5pbWF0aW9uID0gYW5pbWF0aW9uLmhpZGVCYWNrZHJvcEFuaW1hdGlvbjtcblxubW9kdWxlLmV4cG9ydHMgPSBtb2RhbEZhY3Rvcnkoe1xuICAgIGdldFJlZjogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gJ2NvbnRlbnQnO1xuICAgIH0sXG4gICAgZ2V0TW9kYWxTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHpJbmRleDogMTA1MCxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB3aWR0aDogXCI1MDBweFwiLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZTNkKC01MCUsIC01MCUsIDApXCIsXG4gICAgICAgICAgICB0b3A6IFwiNTAlXCIsXG4gICAgICAgICAgICBsZWZ0OiBcIjUwJVwiXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBnZXRCYWNrZHJvcFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgIHpJbmRleDogMTA0MCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjMzczQTQ3XCIsXG4gICAgICAgICAgICBhbmltYXRpb25GaWxsTW9kZTogJ2ZvcndhcmRzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAnMC4zcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUJhY2tkcm9wQW5pbWF0aW9uIDogc2hvd0JhY2tkcm9wQW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0Q29udGVudFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIndoaXRlXCIsXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogKHdpbGxIaWRkZW4gPyBoaWRlQW5pbWF0aW9uIDogc2hvd0FuaW1hdGlvbikuYW5pbWF0aW9uRHVyYXRpb24sXG4gICAgICAgICAgICBhbmltYXRpb25GaWxsTW9kZTogJ2ZvcndhcmRzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbk5hbWU6IHdpbGxIaWRkZW4gPyBoaWRlQ29udGVudEFuaW1hdGlvbiA6IHNob3dDb250ZW50QW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pXG4gICAgfVxufSk7XG4iLCJ2YXIgbW9kYWxGYWN0b3J5ID0gcmVxdWlyZSgnLi9tb2RhbEZhY3RvcnknKTtcbnZhciBpbnNlcnRLZXlmcmFtZXNSdWxlID0gcmVxdWlyZSgncmVhY3Qta2l0L2luc2VydEtleWZyYW1lc1J1bGUnKTtcbnZhciBhcHBlbmRWZW5kb3JQcmVmaXggPSByZXF1aXJlKCdyZWFjdC1raXQvYXBwZW5kVmVuZG9yUHJlZml4Jyk7XG5cbnZhciBhbmltYXRpb24gPSB7XG4gICAgc2hvdzoge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuNXMnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2Vhc2Utb3V0J1xuICAgIH0sXG4gICAgaGlkZToge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuNXMnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2Vhc2Utb3V0J1xuICAgIH0sXG4gICAgc2hvd0NvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuXG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICd0cmFuc2xhdGUzZChjYWxjKC0xMDB2dyAtIDUwJSksIDAsIDApJ1xuICAgICAgICB9LFxuICAgICAgICAnNTAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ3RyYW5zbGF0ZTNkKDEwMHB4LCAwLCAwKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMCwgMCwgMCknXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVDb250ZW50QW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcblxuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoMCwgMCwgMCknXG4gICAgICAgIH0sXG4gICAgICAgICc1MCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoLTEwMHB4LCAwLCAwKSBzY2FsZTNkKDEuMSwgMS4xLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAndHJhbnNsYXRlM2QoY2FsYygxMDB2dyArIDUwJSksIDAsIDApJ1xuICAgICAgICB9LFxuICAgIH0pLFxuXG4gICAgc2hvd0JhY2tkcm9wQW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgIH0pLFxuXG4gICAgaGlkZUJhY2tkcm9wQW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMC45XG4gICAgICAgIH0sXG4gICAgICAgICc5MCUnOiB7XG4gICAgICAgICAgICBvcGFjdGl5OiAwLjlcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwXG4gICAgICAgIH1cbiAgICB9KVxufTtcblxudmFyIHNob3dBbmltYXRpb24gPSBhbmltYXRpb24uc2hvdztcbnZhciBoaWRlQW5pbWF0aW9uID0gYW5pbWF0aW9uLmhpZGU7XG52YXIgc2hvd0NvbnRlbnRBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0NvbnRlbnRBbmltYXRpb247XG52YXIgaGlkZUNvbnRlbnRBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZUNvbnRlbnRBbmltYXRpb247XG52YXIgc2hvd0JhY2tkcm9wQW5pbWF0aW9uID0gYW5pbWF0aW9uLnNob3dCYWNrZHJvcEFuaW1hdGlvbjtcbnZhciBoaWRlQmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZUJhY2tkcm9wQW5pbWF0aW9uO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG1vZGFsRmFjdG9yeSh7XG4gICAgZ2V0UmVmOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiAnY29udGVudCc7XG4gICAgfSxcbiAgICBnZXRNb2RhbFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgekluZGV4OiAxMDUwLFxuICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgIHdpZHRoOiBcIjUwMHB4XCIsXG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwidHJhbnNsYXRlM2QoLTUwJSwgLTUwJSwgMClcIixcbiAgICAgICAgICAgIHRvcDogXCI1MCVcIixcbiAgICAgICAgICAgIGxlZnQ6IFwiNTAlXCJcbiAgICAgICAgfSlcbiAgICB9LFxuICAgIGdldEJhY2tkcm9wU3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgICAgICAgdG9wOiAwLFxuICAgICAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgICAgICBib3R0b206IDAsXG4gICAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICAgICAgekluZGV4OiAxMDQwLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIiMzNzNBNDdcIixcbiAgICAgICAgICAgIGFuaW1hdGlvbkZpbGxNb2RlOiAnZm9yd2FyZHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICcwLjNzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbk5hbWU6IHdpbGxIaWRkZW4gPyBoaWRlQmFja2Ryb3BBbmltYXRpb24gOiBzaG93QmFja2Ryb3BBbmltYXRpb24sXG4gICAgICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogKHdpbGxIaWRkZW4gPyBoaWRlQW5pbWF0aW9uIDogc2hvd0FuaW1hdGlvbikuYW5pbWF0aW9uVGltaW5nRnVuY3Rpb25cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBnZXRDb250ZW50U3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwid2hpdGVcIixcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25EdXJhdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvbkZpbGxNb2RlOiAnZm9yd2FyZHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uTmFtZTogd2lsbEhpZGRlbiA/IGhpZGVDb250ZW50QW5pbWF0aW9uIDogc2hvd0NvbnRlbnRBbmltYXRpb24sXG4gICAgICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogKHdpbGxIaWRkZW4gPyBoaWRlQW5pbWF0aW9uIDogc2hvd0FuaW1hdGlvbikuYW5pbWF0aW9uVGltaW5nRnVuY3Rpb25cbiAgICAgICAgfSlcbiAgICB9XG59KTtcbiIsInZhciBtb2RhbEZhY3RvcnkgPSByZXF1aXJlKCcuL21vZGFsRmFjdG9yeScpO1xuXG52YXIgUmVhY3QgPSByZXF1aXJlKCdyZWFjdCcpO1xudmFyIGluc2VydEtleWZyYW1lc1J1bGUgPSByZXF1aXJlKCdyZWFjdC1raXQvaW5zZXJ0S2V5ZnJhbWVzUnVsZScpO1xudmFyIGFwcGVuZFZlbmRvclByZWZpeCA9IHJlcXVpcmUoJ3JlYWN0LWtpdC9hcHBlbmRWZW5kb3JQcmVmaXgnKTtcblxudmFyIGFuaW1hdGlvbiA9IHtcbiAgICBzaG93OiB7XG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAnMC44cycsXG4gICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAnY3ViaWMtYmV6aWVyKDAuNiwwLDAuNCwxKSdcbiAgICB9LFxuICAgIGhpZGU6IHtcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICcwLjRzJyxcbiAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICdlYXNlLW91dCdcbiAgICB9LFxuICAgIHNob3dDb250ZW50QW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgfSxcbiAgICAgICAgJzQwJSc6e1xuICAgICAgICAgICAgb3BhY2l0eTogMFxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVDb250ZW50QW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIHNob3dCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLjlcbiAgICAgICAgfSxcbiAgICB9KSxcblxuICAgIGhpZGVCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG52YXIgc2hvd0FuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93O1xudmFyIGhpZGVBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZTtcbnZhciBzaG93Q29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93Q29udGVudEFuaW1hdGlvbjtcbnZhciBoaWRlQ29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQ29udGVudEFuaW1hdGlvbjtcbnZhciBzaG93QmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0JhY2tkcm9wQW5pbWF0aW9uO1xudmFyIGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQmFja2Ryb3BBbmltYXRpb247XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kYWxGYWN0b3J5KHtcbiAgICBnZXRSZWY6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuICdjb250ZW50JztcbiAgICB9LFxuICAgIGdldFNoYXJwOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHZhciBzdHJva2VEYXNoTGVuZ3RoID0gMTY4MDtcblxuICAgICAgICB2YXIgc2hvd1NoYXJwQW5pbWF0aW9uID0gaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICAgICAgJ3N0cm9rZS1kYXNob2Zmc2V0Jzogc3Ryb2tlRGFzaExlbmd0aFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICcxMDAlJzoge1xuICAgICAgICAgICAgICAgICdzdHJva2UtZGFzaG9mZnNldCc6IDBcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgdmFyIHNoYXJwU3R5bGUgPSB7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIHdpZHRoOiAnY2FsYygxMDAlKScsXG4gICAgICAgICAgICBoZWlnaHQ6ICdjYWxjKDEwMCUpJyxcbiAgICAgICAgICAgIHpJbmRleDogJy0xJ1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciByZWN0U3R5bGUgPSBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246IHdpbGxIaWRkZW4/ICcwLjRzJyA6JzAuOHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuPyBoaWRlQ29udGVudEFuaW1hdGlvbjogc2hvd1NoYXJwQW5pbWF0aW9uLFxuICAgICAgICAgICAgc3Ryb2tlOiAnI2ZmZmZmZicsXG4gICAgICAgICAgICBzdHJva2VXaWR0aDogJzJweCcsXG4gICAgICAgICAgICBzdHJva2VEYXNoYXJyYXk6IHN0cm9rZURhc2hMZW5ndGhcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge3N0eWxlOiBzaGFycFN0eWxlfSwgXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwic3ZnXCIsIHtcbiAgICAgICAgICAgICAgICB4bWxuczogXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLCBcbiAgICAgICAgICAgICAgICB3aWR0aDogXCIxMDAlXCIsIFxuICAgICAgICAgICAgICAgIGhlaWdodDogXCIxMDAlXCIsIFxuICAgICAgICAgICAgICAgIHZpZXdCb3g6IFwiMCAwIDQ5NiAxMzZcIiwgXG4gICAgICAgICAgICAgICAgcHJlc2VydmVBc3BlY3RSYXRpbzogXCJub25lXCJ9LCBcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwicmVjdFwiLCB7c3R5bGU6IHJlY3RTdHlsZSwgXG4gICAgICAgICAgICAgICAgICAgIHg6IFwiMlwiLCBcbiAgICAgICAgICAgICAgICAgICAgeTogXCIyXCIsIFxuICAgICAgICAgICAgICAgICAgICBmaWxsOiBcIm5vbmVcIiwgXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBcIjQ5MlwiLCBcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBcIjEzMlwifSlcbiAgICAgICAgICAgIClcbiAgICAgICAgKVxuICAgIH0sXG4gICAgZ2V0TW9kYWxTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHpJbmRleDogMTA1MCxcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB3aWR0aDogXCI1MDBweFwiLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZTNkKC01MCUsIC01MCUsIDApXCIsXG4gICAgICAgICAgICB0b3A6IFwiNTAlXCIsXG4gICAgICAgICAgICBsZWZ0OiBcIjUwJVwiXG4gICAgICAgIH0pXG4gICAgfSxcbiAgICBnZXRCYWNrZHJvcFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgIHRvcDogMCxcbiAgICAgICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICAgICAgbGVmdDogMCxcbiAgICAgICAgICAgIHpJbmRleDogMTA0MCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjMzczQTQ3XCIsXG4gICAgICAgICAgICBhbmltYXRpb25GaWxsTW9kZTogJ2ZvcndhcmRzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAnMC40cycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUJhY2tkcm9wQW5pbWF0aW9uIDogc2hvd0JhY2tkcm9wQW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgZ2V0Q29udGVudFN0eWxlOiBmdW5jdGlvbih3aWxsSGlkZGVuKSB7XG4gICAgICAgIHJldHVybiBhcHBlbmRWZW5kb3JQcmVmaXgoe1xuICAgICAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBcIndoaXRlXCIsXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogKHdpbGxIaWRkZW4gPyBoaWRlQW5pbWF0aW9uIDogc2hvd0FuaW1hdGlvbikuYW5pbWF0aW9uRHVyYXRpb24sXG4gICAgICAgICAgICBhbmltYXRpb25GaWxsTW9kZTogJ2ZvcndhcmRzJyxcbiAgICAgICAgICAgIGFuaW1hdGlvbk5hbWU6IHdpbGxIaWRkZW4gPyBoaWRlQ29udGVudEFuaW1hdGlvbiA6IHNob3dDb250ZW50QW5pbWF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uVGltaW5nRnVuY3Rpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uXG4gICAgICAgIH0pXG4gICAgfVxufSk7XG4iLCJ2YXIgbW9kYWxGYWN0b3J5ID0gcmVxdWlyZSgnLi9tb2RhbEZhY3RvcnknKTtcbnZhciBpbnNlcnRLZXlmcmFtZXNSdWxlID0gcmVxdWlyZSgncmVhY3Qta2l0L2luc2VydEtleWZyYW1lc1J1bGUnKTtcbnZhciBhcHBlbmRWZW5kb3JQcmVmaXggPSByZXF1aXJlKCdyZWFjdC1raXQvYXBwZW5kVmVuZG9yUHJlZml4Jyk7XG5cbnZhciBhbmltYXRpb24gPSB7XG4gICAgc2hvdzoge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuNHMnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2N1YmljLWJlemllcigwLjYsMCwwLjQsMSknXG4gICAgfSxcbiAgICBoaWRlOiB7XG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAnMC40cycsXG4gICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAnZWFzZS1vdXQnXG4gICAgfSxcbiAgICBzaG93Q29udGVudEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdzY2FsZTNkKDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdzY2FsZTNkKDEsIDEsIDEpJ1xuICAgICAgICB9XG4gICAgfSksXG5cbiAgICBoaWRlQ29udGVudEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDFcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAnc2NhbGUzZCgwLjUsIDAuNSwgMSknXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIHNob3dCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLjlcbiAgICAgICAgfSxcbiAgICB9KSxcblxuICAgIGhpZGVCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG52YXIgc2hvd0FuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93O1xudmFyIGhpZGVBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZTtcbnZhciBzaG93Q29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93Q29udGVudEFuaW1hdGlvbjtcbnZhciBoaWRlQ29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQ29udGVudEFuaW1hdGlvbjtcbnZhciBzaG93QmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0JhY2tkcm9wQW5pbWF0aW9uO1xudmFyIGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQmFja2Ryb3BBbmltYXRpb247XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kYWxGYWN0b3J5KHtcbiAgICBnZXRSZWY6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuICdjb250ZW50JztcbiAgICB9LFxuICAgIGdldE1vZGFsU3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICB6SW5kZXg6IDEwNTAsXG4gICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgICAgICAgd2lkdGg6IFwiNTAwcHhcIixcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUzZCgtNTAlLCAtNTAlLCAwKVwiLFxuICAgICAgICAgICAgdG9wOiBcIjUwJVwiLFxuICAgICAgICAgICAgbGVmdDogXCI1MCVcIlxuICAgICAgICB9KVxuICAgIH0sXG4gICAgZ2V0QmFja2Ryb3BTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICB6SW5kZXg6IDEwNDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiIzM3M0E0N1wiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuNHMnLFxuICAgICAgICAgICAgYW5pbWF0aW9uTmFtZTogd2lsbEhpZGRlbiA/IGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA6IHNob3dCYWNrZHJvcEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldENvbnRlbnRTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIG1hcmdpbjogMCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUNvbnRlbnRBbmltYXRpb24gOiBzaG93Q29udGVudEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KVxuICAgIH1cbn0pO1xuIiwidmFyIG1vZGFsRmFjdG9yeSA9IHJlcXVpcmUoJy4vbW9kYWxGYWN0b3J5Jyk7XG52YXIgaW5zZXJ0S2V5ZnJhbWVzUnVsZSA9IHJlcXVpcmUoJ3JlYWN0LWtpdC9pbnNlcnRLZXlmcmFtZXNSdWxlJyk7XG52YXIgYXBwZW5kVmVuZG9yUHJlZml4ID0gcmVxdWlyZSgncmVhY3Qta2l0L2FwcGVuZFZlbmRvclByZWZpeCcpO1xuXG52YXIgYW5pbWF0aW9uID0ge1xuICAgIHNob3c6IHtcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICcxcycsXG4gICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAnbGluZWFyJ1xuICAgIH0sXG4gICAgaGlkZToge1xuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuM3MnLFxuICAgICAgICBhbmltYXRpb25UaW1pbmdGdW5jdGlvbjogJ2Vhc2Utb3V0J1xuICAgIH0sXG4gICAgc2hvd0NvbnRlbnRBbmltYXRpb246IGluc2VydEtleWZyYW1lc1J1bGUoe1xuICAgICAgICAnMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC43LCAwLCAwLCAwLCAwLCAwLjcsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMi4wODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC43NTI2NiwgMCwgMCwgMCwgMCwgMC43NjM0MiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc0LjE2NjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjgxMDcxLCAwLCAwLCAwLCAwLCAwLjg0NTQ1LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzYuMjUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC44NjgwOCwgMCwgMCwgMCwgMCwgMC45Mjg2LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzguMzMzMzMzJSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDAuOTIwMzgsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMTAuNDE2NjY3JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDAuOTY0ODIsIDAsIDAsIDAsIDAsIDEuMDUyMDIsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMTIuNSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLCAwLCAwLCAwLCAwLCAxLjA4MjA0LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzE0LjU4MzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAyNTYzLCAwLCAwLCAwLCAwLCAxLjA5MTQ5LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzE2LjY2NjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjA0MjI3LCAwLCAwLCAwLCAwLCAxLjA4NDUzLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzE4Ljc1JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDUxMDIsIDAsIDAsIDAsIDAsIDEuMDY2NjYsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMjAuODMzMzMzJSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDUzMzQsIDAsIDAsIDAsIDAsIDEuMDQzNTUsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMjIuOTE2NjY3JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDUwNzgsIDAsIDAsIDAsIDAsIDEuMDIwMTIsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnMjUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wNDQ4NywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICcyNy4wODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMzY5OSwgMCwgMCwgMCwgMCwgMC45ODUzNCwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICcyOS4xNjY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMjgzMSwgMCwgMCwgMCwgMCwgMC45NzY4OCwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICczMS4yNSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAxOTczLCAwLCAwLCAwLCAwLCAwLjk3NDIyLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzMzLjMzMzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAxMTkxLCAwLCAwLCAwLCAwLCAwLjk3NjE4LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzM1LjQxNjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwNTI2LCAwLCAwLCAwLCAwLCAwLjk4MTIyLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzM3LjUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMSwgMCwgMCwgMCwgMCwgMC45ODc3MywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICczOS41ODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTYxNywgMCwgMCwgMCwgMCwgMC45OTQzMywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc0MS42NjY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTM2OCwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc0My43NSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5MjM3LCAwLCAwLCAwLCAwLCAxLjAwNDEzLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzQ1LjgzMzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5MjAyLCAwLCAwLCAwLCAwLCAxLjAwNjUxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzQ3LjkxNjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5MjQxLCAwLCAwLCAwLCAwLCAxLjAwNzI2LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzUwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5MzI5LCAwLCAwLCAwLCAwLCAxLjAwNjcxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzUyLjA4MzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5NDQ3LCAwLCAwLCAwLCAwLCAxLjAwNTI5LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzU0LjE2NjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5NTc3LCAwLCAwLCAwLCAwLCAxLjAwMzQ2LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzU2LjI1JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDAuOTk3MDUsIDAsIDAsIDAsIDAsIDEuMDAxNiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc1OC4zMzMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTgyMiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc2MC40MTY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTkyMSwgMCwgMCwgMCwgMCwgMC45OTg4NCwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc2Mi41JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEsIDAsIDAsIDAsIDAsIDAuOTk4MTYsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnNjQuNTgzMzMzJSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDAwNTcsIDAsIDAsIDAsIDAsIDAuOTk3OTUsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnNjYuNjY2NjY3JSc6IHtcbiAgICAgICAgICAgIHRyYW5zZm9ybTogJ21hdHJpeDNkKDEuMDAwOTUsIDAsIDAsIDAsIDAsIDAuOTk4MTEsIDAsIDAsIDAsIDAsIDEsIDAsIDAsIDAsIDAsIDEpJ1xuICAgICAgICB9LFxuICAgICAgICAnNjguNzUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDExNCwgMCwgMCwgMCwgMCwgMC45OTg1MSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3MC44MzMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDExOSwgMCwgMCwgMCwgMCwgMC45OTkwMywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3Mi45MTY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDExNCwgMCwgMCwgMCwgMCwgMC45OTk1NSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3NSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3Ny4wODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDA4MywgMCwgMCwgMCwgMCwgMS4wMDAzMywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc3OS4xNjY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMS4wMDA2MywgMCwgMCwgMCwgMCwgMS4wMDA1MiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc4MS4yNSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwMDQ0LCAwLCAwLCAwLCAwLCAxLjAwMDU4LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzgzLjMzMzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwMDI3LCAwLCAwLCAwLCAwLCAxLjAwMDUzLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzg1LjQxNjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgxLjAwMDEyLCAwLCAwLCAwLCAwLCAxLjAwMDQyLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzg3LjUlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMSwgMCwgMCwgMCwgMCwgMS4wMDAyNywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc4OS41ODMzMzMlJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTk5MSwgMCwgMCwgMCwgMCwgMS4wMDAxMywgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc5MS42NjY2NjclJzoge1xuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMC45OTk4NiwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH0sXG4gICAgICAgICc5My43NSUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5OTgzLCAwLCAwLCAwLCAwLCAwLjk5OTkxLCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzk1LjgzMzMzMyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5OTgyLCAwLCAwLCAwLCAwLCAwLjk5OTg1LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzk3LjkxNjY2NyUnOiB7XG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdtYXRyaXgzZCgwLjk5OTgzLCAwLCAwLCAwLCAwLCAwLjk5OTg0LCAwLCAwLCAwLCAwLCAxLCAwLCAwLCAwLCAwLCAxKSdcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiAnbWF0cml4M2QoMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSwgMCwgMCwgMCwgMCwgMSknXG4gICAgICAgIH1cbiAgICB9KSxcblxuICAgIGhpZGVDb250ZW50QW5pbWF0aW9uOiBpbnNlcnRLZXlmcmFtZXNSdWxlKHtcbiAgICAgICAgJzAlJzoge1xuICAgICAgICAgICAgb3BhY2l0eTogMVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB0cmFuc2Zvcm06ICdzY2FsZTNkKDAuOCwgMC44LCAxKSdcbiAgICAgICAgfSxcbiAgICB9KSxcblxuICAgIHNob3dCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfSxcbiAgICAgICAgJzEwMCUnOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAwLjlcbiAgICAgICAgfSxcbiAgICB9KSxcblxuICAgIGhpZGVCYWNrZHJvcEFuaW1hdGlvbjogaW5zZXJ0S2V5ZnJhbWVzUnVsZSh7XG4gICAgICAgICcwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDAuOVxuICAgICAgICB9LFxuICAgICAgICAnMTAwJSc6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDBcbiAgICAgICAgfVxuICAgIH0pXG59O1xuXG52YXIgc2hvd0FuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93O1xudmFyIGhpZGVBbmltYXRpb24gPSBhbmltYXRpb24uaGlkZTtcbnZhciBzaG93Q29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5zaG93Q29udGVudEFuaW1hdGlvbjtcbnZhciBoaWRlQ29udGVudEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQ29udGVudEFuaW1hdGlvbjtcbnZhciBzaG93QmFja2Ryb3BBbmltYXRpb24gPSBhbmltYXRpb24uc2hvd0JhY2tkcm9wQW5pbWF0aW9uO1xudmFyIGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA9IGFuaW1hdGlvbi5oaWRlQmFja2Ryb3BBbmltYXRpb247XG5cbm1vZHVsZS5leHBvcnRzID0gbW9kYWxGYWN0b3J5KHtcbiAgICBnZXRSZWY6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuICdjb250ZW50JztcbiAgICB9LFxuICAgIGdldE1vZGFsU3R5bGU6IGZ1bmN0aW9uKHdpbGxIaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuIGFwcGVuZFZlbmRvclByZWZpeCh7XG4gICAgICAgICAgICB6SW5kZXg6IDEwNTAsXG4gICAgICAgICAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICAgICAgICAgICAgd2lkdGg6IFwiNTAwcHhcIixcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJ0cmFuc2xhdGUzZCgtNTAlLCAtNTAlLCAwKVwiLFxuICAgICAgICAgICAgdG9wOiBcIjUwJVwiLFxuICAgICAgICAgICAgbGVmdDogXCI1MCVcIlxuICAgICAgICB9KVxuICAgIH0sXG4gICAgZ2V0QmFja2Ryb3BTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICByaWdodDogMCxcbiAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICB6SW5kZXg6IDEwNDAsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiIzM3M0E0N1wiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogJzAuM3MnLFxuICAgICAgICAgICAgYW5pbWF0aW9uTmFtZTogd2lsbEhpZGRlbiA/IGhpZGVCYWNrZHJvcEFuaW1hdGlvbiA6IHNob3dCYWNrZHJvcEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldENvbnRlbnRTdHlsZTogZnVuY3Rpb24od2lsbEhpZGRlbikge1xuICAgICAgICByZXR1cm4gYXBwZW5kVmVuZG9yUHJlZml4KHtcbiAgICAgICAgICAgIG1hcmdpbjogMCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCJ3aGl0ZVwiLFxuICAgICAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246ICh3aWxsSGlkZGVuID8gaGlkZUFuaW1hdGlvbiA6IHNob3dBbmltYXRpb24pLmFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgYW5pbWF0aW9uRmlsbE1vZGU6ICdmb3J3YXJkcycsXG4gICAgICAgICAgICBhbmltYXRpb25OYW1lOiB3aWxsSGlkZGVuID8gaGlkZUNvbnRlbnRBbmltYXRpb24gOiBzaG93Q29udGVudEFuaW1hdGlvbixcbiAgICAgICAgICAgIGFuaW1hdGlvblRpbWluZ0Z1bmN0aW9uOiAod2lsbEhpZGRlbiA/IGhpZGVBbmltYXRpb24gOiBzaG93QW5pbWF0aW9uKS5hbmltYXRpb25UaW1pbmdGdW5jdGlvblxuICAgICAgICB9KVxuICAgIH1cbn0pO1xuIiwidmFyIFJlYWN0ID0gcmVxdWlyZSgncmVhY3QnKTtcbnZhciB0cmFuc2l0aW9uRXZlbnRzID0gcmVxdWlyZSgncmVhY3Qta2l0L3RyYW5zaXRpb25FdmVudHMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhbmltYXRpb24pe1xuXG4gICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUNsYXNzKHtcbiAgICAgICAgcHJvcFR5cGVzOiB7XG4gICAgICAgICAgICBjbGFzc05hbWU6IFJlYWN0LlByb3BUeXBlcy5zdHJpbmcsXG4gICAgICAgICAgICAvLyBDbG9zZSB0aGUgbW9kYWwgd2hlbiBlc2MgaXMgcHJlc3NlZD8gRGVmYXVsdHMgdG8gdHJ1ZS5cbiAgICAgICAgICAgIGtleWJvYXJkOiBSZWFjdC5Qcm9wVHlwZXMuYm9vbCxcbiAgICAgICAgICAgIG9uU2hvdzogUmVhY3QuUHJvcFR5cGVzLmZ1bmMsXG4gICAgICAgICAgICBvbkhpZGU6IFJlYWN0LlByb3BUeXBlcy5mdW5jLFxuICAgICAgICAgICAgYW5pbWF0aW9uOiBSZWFjdC5Qcm9wVHlwZXMub2JqZWN0LFxuICAgICAgICAgICAgYmFja2Ryb3A6IFJlYWN0LlByb3BUeXBlcy5vbmVPZlR5cGUoW1xuICAgICAgICAgICAgICAgIFJlYWN0LlByb3BUeXBlcy5ib29sLFxuICAgICAgICAgICAgICAgIFJlYWN0LlByb3BUeXBlcy5zdHJpbmdcbiAgICAgICAgICAgIF0pXG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0RGVmYXVsdFByb3BzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcIlwiLFxuICAgICAgICAgICAgICAgIG9uU2hvdzogZnVuY3Rpb24oKXt9LFxuICAgICAgICAgICAgICAgIG9uSGlkZTogZnVuY3Rpb24oKXt9LFxuICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogYW5pbWF0aW9uLFxuICAgICAgICAgICAgICAgIGtleWJvYXJkOiB0cnVlLFxuICAgICAgICAgICAgICAgIGJhY2tkcm9wOiB0cnVlXG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgd2lsbEhpZGRlbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgaGlkZGVuOiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGFzSGlkZGVuOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3RhdGUuaGlkZGVuO1xuICAgICAgICB9LFxuXG4gICAgICAgIGhhbmRsZUJhY2tkcm9wQ2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYodGhpcy5wcm9wcy5jbG9zZU9uQ2xpY2spIHtcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByZWYgPSB0aGlzLnByb3BzLmFuaW1hdGlvbi5nZXRSZWYoKTtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5yZWZzW3JlZl0uZ2V0RE9NTm9kZSgpO1xuICAgICAgICAgICAgdmFyIGVuZExpc3RlbmVyID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIGlmIChlICYmIGUudGFyZ2V0ICE9PSBub2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbkV2ZW50cy5yZW1vdmVFbmRFdmVudExpc3RlbmVyKG5vZGUsIGVuZExpc3RlbmVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVudGVyKCk7XG5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgIHRyYW5zaXRpb25FdmVudHMuYWRkRW5kRXZlbnRMaXN0ZW5lcihub2RlLCBlbmRMaXN0ZW5lcik7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVuZGVyOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgdmFyIGhpZGRlbiA9IHRoaXMuaGFzSGlkZGVuKCk7XG4gICAgICAgICAgICBpZihoaWRkZW4pIHJldHVybiBudWxsO1xuXG4gICAgICAgICAgICB2YXIgd2lsbEhpZGRlbiA9IHRoaXMuc3RhdGUud2lsbEhpZGRlbjtcbiAgICAgICAgICAgIHZhciBhbmltYXRpb24gPSB0aGlzLnByb3BzLmFuaW1hdGlvbjtcbiAgICAgICAgICAgIHZhciBtb2RhbFN0eWxlID0gYW5pbWF0aW9uLmdldE1vZGFsU3R5bGUod2lsbEhpZGRlbik7XG4gICAgICAgICAgICB2YXIgYmFja2Ryb3BTdHlsZSA9IGFuaW1hdGlvbi5nZXRCYWNrZHJvcFN0eWxlKHdpbGxIaWRkZW4pO1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRTdHlsZSA9IGFuaW1hdGlvbi5nZXRDb250ZW50U3R5bGUod2lsbEhpZGRlbik7XG4gICAgICAgICAgICB2YXIgcmVmID0gYW5pbWF0aW9uLmdldFJlZih3aWxsSGlkZGVuKTtcbiAgICAgICAgICAgIHZhciBzaGFycCA9IGFuaW1hdGlvbi5nZXRTaGFycCAmJiBhbmltYXRpb24uZ2V0U2hhcnAod2lsbEhpZGRlbik7XG4gICAgICAgICAgICB2YXIgYmFja2Ryb3AgPSB0aGlzLnByb3BzLmJhY2tkcm9wPyBSZWFjdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHtvbkNsaWNrOiB0aGlzLmhhbmRsZUJhY2tkcm9wQ2xpY2ssIHN0eWxlOiBiYWNrZHJvcFN0eWxlfSk6IHVuZGVmaW5lZDtcblxuICAgICAgICAgICAgaWYod2lsbEhpZGRlbikge1xuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5yZWZzW3JlZl0uZ2V0RE9NTm9kZSgpO1xuICAgICAgICAgICAgICAgIHZhciBlbmRMaXN0ZW5lciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGUgJiYgZS50YXJnZXQgIT09IG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zaXRpb25FdmVudHMucmVtb3ZlRW5kRXZlbnRMaXN0ZW5lcihub2RlLCBlbmRMaXN0ZW5lcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGVhdmUoKTtcblxuICAgICAgICAgICAgICAgIH0uYmluZCh0aGlzKTtcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uRXZlbnRzLmFkZEVuZEV2ZW50TGlzdGVuZXIobm9kZSwgZW5kTGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIsIG51bGwsIFxuICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge3JlZjogXCJtb2RhbFwiLCBzdHlsZTogbW9kYWxTdHlsZSwgY2xhc3NOYW1lOiB0aGlzLnByb3BzLmNsYXNzTmFtZX0sIFxuICAgICAgICAgICAgICAgICAgICBzaGFycCwgXG4gICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge3JlZjogXCJjb250ZW50XCIsIHRhYkluZGV4OiBcIi0xXCIsIHN0eWxlOiBjb250ZW50U3R5bGV9LCBcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMuY2hpbGRyZW5cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICksIFxuICAgICAgICAgICAgICAgIGJhY2tkcm9wXG4gICAgICAgICAgICAgKSlcbiAgICAgICAgICAgIDtcbiAgICAgICAgfSxcblxuICAgICAgICBsZWF2ZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICAgICAgICAgIGhpZGRlbjogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLnByb3BzLm9uSGlkZSgpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGVudGVyOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdGhpcy5wcm9wcy5vblNob3coKTtcbiAgICAgICAgfSxcblxuICAgICAgICBzaG93OiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYoIXRoaXMuaGFzSGlkZGVuKCkpIHJldHVybjtcblxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgd2lsbEhpZGRlbjogZmFsc2UsXG4gICAgICAgICAgICAgICAgaGlkZGVuOiBmYWxzZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaGlkZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGlmKHRoaXMuaGFzSGlkZGVuKCkpIHJldHVybjtcblxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgICAgICAgICAgd2lsbEhpZGRlbjogdHJ1ZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdG9nZ2xlOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYodGhpcy5oYXNIaWRkZW4oKSlcbiAgICAgICAgICAgICAgICB0aGlzLnNob3coKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB0aGlzLmhpZGUoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBsaXN0ZW5LZXlib2FyZDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzLmtleWJvYXJkICYmXG4gICAgICAgICAgICAgICAgICAgIChldmVudC5rZXkgPT09IFwiRXNjYXBlXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgIGV2ZW50LmtleUNvZGUgPT09IDI3KSkge1xuICAgICAgICAgICAgICAgIHRoaXMuaGlkZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmxpc3RlbktleWJvYXJkLCB0cnVlKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgdGhpcy5saXN0ZW5LZXlib2FyZCwgdHJ1ZSk7XG4gICAgICAgIH0sXG5cbiAgICB9KTtcblxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgRHJvcE1vZGFsOiByZXF1aXJlKCcuL0Ryb3BNb2RhbCcpLFxuICAgIFdhdmVNb2RhbDogcmVxdWlyZSgnLi9XYXZlTW9kYWwnKSxcbiAgICBGbHlNb2RhbDogcmVxdWlyZSgnLi9GbHlNb2RhbCcpLFxuICAgIEZhZGVNb2RhbDogcmVxdWlyZSgnLi9GYWRlTW9kYWwnKSxcbiAgICBTY2FsZU1vZGFsOiByZXF1aXJlKCcuL1NjYWxlTW9kYWwnKSxcbiAgICBPdXRsaW5lTW9kYWw6IHJlcXVpcmUoJy4vT3V0bGluZU1vZGFsJyksXG59XG4iXX0=
