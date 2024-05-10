import { PrivateKeyAccount } from "viem";

export type Address = `0x${string}`;

export type ODLClientOptions = {
  account?: PrivateKeyAccount;
  rpcUrl?: string;
};
