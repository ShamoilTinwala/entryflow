import jsQR from "jsqr";

export function readPassFrame(video, canvas) {
  if (!video.videoWidth || !video.videoHeight || video.readyState < 2) return null;
  const scale = Math.min(1, 800 / Math.max(video.videoWidth, video.videoHeight));
  const width = Math.max(1, Math.round(video.videoWidth * scale));
  const height = Math.max(1, Math.round(video.videoHeight * scale));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(video, 0, 0, width, height);
  const frame = context.getImageData(0, 0, width, height);
  return jsQR(frame.data, width, height, { inversionAttempts: "dontInvert" })?.data ?? null;
}
