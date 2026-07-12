import crypto, { createPrivateKey, createPublicKey } from "node:crypto";

const depayPublicKeyPem = process.env.DEPAY_PUBLIC_KEY?.replace(/\\n/g, "\n");

const urlSafeBase64ToBuffer = (value: string): Buffer => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64");
};

export const verifyDepaySignature = async (
  signature: string | string[] | undefined,
  data: string
): Promise<boolean> => {
  if (!signature || !depayPublicKeyPem) {
    return false;
  }

  const normalizedSignature = Array.isArray(signature) ? signature[0] : signature;

  try {
    const dynamicVerify = await import("@depay/js-verify-signature")
      .then((module) => module.verify)
      .catch(() => null);

    if (dynamicVerify) {
      return dynamicVerify({
        signature: normalizedSignature,
        data,
        publicKey: depayPublicKeyPem,
      });
    }
  } catch {
    // Fall back to native verification below.
  }

  const publicKey = createPublicKey(depayPublicKeyPem);
  return crypto.verify(
    "sha256",
    Buffer.from(data),
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 64,
    },
    urlSafeBase64ToBuffer(normalizedSignature)
  );
};

export const signDepayConfiguration = (configuration: Record<string, unknown>): string => {
  const privateKeyString = process.env.DEPAY_SIGNING_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!privateKeyString) {
    throw new Error("DEPAY_SIGNING_PRIVATE_KEY is not configured");
  }

  const privateKey = createPrivateKey(privateKeyString);
  const dataToSign = JSON.stringify(configuration);

  const signature = crypto.sign("sha256", Buffer.from(dataToSign), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 64,
  });

  return signature
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};
