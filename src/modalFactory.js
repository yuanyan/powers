var React = require('react');
var transitionEvents = require('domkit/transitionEvents');
var appendVendorPrefix = require('domkit/appendVendorPrefix');

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

        normalizeTransformMatrix: function(){
            if (this.refs.modal) {
                var mx = window.getComputedStyle(this.refs.modal, null);
                mx = mx.getPropertyValue("-webkit-transform") ||
                     mx.getPropertyValue("-moz-transform") ||
                     mx.getPropertyValue("-ms-transform") ||
                     mx.getPropertyValue("-o-transform") ||
                     mx.getPropertyValue("transform") || false;

                if (mx) {
                    var values = mx.replace(/ |\(|\)|matrix/g, "").split(",");
                    for (var v in values) { 
                        values[v] = v > 4 ? Math.ceil(values[v]) : values[v];
                    }

                    this.refs.modal.style.transform = "matrix(" + values.join() + ")";
                }
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

            var backdrop = this.props.backdrop? <div style={backdropStyle} onClick={this.props.closeOnClick? this.handleBackdropClick: null} />: undefined;

            if(willHidden) {
                var node = this.refs[ref];
                this.addTransitionListener(node, this.leave);
            }

            return (<span>
                <div ref="modal" style={modalStyle} className={this.props.className}>
                    {sharp}
                    <div ref="content" tabIndex="-1" style={contentStyle}>
                        {this.props.children}
                    </div>
                </div>
                {backdrop}
             </span>)
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
              this.addTransitionListener(node, this.normalizeTransformMatrix);
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
