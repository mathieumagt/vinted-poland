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

  return (
    <div>
      <iframe
        src={previewUrl}
        className="h-[420px] w-full rounded-lg border border-zinc-200 bg-white shadow-sm"
        title="Shipping label"
      />
      <div className="mt-2 flex gap-4 text-sm">
        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:text-indigo-700">
          Open in new tab
        </a>
        <a href={downloadUrl} className="font-medium text-indigo-600 hover:text-indigo-700">
          Download
        </a>
      </div>
    </div>
  );
}
