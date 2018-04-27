Boron  [![npm version](https://badge.fury.io/js/boron.svg)](http://badge.fury.io/js/boron)
=====

A collection of dialog animations with React.js.

* React 15+ support

## Demo & Examples

Live demo: [yuanyan.github.io/boron](http://yuanyan.github.io/boron/)

To build the examples locally, run:

```
npm install
gulp dev
```

Then open [`localhost:9999`](http://localhost:9999) in a browser.

## Installation

The easiest way to use `boron` is to install it from NPM and include it in your own React build process (using [Browserify](http://browserify.org), etc).

You can also use the standalone build by including `dist/boron.js` in your page. If you use this, make sure you have already included React, and it is available as a global variable.

```
npm install boron-15 --save
```

## Usage

``` javascript
import React from 'react';
import {DropModal} from 'boron-15';

class App extends React.Component {

  constructor(props) {
    super(props);

    this.showModal = this.showModal.bind(this);
    this.hideModal = this.hideModal.bind(this);
  }

  showModal() {
    this.refs.modal.show();
  }

  hideModal() {
    this.refs.modal.hide();
  }

  render() {
    return (
      <div>
        <button onClick={this.showModal}>Open</button>
        <DropModal ref="modal">
          <h2>I am a dialog</h2>
          <button onClick={this.hideModal}>Close</button>
        </DropModal>
      </div>
    );
  }
}

export default App;
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
var Modal = require('boron-15/ScaleModal');

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
var Modal = require('boron-15/FlyModal');

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
