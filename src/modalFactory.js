import React from 'react';
import transitionEvents from 'domkit/transitionEvents';
import appendVendorPrefix from 'domkit/appendVendorPrefix';

class modalFactory extends React.Component {
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
  };

  getDefaultProps() {
    return {
      className: '',
      onShow: function() {},
      onHide: function() {},
      animation: animation,
      keyboard: true,
      backdrop: true,
      closeOnClick: true,
      modalStyle: {},
      backdropStyle: {},
      contentStyle: {},
    };
  }

  getInitialState() {
    return {
      willHidden: false,
      hidden: true,
    };
  }

  hasHidden() {
    return this.state.hidden;
  }

  addTransitionListener(node, handle) {
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
  }

  handleBackdropClick() {
    if (this.props.closeOnClick) {
      this.hide('backdrop');
    }
  }

  render() {
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

    var backdrop = this.props.backdrop ? (
      <div
        style={backdropStyle}
        onClick={this.props.closeOnClick ? this.handleBackdropClick : null}
      />
    ) : (
      undefined
    );

    if (willHidden) {
      var node = this.refs[ref];
      this.addTransitionListener(node, this.leave);
    }

    return (
      <span>
        <div ref="modal" style={modalStyle} className={this.props.className}>
          {sharp}
          <div ref="content" tabIndex="-1" style={contentStyle}>
            {this.props.children}
          </div>
        </div>
        {backdrop}
      </span>
    );
  }

  leave() {
    this.setState({
      hidden: true,
    });
    this.props.onHide(this.state.hideSource);
  }

  enter() {
    this.props.onShow();
  }

  show() {
    if (!this.hasHidden()) return;

    this.setState({
      willHidden: false,
      hidden: false,
    });

    setTimeout(
      function() {
        var ref = this.props.animation.getRef();
        var node = this.refs[ref];
        this.addTransitionListener(node, this.enter);
      }.bind(this),
      0,
    );
  }

  hide(source) {
    if (this.hasHidden()) return;

    if (!source) {
      source = 'hide';
    }

    this.setState({
      hideSource: source,
      willHidden: true,
    });
  }

  toggle() {
    if (this.hasHidden()) this.show();
    else this.hide('toggle');
  }

  listenKeyboard(event) {
    typeof this.props.keyboard == 'function'
      ? this.props.keyboard(event)
      : this.closeOnEsc(event);
  }

  closeOnEsc(event) {
    if (
      this.props.keyboard &&
      (event.key === 'Escape' || event.keyCode === 27)
    ) {
      this.hide('keyboard');
    }
  }

  componentDidMount() {
    window.addEventListener('keydown', this.listenKeyboard, true);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.listenKeyboard, true);
  }
}

export default modalFactory;
