'use strict';

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var React = require('react');
var transitionEvents = require('domkit/transitionEvents');
var appendVendorPrefix = require('domkit/appendVendorPrefix');
var PropTypes = require('prop-types');

module.exports = function (animation) {
    var Factory = function (_React$Component) {
        (0, _inherits3.default)(Factory, _React$Component);

        function Factory(props) {
            (0, _classCallCheck3.default)(this, Factory);

            var _this = (0, _possibleConstructorReturn3.default)(this, (Factory.__proto__ || (0, _getPrototypeOf2.default)(Factory)).call(this, props));

            _this.state = {
                willHidden: false,
                hidden: true
            };

            _this.hasHidden = _this.hasHidden.bind(_this);
            _this.handleBackdropClick = _this.handleBackdropClick.bind(_this);
            _this.leave = _this.leave.bind(_this);
            _this.enter = _this.enter.bind(_this);
            _this.show = _this.show.bind(_this);
            _this.hide = _this.hide.bind(_this);
            _this.toggle = _this.toggle.bind(_this);
            _this.listenKeyboard = _this.listenKeyboard.bind(_this);
            return _this;
        }

        (0, _createClass3.default)(Factory, [{
            key: 'hasHidden',
            value: function hasHidden() {
                return this.state.hidden;
            }
        }, {
            key: 'addTransitionListener',
            value: function addTransitionListener(node, handle) {
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
            }
        }, {
            key: 'handleBackdropClick',
            value: function handleBackdropClick() {
                if (this.props.closeOnClick) {
                    this.hide();
                }
            }
        }, {
            key: 'render',
            value: function render() {

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

                var backdrop = this.props.backdrop ? React.createElement("div", { style: backdropStyle, onClick: this.props.closeOnClick ? this.handleBackdropClick : null }) : undefined;

                if (willHidden) {
                    var node = this.refs[ref];
                    this.addTransitionListener(node, this.leave);
                }

                return React.createElement("span", null, React.createElement("div", { ref: "modal", style: modalStyle, className: this.props.className }, sharp, React.createElement("div", { ref: "content", tabIndex: "-1", style: contentStyle }, this.props.children)), backdrop);
            }
        }, {
            key: 'leave',
            value: function leave() {
                this.setState({
                    hidden: true
                });
                this.props.onHide();
            }
        }, {
            key: 'enter',
            value: function enter() {
                this.props.onShow();
            }
        }, {
            key: 'show',
            value: function show() {
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
            }
        }, {
            key: 'hide',
            value: function hide() {
                if (this.hasHidden()) return;

                this.setState({
                    willHidden: true
                });
            }
        }, {
            key: 'toggle',
            value: function toggle() {
                if (this.hasHidden()) this.show();else this.hide();
            }
        }, {
            key: 'listenKeyboard',
            value: function listenKeyboard(event) {
                if (this.props.keyboard && (event.key === "Escape" || event.keyCode === 27)) {
                    this.hide();
                }
            }
        }, {
            key: 'componentDidMount',
            value: function componentDidMount() {
                window.addEventListener("keydown", this.listenKeyboard, true);
            }
        }, {
            key: 'componentWillUnmount',
            value: function componentWillUnmount() {
                window.removeEventListener("keydown", this.listenKeyboard, true);
            }
        }]);
        return Factory;
    }(React.Component);

    ;

    Factory.propTypes = {
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
    };

    Factory.defaultProps = {
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

    return Factory;
};
