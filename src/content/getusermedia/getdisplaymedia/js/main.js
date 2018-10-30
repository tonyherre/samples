/*
 *  Copyright (c) 2018 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';
import {LitElement, html} from 'https://unpkg.com/@polymer/lit-element@0.6.2?module';

class ScreenSharing extends LitElement {
  constructor() {
    super();
    this.downloadUrl = null;
    this.buttons = {
      startCapturing: true,
      stopCapturing: false,
      downloadRecording: false,
    };
    this.stream = null;
    this.recording = [];
    this.mediaRecorder = null;
  }

  static get properties() {
    return {
      buttons: Object,
      stream: {
        type: {
          fromAttribute: input => input
        }
      }
    };
  }

  render() {
    return html`<style>
@import "../../../css/main.css";
:host {
  display: block;
  padding: 10px;
  width: 100%;
  height: 100%;
}
video {
    --width: 100%;
    width: var(--width);
    height: calc(var(--width) * (16 / 9));
}

</style>
<video playsinline autoplay muted .srcObject="${this.stream}"></video>
<div>
<button ?disabled="${!this.buttons.startCapturing}" @click="${async e => this._startCapturing(e)}">Start screen capture</button>
<button ?disabled="${!this.buttons.stopCapturing}" @click="${e => this._stopCapturing(e)}">Stop screen capture</button>
<button ?disabled="${!this.buttons.downloadRecording}" @click="${e => this._downloadRecording(e)}">Download recording</button>
<a id="downloadLink" type="video/webm" style="display: none"></a>
</div>`;
  }

  _startScreenCapture() {
    if (navigator.getUserMedia) {
      return navigator.getDisplayMedia({video: true});
    } else {
      return navigator.mediaDevices.getUserMedia({video: {mediaSource: 'screen'}});
    }
  }

  async _startCapturing(e) {
    console.log('Start capturing.');
    this.buttons.startCapturing = false;
    this.buttons.stopCapturing = true;
    this.buttons.downloadRecording = false;
    this.requestUpdate('buttons');

    if (this.downloadUrl) {
      window.URL.revokeObjectURL(this.downloadUrl);
    }

    this.recording = [];
    this.stream = await this._startScreenCapture();
    this.stream.addEventListener('inactive', e => {
      console.log('Capture stream inactive - stop recording!');
      this.buttons.startCapturing = true;
      this.buttons.stopCapturing = false;
      this.buttons.downloadRecording = true;
      this.requestUpdate('buttons');

      this.mediaRecorder.stop();
      this.mediaRecorder = null;
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    });
    this.mediaRecorder = new MediaRecorder(this.stream, {mimeType: 'video/webm'});
    this.mediaRecorder.addEventListener('dataavailable', event => {
      if (event.data && event.data.size > 0) {
        this.recording.push(event.data);
      }
    });
    this.mediaRecorder.start(10);
  }

  _stopCapturing(e) {
    console.log('Stop capturing.');
    this.buttons.startCapturing = true;
    this.buttons.stopCapturing = false;
    this.buttons.downloadRecording = true;
    this.requestUpdate('buttons');

    this.mediaRecorder.stop();
    this.mediaRecorder = null;
    this.stream.getTracks().forEach(track => track.stop());
    this.stream = null;
  }

  _downloadRecording(e) {
    console.log('Download recording.');
    this.buttons.startCapturing = true;
    this.buttons.stopCapturing = false;
    this.buttons.downloadRecording = false;
    this.requestUpdate('buttons');

    const blob = new Blob(this.recording, {type: 'video/webm'});
    this.downloadUrl = window.URL.createObjectURL(blob);
    const downloadLink = this.shadowRoot.querySelector('a#downloadLink');
    downloadLink.href = this.downloadUrl;
    downloadLink.download = 'screen-recording.webm';
    downloadLink.click();
  }
}

customElements.define('screen-sharing', ScreenSharing);