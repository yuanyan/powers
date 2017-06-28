'use strict';

var React = require('react');
var transitionEvents = require('domkit/transitionEvents');
var appendVendorPrefix = require('domkit/appendVendorPrefix');
var PropTypes = require('prop-types');

module.exports = function (animation) {

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
            contentStyle: PropTypes.object
        },

        getDefaultProps: function getDefaultProps() {
            return {
                className: "",
                onShow: function onShow() {},
                onHide: function onHide() {},
                animation: animation,
                keyboard: true,
                backdrop: true,
                closeOnClick: true,
                modalStyle: {},
                backdropStyle: {},
                contentStyle: {}
            };
        },

        getInitialState: function getInitialState() {
            return {
                willHidden: false,
                hidden: true
            };
        },

        hasHidden: function hasHidden() {
            return this.state.hidden;
        },

        addTransitionListener: function addTransitionListener(node, handle) {
            if (node) {
                var endListener = function endListener(e) {
                    if (e && e.target !== node) {
                        return;
                    }
                    transitionEvents.removeEndEventListener(node, endListener);
                    handle();
                };
                transitionEvents.addEndEventListener(node, endListener);
            }
        },

        handleBackdropClick: function handleBackdropClick() {
            if (this.props.closeOnClick) {
                this.hide("backdrop");
            }
        },

        render: function render() {

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

            var backdrop = this.props.backdrop ? React.createElement('div', { style: backdropStyle, onClick: this.props.closeOnClick ? this.handleBackdropClick : null }) : undefined;

            if (willHidden) {
                var node = this.refs[ref];
                this.addTransitionListener(node, this.leave);
            }

            return React.createElement(
                'span',
                null,
                React.createElement(
                    'div',
                    { ref: 'modal', style: modalStyle, className: this.props.className },
                    sharp,
                    React.createElement(
                        'div',
                        { ref: 'content', tabIndex: '-1', style: contentStyle },
                        this.props.children
                    )
                ),
                backdrop
            );
        },

        leave: function leave() {
            this.setState({
                hidden: true
            });
            this.props.onHide(this.state.hideSource);
        },

        enter: function enter() {
            this.props.onShow();
        },

        show: function show() {
            if (!this.hasHidden()) return;

            this.setState({
                willHidden: false,
                hidden: false
            });

            setTimeout(function () {
                var ref = this.props.animation.getRef();
                var node = this.refs[ref];
                this.addTransitionListener(node, this.enter);
            }.bind(this), 0);
        },

        hide: function hide(source) {
            if (this.hasHidden()) return;

            if (!source) {
                source = "hide";
            }

            this.setState({
                hideSource: source,
                willHidden: true
            });
        },

        toggle: function toggle() {
            if (this.hasHidden()) this.show();else this.hide("toggle");
        },

        listenKeyboard: function listenKeyboard(event) {
            typeof this.props.keyboard == "function" ? this.props.keyboard(event) : this.closeOnEsc(event);
        },

        closeOnEsc: function closeOnEsc(event) {
            if (this.props.keyboard && (event.key === "Escape" || event.keyCode === 27)) {
                this.hide("keyboard");
            }
        },

        componentDidMount: function componentDidMount() {
            window.addEventListener("keydown", this.listenKeyboard, true);
        },

        componentWillUnmount: function componentWillUnmount() {
            window.removeEventListener("keydown", this.listenKeyboard, true);
        }
    });
};
