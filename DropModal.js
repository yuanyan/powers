'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _modalFactory = require('./modalFactory');

var _modalFactory2 = _interopRequireDefault(_modalFactory);

var _insertKeyframesRule = require('domkit/insertKeyframesRule');

var _insertKeyframesRule2 = _interopRequireDefault(_insertKeyframesRule);

var _appendVendorPrefix = require('domkit/appendVendorPrefix');

var _appendVendorPrefix2 = _interopRequireDefault(_appendVendorPrefix);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var animation = {
  show: {
    animationDuration: '0.4s',
    animationTimingFunction: 'cubic-bezier(0.7,0,0.3,1)'
  },
  hide: {
    animationDuration: '0.4s',
    animationTimingFunction: 'cubic-bezier(0.7,0,0.3,1)'
  },
  showModalAnimation: (0, _insertKeyframesRule2.default)({
    '0%': {
      opacity: 0,
      transform: 'translate(-50%, -300px)'
    },
    '100%': {
      opacity: 1,
      transform: 'translate(-50%, -50%)'
    }
  }),
  hideModalAnimation: (0, _insertKeyframesRule2.default)({
    '0%': {
      opacity: 1,
      transform: 'translate(-50%, -50%)'
    },
    '100%': {
      opacity: 0,
      transform: 'translate(-50%, 100px)'
    }
  }),
  showBackdropAnimation: (0, _insertKeyframesRule2.default)({
    '0%': {
      opacity: 0
    },
    '100%': {
      opacity: 0.9
    }
  }),
  hideBackdropAnimation: (0, _insertKeyframesRule2.default)({
    '0%': {
      opacity: 0.9
    },
    '100%': {
      opacity: 0
    }
  }),
  showContentAnimation: (0, _insertKeyframesRule2.default)({
    '0%': {
      opacity: 0,
      transform: 'translate(0, -20px)'
    },
    '100%': {
      opacity: 1,
      transform: 'translate(0, 0)'
    }
  }),
  hideContentAnimation: (0, _insertKeyframesRule2.default)({
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

exports.default = (0, _modalFactory2.default)({
  getRef: function getRef(willHidden) {
    return 'modal';
  },
  getModalStyle: function getModalStyle(willHidden) {
    return (0, _appendVendorPrefix2.default)({
      position: 'fixed',
      width: '500px',
      transform: 'translate(-50%, -50%)',
      top: '50%',
      left: '50%',
      backgroundColor: 'white',
      zIndex: 1050,
      animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
      animationFillMode: 'forwards',
      animationName: willHidden ? hideModalAnimation : showModalAnimation,
      animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
    });
  },
  getBackdropStyle: function getBackdropStyle(willHidden) {
    return (0, _appendVendorPrefix2.default)({
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 1040,
      backgroundColor: '#373A47',
      animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
      animationFillMode: 'forwards',
      animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
      animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
    });
  },
  getContentStyle: function getContentStyle(willHidden) {
    return (0, _appendVendorPrefix2.default)({
      margin: 0,
      opacity: 0,
      animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
      animationFillMode: 'forwards',
      animationDelay: '0.25s',
      animationName: showContentAnimation,
      animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
    });
  }
});
