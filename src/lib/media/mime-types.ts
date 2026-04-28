export const recorderMimeCandidates = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
] as const;

export function extensionForMimeType(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4";
  return "webm";
}

export function pickSupportedRecorderMimeType() {
  if (typeof MediaRecorder === "undefined") return null;
  return recorderMimeCandidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}
