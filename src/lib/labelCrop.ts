import { PDFDocument } from "pdf-lib";

const PT_PER_MM = 2.8346456693;

// DOTB's carrier labels (checked against real Vinted Go and Mondial
// Relay/InPost samples) all place the actual shipping label in the top-left
// corner of an A4 sheet, with everything else (return slips, partner ads,
// "insert inside the parcel" info sheets) to the right or below it. 105x150mm
// comfortably contains the label content in both samples with a small margin,
// and matches standard 4x6"/10x15cm thermal label rolls.
const CROP_WIDTH_PT = 105 * PT_PER_MM;
const CROP_HEIGHT_PT = 150 * PT_PER_MM;

/**
 * Crops every page of a shipping label PDF to the top-left corner, at
 * standard thermal-printer label dimensions, so it prints cleanly on a
 * 4x6"/10x15cm label printer instead of a full A4 sheet. Best-effort: if a
 * page is already that size (or smaller) this is a no-op; if the PDF can't
 * be parsed at all, the caller should fall back to the original bytes.
 */
export async function cropLabelToThermalSize(bytes: ArrayBuffer): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(bytes);

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    const cropWidth = Math.min(width, CROP_WIDTH_PT);
    const cropHeight = Math.min(height, CROP_HEIGHT_PT);
    const x = 0;
    const y = height - cropHeight;

    page.setMediaBox(x, y, cropWidth, cropHeight);
    page.setCropBox(x, y, cropWidth, cropHeight);
  }

  return pdfDoc.save();
}
