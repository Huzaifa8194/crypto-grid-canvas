import crypto, { createPrivateKey } from "node:crypto";
import { verify } from "@depay/js-verify-signature";

const depayPublicKey = process.env.DEPAY_PUBLIC_KEY?.replace(/\\n/g, "\n");

export const verifyDepaySignature = async (
  signature: string | string[] | undefined,
  data: string
): Promise<boolean> => {
  if (!signature || !depayPublicKey) {
    return false;
  }

  const normalizedSignature = Array.isArray(signature) ? signature[0] : signature;

  return verify({
    signature: normalizedSignature,
    data,
    publicKey: depayPublicKey,
  });
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
