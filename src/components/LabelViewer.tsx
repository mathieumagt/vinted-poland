"use client";

export function LabelViewer({
  orderId,
  hasLabel,
  compact = false,
}: {
  orderId: string;
  hasLabel: boolean;
  compact?: boolean;
}) {
  if (!hasLabel) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-400 ${
          compact ? "h-28" : "h-40"
        }`}
      >
        No shipping label yet
      </div>
    );
  }

  const previewUrl = `/api/orders/${orderId}/label`;
  const downloadUrl = `/api/orders/${orderId}/label?download=1`;
  const originalUrl = `/api/orders/${orderId}/label?original=1`;

  function handlePrint() {
    // Printing straight from the embedded viewer's own toolbar can fail on some
    // Windows/browser setups ("this application doesn't support print preview").
    // Opening the PDF as its own top-level tab and printing from there is more reliable.
    const win = window.open(previewUrl, "_blank");
    if (!win) return;
    win.addEventListener("load", () => {
      setTimeout(() => {
        win.focus();
        win.print();
      }, 400);
    });
  }

  return (
    <div>
      <iframe
        src={previewUrl}
        className={`w-full rounded-lg border border-zinc-200 bg-white shadow-sm ${compact ? "h-[240px]" : "h-[420px]"}`}
        title="Shipping label"
      />
      <div className={`mt-2 flex gap-4 ${compact ? "text-xs" : "text-sm"}`}>
        <button type="button" onClick={handlePrint} className="font-medium text-accent hover:text-accent-hover">
          Print
        </button>
        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:text-accent-hover">
          Open in new tab
        </a>
        <a href={downloadUrl} className="font-medium text-accent hover:text-accent-hover">
          Download
        </a>
        <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-zinc-600">
          Full page
        </a>
      </div>
    </div>
  );
}
