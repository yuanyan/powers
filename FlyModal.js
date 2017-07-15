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
    animationDuration: '0.5s',
    animationTimingFunction: 'ease-out'
  },
  hide: {
    animationDuration: '0.5s',
    animationTimingFunction: 'ease-out'
  },
  showContentAnimation: (0, _insertKeyframesRule2.default)({
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
  hideContentAnimation: (0, _insertKeyframesRule2.default)({
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

exports.default = (0, _modalFactory2.default)({
  getRef: function getRef(willHidden) {
    return 'content';
  },
  getModalStyle: function getModalStyle(willHidden) {
    return (0, _appendVendorPrefix2.default)({
      zIndex: 1050,
      position: 'fixed',
      width: '500px',
      transform: 'translate3d(-50%, -50%, 0)',
      top: '50%',
      left: '50%'
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
      animationFillMode: 'forwards',
      animationDuration: '0.3s',
      animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
      animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
    });
  },
  getContentStyle: function getContentStyle(willHidden) {
    return (0, _appendVendorPrefix2.default)({
      margin: 0,
      backgroundColor: 'white',
      animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
      animationFillMode: 'forwards',
      animationName: willHidden ? hideContentAnimation : showContentAnimation,
      animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
    });
  }
});
