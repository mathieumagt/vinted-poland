"use client";

export function LabelViewer({ orderId, hasLabel }: { orderId: string; hasLabel: boolean }) {
  if (!hasLabel) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-400">
        No shipping label yet
      </div>
    );
  }

  const previewUrl = `/api/orders/${orderId}/label`;
  const downloadUrl = `/api/orders/${orderId}/label?download=1`;

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
        className="h-[420px] w-full rounded-lg border border-zinc-200 bg-white shadow-sm"
        title="Shipping label"
      />
      <div className="mt-2 flex gap-4 text-sm">
        <button type="button" onClick={handlePrint} className="font-medium text-accent hover:text-accent-hover">
          Print
        </button>
        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-accent hover:text-accent-hover">
          Open in new tab
        </a>
        <a href={downloadUrl} className="font-medium text-accent hover:text-accent-hover">
          Download
        </a>
      </div>
    </div>
  );
}
