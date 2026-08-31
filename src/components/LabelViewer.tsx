export function LabelViewer({ url }: { url: string | null }) {
  if (!url) {
    return <p className="text-sm text-zinc-400">No shipping label yet.</p>;
  }

  return (
    <div>
      {/* DOTB label URLs have no file extension (they're PDFs served without one), and manual
          uploads can be PDF or image — an iframe renders either via the browser's native viewer. */}
      <iframe src={url} className="h-80 w-full rounded-md border border-zinc-200 bg-white" title="Shipping label" />
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-zinc-600 underline">
        Open / download label
      </a>
    </div>
  );
}
