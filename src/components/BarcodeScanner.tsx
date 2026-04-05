"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function isBarcodeSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!navigator.mediaDevices?.getUserMedia;
}

const CONTAINER_ID = "barcode-scanner-container";

async function stopScanner(scanner: any) {
  if (!scanner) return;
  try {
    const state = scanner.getState?.();
    // Html5QrcodeScannerState: NOT_STARTED=1, SCANNING=2, PAUSED=3
    if (state === 2 || state === 3) {
      await scanner.stop();
    }
    scanner.clear();
  } catch {
    // Best-effort cleanup
  }
}

async function waitForContainer(id: string, maxAttempts = 10): Promise<HTMLElement | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const el = document.getElementById(id);
    if (el) return el;
    await new Promise((r) => setTimeout(r, 50));
  }
  return null;
}

export function BarcodeScanner({ open, onClose, onScan }: BarcodeScannerProps) {
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [cameraStatus, setCameraStatus] = useState<"starting" | "active" | "error">("starting");
  const [manualBarcode, setManualBarcode] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const detectedRef = useRef(false);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!open) return;

    let scanner: any = null;
    let mounted = true;
    detectedRef.current = false;
    setError("");
    setCameraStatus("starting");

    async function start() {
      const container = await waitForContainer(CONTAINER_ID);
      if (!mounted) return;

      if (!container) {
        setError("Scanner container not found. Please try again.");
        setCameraStatus("error");
        setShowManualEntry(true);
        return;
      }

      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

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

        const scanConfig = {
          fps: 15,
          qrbox: { width: Math.min(280, window.innerWidth - 40), height: 150 },
          aspectRatio: 1.777,
          disableFlip: false,
        };

        const onSuccess = (decodedText: string) => {
          if (!detectedRef.current) {
            detectedRef.current = true;
            scanner.stop().catch(() => {});
            onScanRef.current(decodedText);
          }
        };

        const onError = () => {
          // No barcode in frame — ignore
        };

        // Camera fallback chain: environment → user → first available device
        let started = false;

        // Try 1: Rear camera
        try {
          await scanner.start({ facingMode: "environment" }, scanConfig, onSuccess, onError);
          started = true;
        } catch {
          // Rear camera unavailable, try front
        }

        // Try 2: Front camera
        if (!started) {
          try {
            await scanner.start({ facingMode: "user" }, scanConfig, onSuccess, onError);
            started = true;
          } catch {
            // Front camera also unavailable
          }
        }

        // Try 3: Enumerate devices and use first available
        if (!started) {
          try {
            const cameras = await Html5Qrcode.getCameras();
            if (cameras.length > 0) {
              await scanner.start(cameras[0].id, scanConfig, onSuccess, onError);
              started = true;
            }
          } catch {
            // Device enumeration failed
          }
        }

        if (!mounted) return;

        if (started) {
          setCameraStatus("active");
        } else {
          setCameraStatus("error");
          setError("Could not access any camera. You can type the barcode manually below.");
          setShowManualEntry(true);
        }
      } catch (err: any) {
        if (!mounted) return;
        const msg = err?.message || String(err);
        if (msg.includes("Permission") || msg.includes("NotAllowed")) {
          setError("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (msg.includes("NotFound") || msg.includes("DevicesNotFound")) {
          setError("No camera found on this device.");
        } else {
          setError("Could not start camera. You can type the barcode manually below.");
        }
        setCameraStatus("error");
        setShowManualEntry(true);
      }
    }

    start();

    return () => {
      mounted = false;
      stopScanner(scanner);
    };
  }, [open, retryCount]);

  async function handleClose() {
    await stopScanner(scannerRef.current);
    scannerRef.current = null;
    onClose();
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = manualBarcode.trim();
    if (!/^\d{8,14}$/.test(cleaned)) {
      setError("Please enter a valid barcode (8-14 digits).");
      return;
    }
    stopScanner(scannerRef.current);
    scannerRef.current = null;
    onScanRef.current(cleaned);
  }

  function handleRetry() {
    setError("");
    setShowManualEntry(false);
    detectedRef.current = false;
    setRetryCount((c) => c + 1);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div
        className="flex items-center justify-between p-4 z-10"
        style={{ paddingTop: "max(env(safe-area-inset-top, 16px), 16px)" }}
      >
        <h2 className="text-white font-semibold text-lg">Scan Barcode</h2>
        <button
          onClick={handleClose}
          className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-full font-semibold text-sm shadow-lg active:bg-gray-200"
        >
          <X className="h-4 w-4" />
          Close
        </button>
      </div>

      {/* Camera viewport */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        {cameraStatus === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Loader2 className="h-5 w-5 animate-spin" />
              Starting camera...
            </div>
          </div>
        )}
        <div id={CONTAINER_ID} className="w-full max-w-md" />
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 pb-2 text-center">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-white text-black rounded-lg font-medium text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Bottom section: manual entry + hint */}
      <div
        className="p-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)" }}
      >
        {!showManualEntry ? (
          <button
            onClick={() => setShowManualEntry(true)}
            className="text-white/60 text-sm underline w-full text-center"
          >
            Type barcode manually
          </button>
        ) : (
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter barcode number"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 outline-none focus:border-white/40"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-white text-black rounded-lg font-medium text-sm"
            >
              Look up
            </button>
          </form>
        )}
        {cameraStatus === "active" && !error && (
          <p className="text-white/40 text-xs text-center mt-2">
            Point camera at a barcode
          </p>
        )}
      </div>
    </div>
  );
}
