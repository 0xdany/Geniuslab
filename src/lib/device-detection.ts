import { UAParser } from "ua-parser-js";

export function isUnsupportedCandidateDevice(headers: Headers) {
  const ua = headers.get("user-agent") || "";
  const mobileHint = headers.get("sec-ch-ua-mobile");
  const platformHint = headers.get("sec-ch-ua-platform") || "";
  const parser = new UAParser(ua);
  const deviceType = parser.getDevice().type;

  if (mobileHint === "?1") return true;
  if (deviceType === "mobile" || deviceType === "tablet") return true;
  if (/Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua)) return true;
  if (/Android|iOS/i.test(platformHint)) return true;
  return false;
}
