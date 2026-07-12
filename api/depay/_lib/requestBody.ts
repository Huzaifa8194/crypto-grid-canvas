import type { VercelRequest } from "@vercel/node";

export const depayApiConfig = {
  api: {
    bodyParser: false,
  },
};

export const readRawBody = async (req: VercelRequest): Promise<string> => {
  if (typeof req.body === "string") {
    return req.body;
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf8");
  }

  if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
    return JSON.stringify(req.body);
  }

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve());
    req.on("error", reject);
  });

  return Buffer.concat(chunks).toString("utf8");
};
