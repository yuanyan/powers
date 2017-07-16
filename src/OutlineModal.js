import React from 'react';
import modalFactory from './modalFactory';
import insertKeyframesRule from 'domkit/insertKeyframesRule';
import appendVendorPrefix from 'domkit/appendVendorPrefix';

const animation = {
  show: {
    animationDuration: '0.8s',
    animationTimingFunction: 'cubic-bezier(0.6,0,0.4,1)',
  },
  hide: {
    animationDuration: '0.4s',
    animationTimingFunction: 'ease-out',
  },
  showContentAnimation: insertKeyframesRule({
    '0%': {
        opacity: 0,
    },
    '40%':{
        opacity: 0,
    },
    '100%': {
        opacity: 1,
    },
  }),
  hideContentAnimation: insertKeyframesRule({
    '0%': {
        opacity: 1,
    },
    '100%': {
        opacity: 0,
    },
  }),
  showBackdropAnimation: insertKeyframesRule({
    '0%': {
        opacity: 0,
    },
    '100%': {
        opacity: 0.9,
    },
  }),
  hideBackdropAnimation: insertKeyframesRule({
    '0%': {
        opacity: 0.9,
    },
    '100%': {
        opacity: 0,
    },
  }),
};

const showAnimation = animation.show;
const hideAnimation = animation.hide;
const showContentAnimation = animation.showContentAnimation;
const hideContentAnimation = animation.hideContentAnimation;
const showBackdropAnimation = animation.showBackdropAnimation;
const hideBackdropAnimation = animation.hideBackdropAnimation;

export default modalFactory({
  getRef: (willHidden) => {
    return 'content';
  },
  getSharp: (willHidden, rectStyles = {}) => {
    const strokeDashLength = 1680;
    const showSharpAnimation = insertKeyframesRule({
      '0%': {
          'stroke-dashoffset': strokeDashLength,
      },
      '100%': {
          'stroke-dashoffset': 0,
      },
    });
    const sharpStyle = {
      position: 'absolute',
      width: 'calc(100%)',
      height: 'calc(100%)',
      zIndex: '-1',
    };
    const rectStyle = appendVendorPrefix({
      animationDuration: willHidden ? '0.4s' : '0.8s',
      animationFillMode: 'forwards',
      animationName: willHidden ? hideContentAnimation : showSharpAnimation,
      stroke: '#ffffff',
      strokeWidth: '2px',
      strokeDasharray: strokeDashLength,
      ...rectStyles,
    });
    return (
      <div style = {sharpStyle}>
        <svg xmlns = 'http://www.w3.org/2000/svg'
             width = '100%'
             height = '100%'
             viewBox = '0 0 496 136'
             preserveAspectRatio = 'none'>
            <rect style={rectStyle}
                x = '2'
                y = '2'
                fill = 'none'
                width = '492'
                height = '132' />
        </svg>
      </div>
    );
  },
  getModalStyle: (willHidden) => {
    return appendVendorPrefix({
      zIndex: 1050,
      position: 'fixed',
      width: '500px',
      transform: 'translate3d(-50%, -50%, 0)',
      top: '50%',
      left: '50%',
    })
  },
  getBackdropStyle: (willHidden) => {
    return appendVendorPrefix({
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
      animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction,
    });
  },
  getContentStyle: (willHidden) => {
    return appendVendorPrefix({
      margin: 0,
      backgroundColor: 'white',
      animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
      animationFillMode: 'forwards',
      animationName: willHidden ? hideContentAnimation : showContentAnimation,
      animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction,
    });
  },
});
