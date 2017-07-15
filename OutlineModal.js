'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _modalFactory = require('./modalFactory');

var _modalFactory2 = _interopRequireDefault(_modalFactory);

var _insertKeyframesRule = require('domkit/insertKeyframesRule');

var _insertKeyframesRule2 = _interopRequireDefault(_insertKeyframesRule);

var _appendVendorPrefix = require('domkit/appendVendorPrefix');

var _appendVendorPrefix2 = _interopRequireDefault(_appendVendorPrefix);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var animation = {
  show: {
    animationDuration: '0.8s',
    animationTimingFunction: 'cubic-bezier(0.6,0,0.4,1)'
  },
  hide: {
    animationDuration: '0.4s',
    animationTimingFunction: 'ease-out'
  },
  showContentAnimation: (0, _insertKeyframesRule2.default)({
    '0%': {
      opacity: 0
    },
    '40%': {
      opacity: 0
    },
    '100%': {
      opacity: 1
    }
  }),
  hideContentAnimation: (0, _insertKeyframesRule2.default)({
    '0%': {
      opacity: 1
    },
    '100%': {
      opacity: 0
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
  getSharp: function getSharp(willHidden) {
    var strokeDashLength = 1680;
    var showSharpAnimation = (0, _insertKeyframesRule2.default)({
      '0%': {
        'stroke-dashoffset': strokeDashLength
      },
      '100%': {
        'stroke-dashoffset': 0
      }
    });
    var sharpStyle = {
      position: 'absolute',
      width: 'calc(100%)',
      height: 'calc(100%)',
      zIndex: '-1'
    };
    var rectStyle = (0, _appendVendorPrefix2.default)({
      animationDuration: willHidden ? '0.4s' : '0.8s',
      animationFillMode: 'forwards',
      animationName: willHidden ? hideContentAnimation : showSharpAnimation,
      stroke: '#ffffff',
      strokeWidth: '2px',
      strokeDasharray: strokeDashLength
    });

    return _react2.default.createElement(
      'div',
      { style: sharpStyle },
      _react2.default.createElement(
        'svg',
        { xmlns: 'http://www.w3.org/2000/svg',
          width: '100%',
          height: '100%',
          viewBox: '0 0 496 136',
          preserveAspectRatio: 'none' },
        _react2.default.createElement('rect', { style: rectStyle,
          x: '2',
          y: '2',
          fill: 'none',
          width: '492',
          height: '132' })
      )
    );
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
      animationDuration: '0.4s',
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
