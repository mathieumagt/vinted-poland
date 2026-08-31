"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Card, CardBody } from "@/components/ui/Card";

type Order = {
  id: string;
  title: string;
  buyerName: string | null;
  buyerLogin: string | null;
  buyerCountryCode: string | null;
  trackingCode: string | null;
  note: string | null;
  shippingLabelUrl: string | null;
};

async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", "labels");
  const res = await fetch("/api/uploads", { method: "POST", body: form });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Upload failed.");
  return body.url as string;
}

export function EditOrderForm({ order }: { order: Order }) {
  const router = useRouter();
  const [title, setTitle] = useState(order.title);
  const [buyerName, setBuyerName] = useState(order.buyerName ?? "");
  const [buyerLogin, setBuyerLogin] = useState(order.buyerLogin ?? "");
  const [buyerCountryCode, setBuyerCountryCode] = useState(order.buyerCountryCode ?? "");
  const [trackingCode, setTrackingCode] = useState(order.trackingCode ?? "");
  const [note, setNote] = useState(order.note ?? "");
  const [labelFile, setLabelFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const shippingLabelUrl = labelFile ? await uploadFile(labelFile) : undefined;
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          buyerName: buyerName || undefined,
          buyerLogin: buyerLogin || undefined,
          buyerCountryCode: buyerCountryCode || undefined,
          trackingCode: trackingCode || undefined,
          note: note || undefined,
          ...(shippingLabelUrl ? { shippingLabelUrl } : {}),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not save changes.");
        return;
      }
      router.push(`/admin/orders/${order.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Order title" htmlFor="title">
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormField>
          <FormField label="Tracking code" htmlFor="tracking">
            <Input id="tracking" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} />
          </FormField>
          <FormField label="Buyer name" htmlFor="buyerName">
            <Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
          </FormField>
          <FormField label="Buyer Vinted login" htmlFor="buyerLogin">
            <Input id="buyerLogin" value={buyerLogin} onChange={(e) => setBuyerLogin(e.target.value)} />
          </FormField>
          <FormField label="Buyer country" htmlFor="buyerCountry">
            <Input id="buyerCountry" value={buyerCountryCode} onChange={(e) => setBuyerCountryCode(e.target.value)} />
          </FormField>
          <FormField label="Replace shipping label (optional)" htmlFor="label">
            <input
              id="label"
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setLabelFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Note" htmlFor="note">
              <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </FormField>
          </div>
        </CardBody>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
