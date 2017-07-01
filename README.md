Reboron
=====

# This is a fork of http://yuanyan.github.io/boron/ that has fixes for the deprecation warnings in React 15.*. I will be working on updating this package to use es6 as well as fixing some of the issues in the main package. PRs welcome!


A collection of dialog animations with React.js.

* React 0.15+ Use `boron 0.3`

## Demo & Examples

Live demo: [yuanyan.github.io/boron](http://yuanyan.github.io/boron/)

To build the examples locally, run:

```
npm install
```

Then open [`localhost:9999`](http://localhost:9999) in a browser.

## Installation

The easiest way to use `reboron` is to install it from NPM and include it in your own React build process


```
npm install reboron --save
```

## Usage

``` javascript
var Modal = require('reboron/DropModal');
var Example = React.createClass({
    showModal: function(){
        this.refs.modal.show();
    },
    hideModal: function(){
        this.refs.modal.hide();
    },

    callback: function(event){
        console.log(event);
    },

    render: function() {
        return (
            <div>
                <button onClick={this.showModal}>Open</button>
                <Modal ref="modal" keyboard={this.callback}>
                    <h2>I am a dialog</h2>
                    <button onClick={this.hideModal}>Close</button>
                </Modal>
            </div>
        );
    }
});
```

## Props

* className - Add custom class name.
* keyboard - Receive a callback function or a boolean to choose to close the modal when escape key is pressed.
* backdrop - Includes a backdrop element.
* closeOnClick - Close the backdrop element when clicked.
* onShow - Show callback.
* onHide - Hide callback. Argument is the source of the hide action, one of:
 * hide - hide() method is the cause of the hide.
 * toggle - toggle() method is the cause of the hide
 * keyboard - keyboard (escape key) is the cause of the hide
 * backdrop - backdrop click is the cause of the hide
 * [any] - custom argument passed by invoking code into the hide() method when called directly.
* modalStyle - CSS styles to apply to the modal
* backdropStyle - CSS styles to apply to the backdrop
* contentStyle - CSS styles to apply to the modal's content

Note: If the hide() method is called directly, a custom source string can be
passed as the argument, as noted above. For example, this might be useful if
if multiple actions could cause the hide and it was desirable to know which of those
actions was the trigger for the given onHide callback).

# Custom Styles
Objects consisting of CSS properties/values can be passed as props to the Modal component.
The values for the CSS properties will either add new properties or override the default property value set for that Modal type.

Modal with 80% width:
``` javascript
var Modal = require('reboron/ScaleModal');

// Style object
var modalStyle = {
    width: '80%'
};

var Example = React.createClass({
    showModal: function(){
        this.refs.modal.show();
    },
    hideModal: function(){
        this.refs.modal.hide();
    },
    render: function() {
        return (
            <div>
                <button onClick={this.showModal}>Open</button>
                <Modal ref="modal" modalStyle={modalStyle}>
                    <h2>I am a dialog</h2>
                    <button onClick={this.hideModal}>Close</button>
                </Modal>
            </div>
        );
    }
});
```

Red backdrop with a blue modal, rotated at 45 degrees:
``` javascript
var Modal = require('reboron/FlyModal');

// Individual styles for the modal, modal content, and backdrop
var modalStyle = {
    transform: 'rotate(45deg) translateX(-50%)',
};

var backdropStyle = {
    backgroundColor: 'red'
};

var contentStyle = {
    backgroundColor: 'blue',
    height: '100%'
};

var Example = React.createClass({
    showModal: function(){
        this.refs.modal.show();
    },
    hideModal: function(){
        this.refs.modal.hide();
    },
    render: function() {
        return (
            <div>
                <button onClick={this.showModal}>Open</button>
                <Modal ref="modal" modalStyle={modalStyle} backdropStyle={backdropStyle} contentStyle={contentStyle}>
                    <h2>I am a dialog</h2>
                    <button onClick={this.hideModal}>Close</button>
                </Modal>
            </div>
        );
    }
});
```


## Modals

* DropModal
* FadeModal
* FlyModal
* OutlineModal
* ScaleModal
* WaveModal

## License

Boron is [MIT licensed](./LICENSE).
