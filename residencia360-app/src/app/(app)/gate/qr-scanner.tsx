"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const SCANNER_DIV_ID = "residencia360-qr-scanner";

export function QrScanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsStarting(true);

    const start = async () => {
      try {
        const html5Qr = new Html5Qrcode(SCANNER_DIV_ID, { verbose: false });
        scannerRef.current = html5Qr;
        await html5Qr.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decoded) => {
            if (cancelled) return;
            await stopInternal(html5Qr);
            setIsOpen(false);
            toast.success(`Codigo leido: ${decoded}`);
            router.push(`/gate?query=${encodeURIComponent(decoded)}`);
          },
          () => {
            // ignorar fallos de decodificacion intermedios
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo iniciar la camara.";
        toast.error(message);
        setIsOpen(false);
      } finally {
        if (!cancelled) setIsStarting(false);
      }
    };

    void start();

    return () => {
      cancelled = true;
      const instance = scannerRef.current;
      if (instance) {
        void stopInternal(instance);
        scannerRef.current = null;
      }
    };
  }, [isOpen, router]);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setIsOpen(true)}>
        <Camera className="h-4 w-4" />
        Escanear QR
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Escanear codigo QR</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-slate-100">
              <div id={SCANNER_DIV_ID} className="h-full w-full" />
              {isStarting ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/40 text-white">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : null}
            </div>
            <p className="text-xs text-slate-500">
              Apunta la camara al codigo QR del visitante. Al detectarlo se rellenara la busqueda en porteria.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

async function stopInternal(scanner: Html5Qrcode) {
  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
    await scanner.clear();
  } catch {
    // ignorar errores de stop si la camara ya termino
  }
}
