// COSTERA — Générateur de PDF minimaliste (aucune dépendance externe).
// Produit un document A4 (une ou plusieurs pages) composé de lignes de texte,
// suffisant pour les reçus et fiches imprimables.

export interface PdfLine {
  text: string;
  size?: number;
  bold?: boolean;
  /** Espace supplémentaire après la ligne (points). */
  gapAfter?: number;
}

function esc(s: string): string {
  // Échappe les caractères PDF et translittère les glyphes non Latin-1.
  return s
    .replace(/[\\()]/g, (c) => `\\${c}`)
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .replace(/€/g, 'FCFA')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Construit un PDF et retourne un Buffer. */
export function buildPdf(lines: PdfLine[], docTitle = 'COSTERA'): Buffer {
  const pageHeight = 842; // A4
  const margin = 56;
  let y = pageHeight - margin;

  const pages: string[][] = [[]];
  let pageIndex = 0;
  const push = (content: string) => pages[pageIndex].push(content);

  for (const line of lines) {
    const size = line.size ?? 11;
    const leading = size * 1.35;
    if (y - leading < margin) {
      pages.push([]);
      pageIndex += 1;
      y = pageHeight - margin;
    }
    const font = line.bold ? '/F2' : '/F1';
    push(`BT ${font} ${size} Tf ${margin} ${y.toFixed(1)} Td (${esc(line.text)}) Tj ET`);
    y -= leading + (line.gapAfter ?? 0);
  }

  const fontPlain = 3;
  const fontBold = 4;
  const infoObj = 5;
  const firstPageObj = 6;
  const pageObjIds = pages.map((_, i) => firstPageObj + i * 2);
  const contentObjIds = pages.map((_, i) => firstPageObj + i * 2 + 1);

  const objs: string[] = [];
  objs.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  objs.push(`2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj\n`);
  objs.push(`${fontPlain} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
  objs.push(`${fontBold} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`);
  objs.push(`${infoObj} 0 obj\n<< /Title (${esc(docTitle)}) /Producer (COSTERA) >>\nendobj\n`);

  pages.forEach((content, i) => {
    const stream = content.join('\n');
    objs.push(
      `${pageObjIds[i]} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
        `/Resources << /Font << /F1 ${fontPlain} 0 R /F2 ${fontBold} 0 R >> >> ` +
        `/Contents ${contentObjIds[i]} 0 R >>\nendobj\n`,
    );
    objs.push(
      `${contentObjIds[i]} 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
    );
  });

  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (const o of objs) {
    offsets.push(Buffer.byteLength(out, 'utf8'));
    out += o;
  }
  const xrefPos = Buffer.byteLength(out, 'utf8');
  const count = objs.length + 1;
  out += `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    out += `${String(off).padStart(10, '0')} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${count} /Root 1 0 R /Info ${infoObj} 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return Buffer.from(out, 'utf8');
}
