"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

// Always show the barcode button — html5-qrcode works on all mobile browsers
export function isBarcodeSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!navigator.mediaDevices;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<string>("barcode-scanner-container");
  const [error, setError] = useState("");
  const detectedRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!open) return;

    let scanner: any = null;
    detectedRef.current = false;
    setError("");

    async function start() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        scanner = new Html5Qrcode(containerRef.current);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 120 },
            aspectRatio: 1.777,
          },
          (decodedText: string) => {
            if (!detectedRef.current) {
              detectedRef.current = true;
              scanner.stop().catch(() => {});
              onScanRef.current(decodedText);
            }
          },
          () => {
            // Ignore scan failures (no barcode in frame)
          }
        );
      } catch (err) {
        setError("Could not access camera. Please allow camera access and try again.");
      }
    }

    start();

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
        scanner.clear().catch(() => {});
      }
    };
  }, [open]);

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
        <div id={containerRef.current} className="w-full max-w-md" />
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
