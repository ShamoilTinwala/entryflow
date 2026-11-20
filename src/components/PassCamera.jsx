import { useEffect, useEffectEvent, useRef, useState } from "react";
import { readPassFrame } from "../lib/qrReader";

function cameraMessage(error) {
  if (error.name === "NotAllowedError") return "Allow camera access in your browser’s site settings, then try again.";
  if (error.name === "NotFoundError") return "No camera found. Connect a camera or enter the pass code below.";
  if (error.name === "NotReadableError") return "The camera is busy. Close other apps using it and try again.";
  return "Could not read from the camera. Restart it or enter the pass code below.";
}

export default function PassCamera({ onCode, disabled }) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const acceptCode = useEffectEvent(onCode);

  useEffect(() => {
    if (!active || disabled) return;
    const video = videoRef.current;
    let cancelled = false;
    let stream;
    let timer;
    function failed(error) {
      if (cancelled) return;
      setError(cameraMessage(error));
      setActive(false);
    }
    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera access requires a camera-enabled browser over HTTPS. You can enter the pass code below.");
        setActive(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" } } });
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        const canvas = document.createElement("canvas");
        function scan() {
          if (cancelled) return;
          try {
            const value = readPassFrame(video, canvas);
            if (value) {
              setActive(false);
              acceptCode(value);
              return;
            }
            timer = setTimeout(scan, 120);
          } catch (error) { failed(error); }
        }
        scan();
      } catch (error) { failed(error); }
    }
    start();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      stream?.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    };
  }, [active, disabled]);

  return <div className="space-y-2">
    <video hidden={!active} ref={videoRef} className="max-h-[32dvh] w-full rounded-xl bg-gray-950 object-contain" muted playsInline />
    <button type="button" disabled={disabled} onClick={() => { setError(""); setActive(!active); }}
      className="min-h-12 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50">
      {active ? "Stop camera" : "Scan QR with camera"}
    </button>
    {error && <p role="alert" className="text-sm text-amber-700">{error}</p>}
  </div>;
}
