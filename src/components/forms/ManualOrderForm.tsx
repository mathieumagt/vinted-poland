"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

type ItemDraft = { title: string; size: string; sku: string; photoFile: File | null };

async function uploadFile(file: File, folder: "photos" | "labels"): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Upload failed.");
  return body.url as string;
}

export function ManualOrderForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerLogin, setBuyerLogin] = useState("");
  const [buyerCountryCode, setBuyerCountryCode] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [note, setNote] = useState("");
  const [labelFile, setLabelFile] = useState<File | null>(null);
  const [items, setItems] = useState<ItemDraft[]>([{ title: "", size: "", sku: "", photoFile: null }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const shippingLabelUrl = labelFile ? await uploadFile(labelFile, "labels") : undefined;
      const uploadedItems = await Promise.all(
        items
          .filter((item) => item.title.trim())
          .map(async (item) => ({
            title: item.title,
            size: item.size || undefined,
            sku: item.sku || undefined,
            thumbnailUrl: item.photoFile ? await uploadFile(item.photoFile, "photos") : undefined,
          }))
      );

      if (uploadedItems.length === 0) {
        setError("Add at least one item with a title.");
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          buyerName: buyerName || undefined,
          buyerLogin: buyerLogin || undefined,
          buyerCountryCode: buyerCountryCode || undefined,
          trackingCode: trackingCode || undefined,
          note: note || undefined,
          shippingLabelUrl,
          items: uploadedItems,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not create the order.");
        return;
      }
      router.push(`/admin/orders/${body.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="font-medium text-zinc-900">Order</CardHeader>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Order title" htmlFor="title">
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Zara jacket size M" />
          </FormField>
          <FormField label="Tracking code (optional)" htmlFor="tracking">
            <Input id="tracking" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} />
          </FormField>
          <FormField label="Buyer name (optional)" htmlFor="buyerName">
            <Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
          </FormField>
          <FormField label="Buyer Vinted login (optional)" htmlFor="buyerLogin">
            <Input id="buyerLogin" value={buyerLogin} onChange={(e) => setBuyerLogin(e.target.value)} />
          </FormField>
          <FormField label="Buyer country (optional)" htmlFor="buyerCountry">
            <Input id="buyerCountry" value={buyerCountryCode} onChange={(e) => setBuyerCountryCode(e.target.value)} placeholder="PL" />
          </FormField>
          <FormField label="Shipping label file (PDF or image)" htmlFor="label">
            <input
              id="label"
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setLabelFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Note (optional)" htmlFor="note">
              <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </FormField>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between font-medium text-zinc-900">
          <span>Items</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setItems((prev) => [...prev, { title: "", size: "", sku: "", photoFile: null }])}
          >
            + Add item
          </Button>
        </CardHeader>
        <CardBody className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-3 rounded-md border border-zinc-200 p-3 sm:grid-cols-4">
              <FormField label="Item title" htmlFor={`item-title-${index}`}>
                <Input
                  id={`item-title-${index}`}
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Size (optional)" htmlFor={`item-size-${index}`}>
                <Input
                  id={`item-size-${index}`}
                  value={item.size}
                  onChange={(e) => updateItem(index, { size: e.target.value })}
                  placeholder="e.g. M"
                />
              </FormField>
              <FormField label="SKU (optional)" htmlFor={`item-sku-${index}`}>
                <Input id={`item-sku-${index}`} value={item.sku} onChange={(e) => updateItem(index, { sku: e.target.value })} />
              </FormField>
              <FormField label="Photo (optional)" htmlFor={`item-photo-${index}`}>
                <input
                  id={`item-photo-${index}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => updateItem(index, { photoFile: e.target.files?.[0] ?? null })}
                  className="w-full text-sm"
                />
              </FormField>
              {items.length > 1 && (
                <div className="sm:col-span-4">
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove item
                  </button>
                </div>
              )}
            </div>
          ))}
        </CardBody>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create order"}
      </Button>
    </form>
  );
}
