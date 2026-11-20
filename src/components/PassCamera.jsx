import { useEffect, useEffectEvent, useRef, useState } from "react";
import { readPassFrame } from "../lib/qrReader";
import { FiArrowUpRight, FiCamera, FiSquare } from "react-icons/fi";

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
    <video hidden={!active} ref={videoRef} className="max-h-[32dvh] w-full rounded-xl bg-ink object-contain" muted playsInline />
    <button type="button" disabled={disabled} onClick={() => { setError(""); setActive(!active); }}
      className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-left font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
      <span className="grid size-10 place-items-center rounded-full bg-ink text-primary">{active ? <FiSquare aria-hidden="true" /> : <FiCamera aria-hidden="true" size={20} />}</span>
      {active ? "Stop camera" : "Scan QR with camera"}
      <FiArrowUpRight aria-hidden="true" className="ml-auto" />
    </button>
    {error && <p role="alert" className="text-sm text-warning">{error}</p>}
  </div>;
}
