"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function isBarcodeSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "BarcodeDetector" in window;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const detectedRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      detectedRef.current = false;
      return;
    }

    let cancelled = false;

    async function startScanning() {
      setError("");
      setScanning(true);
      detectedRef.current = false;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const BarcodeDetectorClass = (window as any).BarcodeDetector;
        const detector = new BarcodeDetectorClass({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
        });

        const detect = async () => {
          if (cancelled || detectedRef.current || !videoRef.current) return;

          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes.length > 0 && !detectedRef.current) {
              detectedRef.current = true;
              const code = barcodes[0].rawValue;
              stopCamera();
              onScan(code);
            }
          } catch {
            // Detection frame error — ignore and retry
          }

          if (!cancelled && !detectedRef.current) {
            requestAnimationFrame(detect);
          }
        };

        detect();
      } catch (err) {
        if (!cancelled) {
          setError("Could not access camera. Please allow camera access.");
        }
      } finally {
        setScanning(false);
      }
    }

    startScanning();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, onScan, stopCamera]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-white font-semibold">Scan Barcode</h2>
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="p-2 text-white"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        {/* Scan guide overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-32 border-2 border-white/60 rounded-xl" />
        </div>
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 text-center">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <div className="p-4 text-center">
        <p className="text-white/60 text-sm">Point your camera at a barcode</p>
      </div>
    </div>
  );
}
