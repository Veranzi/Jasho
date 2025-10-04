declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
    text: string;
  }
  function pdf(buffer: Buffer): Promise<PDFData>;
  export default pdf;
}

declare module 'qrcode-reader' {
  class QrCodeReader {
    callback: (err: any, value: any) => void;
    decode(imageData: any): void;
  }
  export default QrCodeReader;
}

declare module 'compression';
