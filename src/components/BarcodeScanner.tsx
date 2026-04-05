"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function isBarcodeSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!navigator.mediaDevices?.getUserMedia;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const detectedRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  const CONTAINER_ID = "barcode-scanner-container";

  useEffect(() => {
    if (!open) return;

    let scanner: any = null;
    let mounted = true;
    detectedRef.current = false;
    setError("");

    async function start() {
      // Wait a tick for the DOM element to render
      await new Promise((r) => setTimeout(r, 100));
      if (!mounted) return;

      const container = document.getElementById(CONTAINER_ID);
      if (!container) {
        setError("Scanner container not found. Please try again.");
        return;
      }

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

        // Explicitly enable barcode formats
        scanner = new Html5Qrcode(CONTAINER_ID, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.777,
            disableFlip: false,
          },
          (decodedText: string) => {
            if (!detectedRef.current) {
              detectedRef.current = true;
              scanner.stop().catch(() => {});
              onScanRef.current(decodedText);
            }
          },
          () => {
            // No barcode in frame — ignore
          }
        );
      } catch (err: any) {
        const msg = err?.message || String(err);
        if (msg.includes("Permission") || msg.includes("NotAllowed")) {
          setError("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (msg.includes("NotFound") || msg.includes("DevicesNotFound")) {
          setError("No camera found on this device.");
        } else {
          setError("Could not start camera. Please try again.");
        }
      }
    }

    start();

    return () => {
      mounted = false;
      if (scanner) {
        scanner.stop().catch(() => {});
        scanner.clear().catch(() => {});
      }
    };
  }, [open, retryCount]);

  function handleClose() {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4">
        <h2 className="text-white font-semibold">Scan Barcode</h2>
        <button onClick={handleClose} className="p-2 text-white">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div id={CONTAINER_ID} className="w-full max-w-md" />
      </div>

      {error && (
        <div className="p-4 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => { setError(""); detectedRef.current = false; setRetryCount((c) => c + 1); }}
            className="mt-2 text-sm text-white/60 underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="p-4 text-center">
        <p className="text-white/60 text-sm">Point your camera at a barcode</p>
      </div>
    </div>
  );
}
