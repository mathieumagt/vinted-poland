"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export function AddStockForm() {
  const router = useRouter();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!photoFile) {
      setError("A photo is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", photoFile);
      form.append("folder", "photos");
      const uploadRes = await fetch("/api/uploads", { method: "POST", body: form });
      const uploadBody = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadBody.error ?? "Upload failed.");
        return;
      }

      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl: uploadBody.url,
          title: title || undefined,
          note: note || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not add to stock.");
        return;
      }

      setPhotoFile(null);
      setTitle("");
      setNote("");
      const fileInput = document.getElementById("stock-photo") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="font-medium text-zinc-900">Add a garment to stock</CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <FormField label="Photo" htmlFor="stock-photo">
            <input
              id="stock-photo"
              type="file"
              accept="image/*"
              required
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </FormField>
          <FormField label="Title (optional)" htmlFor="stock-title">
            <Input id="stock-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Black jacket size M" />
          </FormField>
          <FormField label="Note (optional)" htmlFor="stock-note">
            <Input id="stock-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why it's here" />
          </FormField>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add to stock"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </CardBody>
    </Card>
  );
}
