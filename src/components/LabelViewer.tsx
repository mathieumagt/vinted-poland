function isPdf(url: string) {
  return url.toLowerCase().split("?")[0].endsWith(".pdf");
}

export function LabelViewer({ url }: { url: string | null }) {
  if (!url) {
    return <p className="text-sm text-zinc-400">No shipping label yet.</p>;
  }

  return (
    <div>
      {isPdf(url) ? (
        <iframe src={url} className="h-64 w-full rounded-md border border-zinc-200" title="Shipping label" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Shipping label" className="max-h-64 rounded-md border border-zinc-200 object-contain" />
      )}
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-zinc-600 underline">
        Open / download label
      </a>
    </div>
  );
}
