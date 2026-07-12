import { useState, useCallback, useRef, useEffect } from 'react';

export interface BarcodeScannerResult {
  code: string;
  format: string;
}

export function useBarcodeScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startScanning = useCallback(async (onDetect: (result: BarcodeScannerResult) => void) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('El escáner de cámara no está disponible en este dispositivo');
      return;
    }

    try {
      setScanning(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Create canvas for barcode detection
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      // Start barcode detection loop
      detectBarcode(onDetect);
    } catch (err: any) {
      setError(`No se pudo acceder a la cámara: ${err.message}`);
      setScanning(false);
    }
  }, []);

  const stopScanning = useCallback(() => {
    setScanning(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const detectBarcode = useCallback(
    (onDetect: (result: BarcodeScannerResult) => void) => {
      if (!scanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
        animationRef.current = requestAnimationFrame(() => detectBarcode(onDetect));
        return;
      }

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        animationRef.current = requestAnimationFrame(() => detectBarcode(onDetect));
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Try to use BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
          });

          detector
            .detect(canvas)
            .then((barcodes: any[]) => {
              if (barcodes.length > 0) {
                onDetect({
                  code: barcodes[0].rawValue,
                  format: barcodes[0].format,
                });
              } else if (scanning) {
                animationRef.current = requestAnimationFrame(() => detectBarcode(onDetect));
              }
            })
            .catch(() => {
              if (scanning) {
                animationRef.current = requestAnimationFrame(() => detectBarcode(onDetect));
              }
            });
          return;
        } catch (e) {
          // Fall through to fallback
        }
      }

      // Fallback: simple scan interval
      if (scanning) {
        animationRef.current = requestAnimationFrame(() => detectBarcode(onDetect));
      }
    },
    [scanning]
  );

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    videoRef,
    scanning,
    error,
    startScanning,
    stopScanning,
  };
}
