export const recorderMimeCandidates = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=h264,aac",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
] as const;

export function extensionForMimeType(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  return "webm";
}

export function pickSupportedRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  return recorderMimeCandidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}
