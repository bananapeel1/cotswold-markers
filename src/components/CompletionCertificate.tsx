"use client";

import { useRef } from "react";

interface CompletionCertificateProps {
  userName: string;
  completionDate: string;
  badgeCount: number;
}

export default function CompletionCertificate({
  userName,
  completionDate,
  badgeCount,
}: CompletionCertificateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function drawCertificate(): HTMLCanvasElement | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const w = 800;
    const h = 500;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = "#f8f5f0";
    ctx.fillRect(0, 0, w, h);

    // Border
    ctx.strokeStyle = "#173124";
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    // Inner border
    ctx.strokeStyle = "#173124";
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    // Title
    ctx.fillStyle = "#173124";
    ctx.font = "bold 14px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TRAILTAP · COTSWOLD WAY", w / 2, 80);

    // Trophy icon (text)
    ctx.font = "48px serif";
    ctx.fillText("🏆", w / 2, 140);

    // Certificate title
    ctx.fillStyle = "#173124";
    ctx.font = "bold 36px Manrope, sans-serif";
    ctx.fillText("Cotswold Conqueror", w / 2, 195);

    // Subtitle
    ctx.fillStyle = "#665d4e";
    ctx.font = "16px Manrope, sans-serif";
    ctx.fillText("This certifies that", w / 2, 240);

    // Name
    ctx.fillStyle = "#173124";
    ctx.font = "bold 28px Manrope, sans-serif";
    ctx.fillText(userName || "Trail Walker", w / 2, 280);

    // Achievement
    ctx.fillStyle = "#665d4e";
    ctx.font = "16px Manrope, sans-serif";
    ctx.fillText("has completed all 15 markers along the 102-mile Cotswold Way", w / 2, 320);

    // Date
    const dateStr = new Date(completionDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    ctx.fillText(`Completed on ${dateStr}`, w / 2, 350);

    // Badge count
    ctx.fillStyle = "#173124";
    ctx.font = "bold 14px Manrope, sans-serif";
    ctx.fillText(`${badgeCount} badges earned`, w / 2, 390);

    // Footer
    ctx.fillStyle = "#8a7f6f";
    ctx.font = "12px Manrope, sans-serif";
    ctx.fillText("trail.thecotswoldsway.com", w / 2, 450);

    return canvas;
  }

  function download() {
    const canvas = drawCertificate();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "cotswold-conqueror-certificate.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function share() {
    const canvas = drawCertificate();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "cotswold-conqueror.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Cotswold Conqueror!",
          text: "I completed all 15 markers on the Cotswold Way with TrailTap!",
          files: [file],
        });
      } else {
        download();
      }
    });
  }

  return (
    <div className="bg-surface-container-low rounded-xl p-5">
      <h2 className="font-headline font-bold text-primary text-lg mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
        Completion Certificate
      </h2>
      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-primary-fixed rounded-lg p-6 text-center mb-4">
        <p className="text-xs font-bold text-on-primary-fixed-variant uppercase tracking-widest mb-1">Cotswold Way</p>
        <p className="font-headline font-extrabold text-xl text-primary mb-1">Cotswold Conqueror</p>
        <p className="text-sm text-on-primary-fixed-variant">{userName || "Trail Walker"}</p>
        <p className="text-xs text-on-primary-fixed-variant mt-2">
          All 15 markers · {badgeCount} badges earned
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={download}
          className="flex-1 bg-surface-container text-primary py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-base">download</span>
          Download
        </button>
        <button
          onClick={share}
          className="flex-1 bg-primary text-on-primary py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-base">share</span>
          Share
        </button>
      </div>
    </div>
  );
}
