"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function QRPreview({ url }: { url: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: { dark: "#173124", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [url]);

  if (!qrDataUrl) return null;

  return (
    <div className="text-center">
      <img
        src={qrDataUrl}
        alt={`QR code for ${url}`}
        className="mx-auto rounded-lg"
        width={200}
        height={200}
      />
      <p className="text-xs text-on-surface-variant mt-2 font-mono break-all">
        {url}
      </p>
    </div>
  );
}
