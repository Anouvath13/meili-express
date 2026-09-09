// `code` is optional and machine-readable — the frontend maps known codes to
// lo/zh/en copy and falls back to `message` (Thai, dev-facing) for anything
// unmapped. Without this, every error surfaced to a 3-language UI would be
// stuck in Thai regardless of the viewer's chosen language.
export class AppError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
