declare module "pdf-parse" {
  interface PdfParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: unknown;
    metadata: unknown;
    version: string;
  }

  function pdfParse(data: Buffer | Uint8Array, options?: unknown): Promise<PdfParseResult>;

  export default pdfParse;
}

declare module "mammoth" {
  interface MammothConvertResult {
    value: string;
    messages: Array<{ message: string; type: string }>;
  }

  interface Mammoth {
    extractRawText(input: { buffer: Buffer }, options?: unknown): Promise<MammothConvertResult>;
  }

  const mammoth: Mammoth;
  export default mammoth;
}
