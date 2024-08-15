import { PrivateKeyAccount } from "viem";

export type Address = `0x${string}`;

export type ODLClientOptions = {
  account?: PrivateKeyAccount;
  rpcUrl?: string;
  chainId?: number;
  pinataApiKey?: string;
  pinataSecretApiKey?: string;
  contractAddress?: `0x${string}`;
};
