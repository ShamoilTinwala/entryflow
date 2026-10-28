export function eventInvitation(event) {
  const date = event.date ? new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, { dateStyle: "long" }) : "Date to be announced";
  const time = [event.startTime, event.endTime].filter(Boolean).join("–");
  const details = [event.name, `${date}${time ? ` · ${time}` : ""}`, event.venue, event.address, event.mapUrl, event.description, event.invitationMessage].filter(Boolean);
  return details.join("\n");
}

export function publicUrl(path) {
  return new URL(path, window.location.origin).toString();
}

async function qrPng(svgElement) {
  if (!svgElement) return null;
  const source = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(svgBlob);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 640;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function sharePass({ event, pass, svgElement }) {
  const url = publicUrl(`/pass/${encodeURIComponent(pass.code)}`);
  const text = `${eventInvitation(event)}\n\nGuest pass for ${pass.primaryName} · ${pass.totalCount} people`;
  const png = await qrPng(svgElement);
  const file = png ? new File([png], `entryflow-${pass.code}.png`, { type: "image/png" }) : null;
  if (navigator.share && file && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: `${event.name} guest pass`, text, url, files: [file] });
    return "shared";
  }
  if (navigator.share) {
    await navigator.share({ title: `${event.name} guest pass`, text: `${text}\n${url}` });
    return "shared";
  }
  if (file && navigator.clipboard?.write && globalThis.ClipboardItem) {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png, "text/plain": new Blob([`${text}\n${url}`], { type: "text/plain" }) })]);
      return "copied-with-image";
    } catch {
      // Some browsers allow text but deny image clipboard writes.
    }
  }
  await navigator.clipboard.writeText(`${text}\n${url}`);
  return "copied";
}

export function shareWhatsApp(text, url) {
  const message = `${text}\n${url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

export async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

export async function downloadQr(svgElement, filename) {
  const png = await qrPng(svgElement);
  if (!png) throw new Error("QR image is not ready");
  const url = URL.createObjectURL(png);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
