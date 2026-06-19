// Generates the downloadable CV PDF from cv-data.js using jsPDF.
import { jsPDF } from "jspdf";
import { CV } from "./cv-data.js";

const MARGIN = 18;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = [74, 56, 38];
const FAINT = [117, 97, 74];
const LEAF = [53, 96, 38];
const APPLE = [180, 58, 42];

export function downloadCvPdf() {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 0;

  // ---- header band ----
  doc.setFillColor(...LEAF);
  doc.rect(0, 0, PAGE_W, 34, "F");
  doc.setTextColor(246, 237, 214);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(CV.name, MARGIN, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`${CV.title} · ${CV.company}`, MARGIN, 24);
  doc.setFontSize(8.5);
  doc.setTextColor(214, 230, 190);
  const contact = `${CV.location}   ·   ${CV.email}   ·   ${CV.github}   ·   ${CV.linkedin}`;
  doc.text(contact, MARGIN, 30);

  y = 44;

  const sectionTitle = (title) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...LEAF);
    doc.text(title, MARGIN, y);
    doc.setDrawColor(...APPLE);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y + 1.6, PAGE_W - MARGIN, y + 1.6);
    y += 8;
  };

  const bodyText = (text, indent = 0, size = 10) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(text, CONTENT_W - indent);
    doc.text(lines, MARGIN + indent, y);
    y += lines.length * (size * 0.42) + 1.5;
  };

  // ---- about ----
  sectionTitle("About me");
  bodyText(CV.summary);
  y += 4;

  // ---- experience ----
  sectionTitle("My story");
  for (const job of CV.experience) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(`${job.role} — ${job.org}`, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...FAINT);
    doc.text(job.period, PAGE_W - MARGIN, y, { align: "right" });
    y += 5.5;
    for (const p of job.points) {
      doc.setFontSize(10);
      doc.setTextColor(...INK);
      doc.text("•", MARGIN + 2, y);
      const lines = doc.splitTextToSize(p, CONTENT_W - 8);
      doc.text(lines, MARGIN + 6, y);
      y += lines.length * 4.2 + 0.8;
    }
    y += 3;
  }

  // ---- highlights ----
  sectionTitle("A few little wins");
  for (const a of CV.achievements) {
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text("•", MARGIN + 2, y);
    const lines = doc.splitTextToSize(a, CONTENT_W - 8);
    doc.text(lines, MARGIN + 6, y);
    y += lines.length * 4.2 + 0.8;
  }
  y += 4;

  // ---- skills ----
  sectionTitle("What I tinker with");
  for (const [group, items] of Object.entries(CV.skills)) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...FAINT);
    const label = group.replace(/\s*\(.*\)\s*/, "").trim() + ":";
    doc.text(label, MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(items.join("  ·  "), MARGIN + 42, y);
    y += 5.5;
  }
  y += 4;

  // ---- education & languages ----
  sectionTitle("Where I learned & languages");
  for (const e of CV.education) {
    bodyText(`${e.school} (${e.period}) — ${e.note}`);
  }
  bodyText("Languages: " + CV.languages.join(", "));

  // ---- footer ----
  doc.setFontSize(8);
  doc.setTextColor(...FAINT);
  doc.text(
    "This CV is also a place you can walk around — an apple orchard built with Three.js.",
    MARGIN,
    288,
  );

  doc.save("Ivan_Pelivan_CV.pdf");
}
