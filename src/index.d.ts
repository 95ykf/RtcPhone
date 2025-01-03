/// <reference lib="dom"/>

import { CallType } from "./types";

declare class RtcPhone {
  constructor(options: RtcPhone.Options);

  /**
   * 属性配置
   */
  readonly options: RtcPhone.Options;

  /**
   * sip初始化
   */
  sipInit(): void;

  /**
   * 发送sip注册指令
   */
  sipRegister(options: RtcPhone.RegisterOptions): void;

  /**
   * 取消SIP注册
   */
  sipUnRegister(): void;

  /**
   * makes a call (SIP INVITE)
   * @param type 呼叫类型
   * @param phoneNumber 电话号码
   */
  sipCall(type: CallType, phoneNumber: string): void;

  /**
   * sip answer
   */
  sipAnswer(): void;

  /**
   * 工具库
   */
  static utils: {
    /**
     * 提示消息
     * @param msg 消息内容
     *
     * 缺省插件以 alert 方式弹出，用户可以覆盖的弹窗方法。提示消息默认使用 alert
     */
    showMessage(msg: string): void;
    checkPhoneNumber(num: number | string): boolean;
    parseParam(param: any): string;
    isFunction(f: any): boolean;
    firstUpperCase(str: string): any;
    trim(str: string): any;
  };

  
  /**
   * 日志打印类，用于用户复写后自定义显示
   */
  static Log: {
    /**
     * 基础日志
     * @param message 日志消息
     * @param args
     */
    log(message: string, ...args: any[]): void;

    /**
     * 信息日志
     * @param message 日志消息
     * @param args
     */
    info(message: string, ...args: any[]): void;

    /**
     * 错误日志
     * @param message 日志消息
     * @param args
     */
    error(message: string, ...args: any[]): void;
  };
}

declare namespace RtcPhone {
  interface Options {
    debugLevel?: string;
    webRtcType?: string;
    pfs?: number;
    maxVideoSize?: string;
    maxBandwidthUp?: number;
    maxBandwidthDown?: number;
    zeroArtifacts?: boolean;
    startNativeDebug?: boolean;

    ringToneDom?: HTMLAudioElement;
    ringbackToneDom?: HTMLAudioElement;

    audioRemoteDom: HTMLAudioElement;
    videoLocalDom?: HTMLVideoElement;
    videoRemoteDom?: HTMLVideoElement;

    /**
     * 初始化成功事件
     * @returns
     */
    onInitialized?: () => void;
    /**
     * Stack开启失败事件
     * @param event 错误信息
     * @returns
     */
    onStackStartFailed?: (event?: SIPml.Session.Event) => void;
    /**
     * 链接并注册成功事件
     * @returns
     */
    onConnected?: () => void;
    /**
     * 断开连接事件
     * @returns
     */
    onDisconnected?: () => void;
    /**
     * 振铃事件
     * @param remoteNumber 呼叫号码
     * @returns
     */
    onRinging?: (remoteNumber: number) => void;
    /**
     * 呼叫事件
     * @param event 事件内容
     * @returns
     */
    onDialing?: (event: SIPml.Session.Event) => void;
    /**
     * 通话建立事件
     * @param event 事件内容
     * @returns
     */
    onTalking?: (event: SIPml.Session.Event) => void;
    /**
     * 通话结束事件
     * @param event 事件内容
     * @returns
     */
    onReleased?: (event: SIPml.Session.Event) => void;
  }

  interface RegisterOptions {
    displayName: string;
    privateIdentity: string;
    publicIdentity: string;
    password: string;
    realm: string;
    websocketProxyUrl?: string;
  }
}

export = RtcPhone;
