import EventEmitter from "eventemitter3";
import utils from "./utils/utils";
import Log from "./utils/Log";

class RtcPhone extends EventEmitter {
  /**
   *
   * @param {String} webRtcType Sets the default webrtc type. Supported values: native, w4a and erisson.
   * @param {Integer} pfs Sets the video fps. Requires webrt4all plugin.
   * @param {String} maxVideoSize maxVideoSize value. Supported values: "sqcif", "qcif" "qvga" "cif" "hvga", "vga", "4cif", "svga", "480p", "720p", "16cif", "1080p", "2160p".
   * @param {Integer} maxBandwidthUp Sets the maximum bandwidth (upload). Requires webrt4all plugin. value (kbps).
   * @param {Integer} maxBandwidthDown Sets the maximum bandwidth (down). Requires webrt4all plugin. value (kbps).
   * @param {Boolean} zeroArtifacts Defines whether to enable "zero-artifacts" features. Requires webrt4all plugin.
   * @param {Boolean} startNativeDebug Starts debugging the native (C/C++) code. Requires webrt4all plugin. On Windows, the output file should be at C:\Users\<YOUR LOGIN>\AppData\Local\Temp\Low\webrtc4all.log. Starting the native debug isn't recommended and must be done to track issues only.
   */
  constructor({
    debugLevel = "info",
    webRtcType = "native",
    pfs,
    maxVideoSize,
    maxBandwidthUp,
    maxBandwidthDown,
    zeroArtifacts,
    startNativeDebug = false,

    ringToneDom,
    ringbackToneDom,

    audioRemoteDom,
    videoLocalDom,
    videoRemoteDom,

    onInitialized,
    onStackStartFailed,
    onConnected,
    onDisconnected,
    onRinging,
    onDialing,
    onTalking,
    onReleased,
  }) {
    super();
    if (document.readyState !== "complete") {
      throw "Dom not ready !";
    }

    Log.info(`RtcPhone Constructor:location=${window.location}`);

    // set debug level
    this.debugLevel = debugLevel;
    SIPml.setDebugLevel(this.debugLevel);
    //
    this.webRtcType = webRtcType;
    // 
    this.pfs = pfs;
    this.maxVideoSize = maxVideoSize;
    this.maxBandwidthUp = maxBandwidthUp;
    this.maxBandwidthDown = maxBandwidthDown;
    this.zeroArtifacts = zeroArtifacts;
    this.startNativeDebug = startNativeDebug;
    
    // check dom
    this.ringTone = document.getElementById(ringToneDom);
    if (!this.ringTone) {
      throw "Ringtone dom does not exist !";
    }
    this.ringbackTone = document.getElementById(ringbackToneDom);
    if (!this.ringbackTone) {
      throw "RingbackTone dom does not exist !";
    }
    this.audioRemote = document.getElementById(audioRemoteDom);
    if (!this.audioRemote) {
      throw "Audio dom does not exist !";
    }
    this.videoLocal = document.getElementById(videoLocalDom);
    if (!this.videoLocal) {
      throw "Local video dom does not exist !";
    }
    this.videoRemote = document.getElementById(videoRemoteDom);
    if (!this.videoRemote) {
      throw "Remote video dom does not exist !";
    }

    this.configCall = {
      audio_remote: this.audioRemote,
      video_local: this.videoLocal,
      video_remote: this.videoRemote,
      screencast_window_id: 0x00000000, // entire desktop
      bandwidth: { audio: undefined, video: undefined },
      video_size: {
        minWidth: undefined,
        minHeight: undefined,
        maxWidth: undefined,
        maxHeight: undefined,
      },
      events_listener: {
        events: "*",
        listener: this.onSipEventSession.bind(this),
      },
      sip_caps: [
        { name: "+g.oma.sip-im" },
        { name: "language", value: '"en,fr"' },
      ],
    };

    // sip协议栈对象
    this.sipStack = null;
    // 注册对象
    this.sipSessionRegister = null;
    // 呼叫会话数据
    this.sipSessionCall = null;
    this.status = "uninitialized";

    // add event listener
    utils.isFunction(onInitialized) && this.on("initialized", onInitialized);
    utils.isFunction(onStackStartFailed) && this.on("stackStartFailed", onStackStartFailed);
    utils.isFunction(onConnected) && this.on("connected", onConnected);
    utils.isFunction(onDisconnected) && this.on("disconnected", onDisconnected);
    utils.isFunction(onRinging) && this.on("ringing", onRinging);
    utils.isFunction(onDialing) && this.on("dialing", onDialing);
    utils.isFunction(onTalking) && this.on("talking", onTalking);
    utils.isFunction(onReleased) && this.on("released", onReleased);
  }

  /**
   * initialize SIPML5
   */
  sipInit() {
    if (SIPml.isInitialized()) {
       this.postInit();
    } else {
      // set default webrtc type (before initialization)
      SIPml.setWebRtcType(this.webRtcType);
      // initialize SIPML5
      SIPml.init(this.postInit.bind(this));
      // set other options after initialization
      if (this.pfs) SIPml.setFps(this.pfs);
      if (this.maxVideoSize) SIPml.setMaxVideoSize(this.maxVideoSize);
      if (this.maxBandwidthUp) SIPml.setMaxBandwidthUp(this.maxBandwidthUp);
      if (this.maxBandwidthDown) SIPml.setMaxBandwidthDown(this.maxBandwidthDown);
      if (this.zeroArtifacts) SIPml.setZeroArtifacts(this.zeroArtifacts === true);
      if (this.startNativeDebug === true) {
        SIPml.startNativeDebug();
      }
    }
  }

  /**
   * 初始化完成
   * @returns
   */
  postInit() {
    // check for WebRTC support
    if (!SIPml.isWebRtcSupported()) {
      // is it chrome?
      if (SIPml.getNavigatorFriendlyName() == "chrome") {
        if (
          confirm(
            "You're using an old Chrome version or WebRTC is not enabled.\nDo you want to see how to enable WebRTC?"
          )
        ) {
          window.location = "http://www.webrtc.org/running-the-demos";
        } else {
          window.location = "index.html";
        }
        return;
      } else {
        if (
          confirm(
            "webrtc-everywhere extension is not installed. Do you want to install it?\nIMPORTANT: You must restart your browser after the installation."
          )
        ) {
          window.location = "https://github.com/sarandogou/webrtc-everywhere";
        } else {
          // Must do nothing: give the user the chance to accept the extension
          // window.location = "index.html";
        }
      }
    }

    // checks for WebSocket support
    if (!SIPml.isWebSocketSupported()) {
      if (
        confirm(
          "Your browser don't support WebSockets.\nDo you want to download a WebSocket-capable browser?"
        )
      ) {
        window.location = "https://www.google.com/intl/en/chrome/browser/";
      } else {
        window.location = "index.html";
      }
      return;
    }

    if (!SIPml.isWebRtcSupported()) {
      if (
        confirm(
          "Your browser don't support WebRTC.\naudio/video calls will be disabled.\nDo you want to download a WebRTC-capable browser?"
        )
      ) {
        window.location = "https://www.google.com/intl/en/chrome/browser/";
      }
    }

    this.status = "initialized";
    this.emit("initialized");
  }

  /**
   * sends SIP REGISTER request to login
   * @param {*} displayName
   * @returns
   */
  sipRegister({
    displayName = "",
    privateIdentity = "",
    publicIdentity = "",
    password = "",
    realm = "",
    websocketProxyUrl = "wss://rtc.95ykf.com:4443",
  }) {
    if (this.status === "uninitialized") {
      Log.error("RtcPhone uninitialized!");
      return false;
    }

    if (this.sipSessionRegister) {
      Log.error("RtcPhone Registered!");
      return false;
    }

    // catch exception for IE (DOM not ready)
    try {
      let _impu = tsip_uri.prototype.Parse(publicIdentity);
      if (!_impu || !_impu.s_user_name || !_impu.s_host) {
        throw "Public Identity format error !";
      }
      this.realm = realm;
      this.displayName = displayName;
      this.privateIdentity = privateIdentity;
      this.publicIdentity = publicIdentity;
      this.websocketProxyUrl = websocketProxyUrl;

      // enable notifications if not already done
      if (
        window.webkitNotifications &&
        window.webkitNotifications.checkPermission() != 0
      ) {
        window.webkitNotifications.requestPermission();
      }

      // update debug level to be sure new values will be used if the user haven't updated the page
      // TODO: 对外提供函数，不在单独设置
      SIPml.setDebugLevel(
        window.localStorage &&
          window.localStorage.getItem("org.doubango.expert.disable_debug") ==
            "true"
          ? "error"
          : "info"
      );

      // create SIP stack
      this.sipStack = new SIPml.Stack({
        realm: this.realm,
        impi: this.privateIdentity,
        impu: this.publicIdentity,
        password: password,
        display_name: this.displayName,
        websocket_proxy_url: this.websocketProxyUrl,
        outbound_proxy_url: window.localStorage
          ? window.localStorage.getItem(
              "org.doubango.expert.sip_outboundproxy_url"
            )
          : null,
        ice_servers: [],
        enable_rtcweb_breaker: window.localStorage
          ? window.localStorage.getItem(
              "org.doubango.expert.enable_rtcweb_breaker"
            ) == "true"
          : false,
        events_listener: {
          events: "*",
          listener: this.onSipEventStack.bind(this),
        },
        enable_early_ims: window.localStorage
          ? window.localStorage.getItem(
              "org.doubango.expert.disable_early_ims"
            ) != "true"
          : true, // Must be true unless you're using a real IMS network
        enable_media_stream_cache: window.localStorage
          ? window.localStorage.getItem(
              "org.doubango.expert.enable_media_caching"
            ) == "true"
          : false,
        bandwidth: window.localStorage
          ? tsk_string_to_object(
              window.localStorage.getItem("org.doubango.expert.bandwidth")
            )
          : null, // could be redefined a session-level
        video_size: window.localStorage
          ? tsk_string_to_object(
              window.localStorage.getItem("org.doubango.expert.video_size")
            )
          : null, // could be redefined a session-level
        sip_headers: [
          { name: "User-Agent", value: "HL-WebRTC" },
          { name: "Organization", value: "HL95" },
        ],
      });

      // Failed to start the SIP stack
      if (this.sipStack.start() != 0) {
        this.emit("stackStartFailed");
      }
    } catch (e) {
      this.emit("stackStartFailed", e);
    }
  }

  // sends SIP REGISTER (expires=0) to logout
  sipUnRegister() {
    if (this.sipStack) {
      this.sipStack.stop(); // shutdown all sessions
    }
  }

  /**
   * makes a call (SIP INVITE)
   * @param {String} type  'call-audio', 'call-audiovideo', 'call-video', 'call-screenshare'.
   * @param {*} phoneNumber
   * @returns
   */
  sipCall(type, phoneNumber) {
    if (!this.sipStack) {
      utils.showMessage("UnRegister!");
      return false;
    }

    if (!this.sipSessionCall) {
      if (!utils.checkPhoneNumber(phoneNumber)) {
        utils.showMessage("Phone number format error !");
        return false;
      }

      if (type == "call-screenshare") {
        if (!SIPml.isScreenShareSupported()) {
          utils.showMessage(
            "Screen sharing not supported. Are you using chrome 26+?"
          );
          return false;
        }
        if (!location.protocol.match("https")) {
          utils.showMessage("Screen sharing requires https://.");
          this.sipUnRegister();
          return false;
        }
      }

      if (window.localStorage) {
        this.configCall.bandwidth = tsk_string_to_object(
          window.localStorage.getItem("org.doubango.expert.bandwidth")
        ); // already defined at stack-level but redifined to use latest values
        this.configCall.video_size = tsk_string_to_object(
          window.localStorage.getItem("org.doubango.expert.video_size")
        ); // already defined at stack-level but redifined to use latest values
      }

      // create call session
      this.sipSessionCall = this.sipStack.newSession(type, this.configCall);
      // make call
      if (this.sipSessionCall.call(phoneNumber) != 0) {
        this.sipSessionCall = null;
        this.emit("callFailed");
        return;
      }
    } else {
      // this.callStatus = 'Connecting';
      this.sipSessionCall.accept(this.configCall);
    }
  }

  sipAnswer() {
    if (!this.sipStack) {
      utils.showMessage("UnRegister!");
      return false;
    }
    if (!this.sipSessionCall) {
      utils.showMessage("no call!");
      return false;
    } else {
      this.sipSessionCall.accept(this.configCall);
    }
  }

  // Share entire desktop aor application using BFCP or WebRTC native implementation
  sipShareScreen() {
    if (SIPml.getWebRtcType() === "w4a") {
      // Sharing using BFCP -> requires an active session
      if (!this.sipSessionCall) {
        utils.showMessage("No active session");
        return false;
      }
      if (this.sipSessionCall.bfcpSharing) {
        if (this.sipSessionCall.stopBfcpShare(this.configCall) != 0) {
          txtCallStatus.value = "Failed to stop BFCP share";
        } else {
          this.sipSessionCall.bfcpSharing = false;
        }
      } else {
        this.configCall.screencast_window_id = 0x00000000;
        if (this.sipSessionCall.startBfcpShare(this.configCall) != 0) {
          txtCallStatus.value = "Failed to start BFCP share";
        } else {
          this.sipSessionCall.bfcpSharing = true;
        }
      }
    } else {
      sipCall("call-screenshare");
    }
  }

  /**
   * transfers the call
   * @param {String} phoneNumber 
   * @returns 
   */
  sipTransfer(phoneNumber) {
    if (!this.sipSessionCall) {
      return false;
    }
    if (!utils.checkPhoneNumber(phoneNumber)) {
      return false;
    }

    let ret = this.sipSessionCall.transfer(phoneNumber);
    if (ret != 0) {
      Log.error('Call transfer failed');
      return false;
    }
    Log.info('Transfering the call...');
    return true;
  }

  // holds or resumes the call
  sipToggleHoldResume() {
    if (!this.sipSessionCall) {
      return false;
    }

    let ret = this.sipSessionCall.bHeld
      ? this.sipSessionCall.resume()
      : this.sipSessionCall.hold();
    if (ret != 0) {
      return false;
    }
    return true;
  }

  // Mute or Unmute the call
  sipToggleMute() {
    if (!this.sipSessionCall) {
      return false;
    }

    let bMute = !this.sipSessionCall.bMute;
    let ret = this.sipSessionCall.mute("audio" /*could be 'video'*/, bMute);
    if (ret != 0) {
      return false;
    }
    this.sipSessionCall.bMute = bMute;
    return true;
  }

  // terminates the call (SIP BYE or CANCEL)
  sipHangup() {
    if (this.sipSessionCall) {
      this.sipSessionCall.hangup({
        events_listener: {
          events: "*",
          listener: this.onSipEventSession.bind(this),
        },
      });
    }
  }

  /**
   *
   * @param {String} c 按键
   */
  sipSendDTMF(c) {
    if (this.sipSessionCall && c) {
      if (this.sipSessionCall.dtmf(c) == 0) {
        Log.info(`sipSendDTMF ${c}`);
      }
    }
  }

  /**
   * 播放铃声
   */
  startRingTone() {
    try {
      ringtone.play();
    } catch (e) {}
  }

  stopRingTone() {
    try {
      ringtone.pause();
    } catch (e) {}
  }

  /**
   * 播放回铃音
   */
  startRingbackTone() {
    try {
      ringbacktone.play();
    } catch (e) {}
  }

  stopRingbackTone() {
    try {
      ringbacktone.pause();
    } catch (e) {}
  }

  // Callback function for SIP Stacks
  onSipEventStack(e /*SIPml.Stack.Event*/) {
    Log.info("==stack event = " + e.type);
    switch (e.type) {
      case "started": {
        // catch exception for IE (DOM not ready)
        try {
          // LogIn (REGISTER) as soon as the stack finish starting
          this.sipSessionRegister = this.sipStack.newSession("register", {
            expires: 200,
            events_listener: {
              events: "*",
              listener: this.onSipEventSession.bind(this),
            },
            sip_caps: [
              { name: "+g.oma.sip-im", value: null },
              //{ name: '+sip.ice' }, // rfc5768: FIXME doesn't work with Polycom TelePresence
              { name: "+audio", value: null },
              { name: "language", value: '"en,fr"' },
            ],
          });
          this.sipSessionRegister.register();
        } catch (e) {
          Log.error("注册失败", e);
        }
        break;
      }
      case "stopping":
      case "stopped":
      case "failed_to_start":
      case "failed_to_stop": {
        let bFailure =
          e.type == "failed_to_start" || e.type == "failed_to_stop";
        this.sipStack = null;
        this.sipSessionRegister = null;
        this.sipSessionCall = null;

        this.emit("disconnected");

        this.stopRingbackTone();
        this.stopRingTone();

        // uiVideoDisplayShowHide(false); TODO: 是否加时间考虑

        Log.info(bFailure ? "Disconnected: " + e.description : "Disconnected");
        break;
      }

      case "i_new_call": {
        Log.info("==i_new_call_log = " + this.sipSessionCall);
        if (this.sipSessionCall) {
          // do not accept the incoming call if we're already 'in call'
          e.newSession.hangup(); // comment this line for multi-line support
        } else {
          this.sipSessionCall = e.newSession;
          // start listening for events
          this.sipSessionCall.setConfiguration(this.configCall);
          this.callStatus = "ringing";

          this.startRingTone();

          let remoteNumber =
            this.sipSessionCall.getRemoteFriendlyName() || "unknown";
          Log.info("Incoming call from " + remoteNumber);
          this.emit("ringing", remoteNumber);
        }
        break;
      }

      case "m_permission_requested": {
        Log.log("=======m_permission_requested=====" + e);
        break;
      }
      case "m_permission_accepted":
      case "m_permission_refused": {
        Log.log("=======m_permission_accepted=m_permission_refused11=====" + e);
        break;
      }

      case "starting":
      default:
        break;
    }
  }

  /**
   *
   * @param {SIPml.Session.Event} e SIPml.Session.Event
   */
  onSipEventSession(e) {
    Log.info("==session event = " + e.type, e.description);

    switch (e.type) {
      case "connecting": {
        if (e.session == this.sipSessionRegister) {
          this.status = e.type;
          this.emit(e.type, e);
        } else if (e.session == this.sipSessionCall) {
          this.emit("session", e);
        }
        break;
      } // 'connecting'
      case "connected": {
        if (e.session == this.sipSessionRegister) {
          this.status = e.type;
          this.emit(e.type, e);
        } else if (e.session == this.sipSessionCall) {
          this.stopRingbackTone();
          this.stopRingTone();

          this.callStatus = "talking";
          this.emit("talking", e);
        }
        break;
      } // 'connected'
      case "terminating":
      case "terminated": {
        if (e.session == this.sipSessionRegister) {
          this.status = e.type;

          this.sipSessionCall = null;
          this.sipSessionRegister = null;

          this.emit("disconnected");
        } else if (e.session == this.sipSessionCall) {
          this.sipSessionCall = null;

          this.stopRingbackTone();
          this.stopRingTone();

          this.emit("released", e);
        }
        break;
      } // 'terminating' | 'terminated'

      case "m_stream_video_local_added": {
        if (e.session == this.sipSessionCall) {
          this.emit("localVideoAdded");
        }
        break;
      }
      case "m_stream_video_local_removed": {
        if (e.session == this.sipSessionCall) {
          this.emit("localVideoRemoved");
        }
        break;
      }
      case "m_stream_video_remote_added": {
        if (e.session == this.sipSessionCall) {
          //uiVideoDisplayEvent(false, true);
        }
        break;
      }
      case "m_stream_video_remote_removed": {
        if (e.session == this.sipSessionCall) {
          //uiVideoDisplayEvent(false, false);
        }
        break;
      }

      case "m_stream_audio_local_added":
      case "m_stream_audio_local_removed":
      case "m_stream_audio_remote_added":
      case "m_stream_audio_remote_removed": {
        break;
      }

      case "i_ect_new_call": {
        oSipSessionTransferCall = e.session;
        break;
      }

      case "i_ao_request": {
        if (e.session == this.sipSessionCall) {
          let iSipResponseCode = e.getSipResponseCode();
          if (iSipResponseCode == 180 || iSipResponseCode == 183) {
            this.callStatus = "dialing";

            // FIXME: 使用对方铃声，呼叫开始阶段会有一段没有铃声
            // this.startRingbackTone();

            this.emit("dialing", e);
            Log.info("Remote ringing...");
          }
        }
        break;
      }

      case "m_early_media": {
        if (e.session == this.sipSessionCall) {
          this.stopRingbackTone();
          this.stopRingTone();
          Log.info("Early media started");
        }
        break;
      }

      case "m_local_hold_ok": {
        if (e.session == this.sipSessionCall) {
          if (this.sipSessionCall.bTransfering) {
            this.sipSessionCall.bTransfering = false;
            // this.AVSession.TransferCall(this.transferUri);
          }
          this.emit("holdCompleted", e);
          Log.info("Call placed on hold");
          this.sipSessionCall.bHeld = true;
        }
        break;
      }
      case "m_local_hold_nok": {
        if (e.session == this.sipSessionCall) {
          this.sipSessionCall.bTransfering = false;
          this.emit("holdFailed", e);
          Log.info("Failed to place remote party on hold");
        }
        break;
      }
      case "m_local_resume_ok": {
        if (e.session == this.sipSessionCall) {
          this.sipSessionCall.bTransfering = false;
          this.emit("resumeCompleted", e);
          Log.info("Call taken off hold");
          this.sipSessionCall.bHeld = false;

          if (SIPml.isWebRtc4AllSupported()) {
            // IE don't provide stream callback yet
            //uiVideoDisplayEvent(false, true);
            //uiVideoDisplayEvent(true, true);
          }
        }
        break;
      }
      case "m_local_resume_nok": {
        if (e.session == this.sipSessionCall) {
          this.sipSessionCall.bTransfering = false;
          this.emit("resumeFailed", e);
          Log.info("Failed to unhold call");
        }
        break;
      }
      case "m_remote_hold": {
        if (e.session == this.sipSessionCall) {
          Log.info("Placed on hold by remote party");
        }
        break;
      }
      case "m_remote_resume": {
        if (e.session == this.sipSessionCall) {
          Log.info("Taken off hold by remote party");
        }
        break;
      }
      case "m_bfcp_info": {
        if (e.session == this.sipSessionCall) {
          txtCallStatus.innerHTML = "BFCP Info: <i>" + e.description + "</i>";
        }
        break;
      }

      case "o_ect_trying": {
        if (e.session == this.sipSessionCall) {
          Log.info("Call transfer in progress...");
        }
        break;
      }
      case "o_ect_accepted": {
        if (e.session == this.sipSessionCall) {
          Log.info("Call transfer accepted");
        }
        break;
      }
      case "o_ect_completed":
      case "i_ect_completed": {
        if (e.session == this.sipSessionCall) {
          Log.info("Call transfer completed");
          if (oSipSessionTransferCall) {
            this.sipSessionCall = oSipSessionTransferCall;
          }
          oSipSessionTransferCall = null;
          this.emit("transferCompleted", e);
        }
        break;
      }
      case "o_ect_failed":
      case "i_ect_failed": {
        if (e.session == this.sipSessionCall) {
          Log.info("Call transfer failed");
          this.emit("transferFailed", e);
        }
        break;
      }
      case "o_ect_notify":
      case "i_ect_notify": {
        if (e.session == this.sipSessionCall) {
          txtCallStatus.innerHTML = "<i>Call Transfer: <b>" + e.getSipResponseCode() + " " + e.description + "</b></i>";
          if (e.getSipResponseCode() >= 300) {
            if (this.sipSessionCall.bHeld) {
              this.sipSessionCall.resume();
            }
            btnTransfer.disabled = false;
          }
        }
        break;
      }
      case "i_ect_requested": {
        if (e.session == this.sipSessionCall) {
          let s_message = "Do you accept call transfer to [" + e.getTransferDestinationFriendlyName() + "]?"; //FIXME: 
          if (confirm(s_message)) {
            txtCallStatus.innerHTML = "<i>Call transfer in progress...</i>";
            this.sipSessionCall.acceptTransfer();
            break;
          }
          this.sipSessionCall.rejectTransfer();
        }
        break;
      }
    }
  }
}

RtcPhone.utils = utils;
RtcPhone.Log = Log;

export default RtcPhone;
