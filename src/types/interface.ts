
/**
 * 呼叫类型
 */
export type CallType =
  | "call-audio"
  | "call-audiovideo"
  | "call-video"
  | "call-screenshare";
export const CallTypes = {
  callAudio: "call-audio" as const,
  callAudiovideo: "call-audiovideo" as const,
  callVideo: "call-video" as const,
  callScreenshare: "call-screenshare" as const,
};

