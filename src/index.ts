import {
  WalletClient,
  PublicClient,
  PrivateKeyAccount,
  http,
  createWalletClient,
  createPublicClient,
  custom,
  getContract,
  toBytes,
  toHex,
  WriteContractReturnType,
  Address,
  ReadContractReturnType,
} from "viem";
import { ODLClientOptions } from "./types";
import abiJson from "./abi/ODL.json";

export enum Category {
  Gaming = 0,
  Marketplace,
  Defi,
  Dao,
  Web3Social,
  Identity,
  Certificates,
}

export class OpenDataLibrary {
  public walletClient: WalletClient;
  public publicClient!: PublicClient;
  public odlContract: any;
  public privateKeyAccount?: PrivateKeyAccount;
  public chain: any;
  public account!: { address: `0x${string}` };

  constructor({ rpcUrl: rpc, account: privateKeyAccount }: ODLClientOptions) {
    const chain = {
      id: 1849857664505656,
      name: "Adafel Testnet Network",
      nativeCurrency: {
        name: "Adafel Token",
        symbol: "ADFL",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ["https://testnet-rpc.adafel.com"],
        },
      },
    };
    this.chain = chain;
    // @ts-ignore
    this.publicClient = createPublicClient({
      chain,
      transport: http(),
    });
    this.walletClient = createWalletClient({
      chain,
      transport: privateKeyAccount
        ? http()
        : window?.ethereum
        ? custom(window?.ethereum)
        : http(),
    });
    this.privateKeyAccount = privateKeyAccount;
    this.odlContract = getContract({
      abi: abiJson.abi,
      address: "0xE53Ad25f546F36DB8E39b4440d449EB875C2bdAA",
      client: { wallet: this.walletClient, public: this.publicClient },
    });
  }

  public async getAccount() {
    let account;
    if (this.privateKeyAccount) {
      account = this.privateKeyAccount;
    } else {
      const accounts = await this.walletClient.getAddresses();
      account = { address: accounts[0] } as PrivateKeyAccount;
    }
    return account;
  }

  public async swithChain() {
    const walletChainId = await this.walletClient.getChainId();
    if (walletChainId !== this.chain.id) {
      try {
        await this.walletClient.switchChain({
          id: this.chain.id,
        });
      } catch (error: any) {
        if (error?.code !== 4001) {
          await this.walletClient.addChain({
            chain: this.chain,
          });
          await this.walletClient.switchChain({
            id: this.chain.id,
          });
        }
      }
    }
  }

  async addData(
    schemaName: string,
    columns: string[],
    category: Category,
    data: bigint[][]
  ): Promise<WriteContractReturnType | Error> {
    try {
      const columnSerialized = columns.map((c) => {
        return toHex(
          toBytes(String(c), {
            size: 32,
          })
        );
      });

      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.addOnChainData(
        [schemaName, columnSerialized, category, data],
        {
          account: account.address,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async trainLinearRegressionOffChainData(
    data: bigint[][],
    label: bigint[],
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainLinearRegressionOffChainData(
        [data, label, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async predictLinearRegressionOnchainModel(
    modelName: string,
    data: bigint[][]
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.read.predictLinearRegressionOnchainModel([
        modelName,
        data,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async trainLogisticRegressionOffChainData(
    data: bigint[][],
    label: bigint[],
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainLogisticRegressionOffChainData(
        [data, label, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async predictLogisticRegressionOnchainModel(
    modelName: string,
    data: bigint[][]
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.read.predictLogisticRegressionOnchainModel([
        modelName,
        data,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async trainKNNRegressionOffChainData(
    data: bigint[][],
    label: bigint[],
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainKNNRegressionOffChainData(
        [data, label, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async predictKNNRegressionOnchainModel(
    modelName: string,
    data: bigint[][]
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.read.predictKNNRegressionOnchainModel([
        modelName,
        data,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async trainKNNClassificationOffChainData(
    data: bigint[][],
    label: bigint[],
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainKNNClassificationOffChainData(
        [data, label, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async predictKNNClassificationOnchainModel(
    modelName: string,
    data: bigint[][]
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.read.predictKNNClassificationOnchainModel([
        modelName,
        data,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async trainDecisionTreeRegressionOffChainData(
    data: bigint[][],
    label: bigint[],
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainDecisionTreeRegressionOffChainData(
        [data, label, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async predictDecisionTreeRegressionOnchainModel(
    modelName: string,
    data: bigint[][]
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.read.predictDecisionTreeRegressionOnchainModel([
        modelName,
        data,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async trainDecisionTreeClassificationOffChainData(
    data: bigint[][],
    label: bigint[],
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainDecisionTreeClassificationOffChainData(
        [data, label, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async predictDecisionTreeClassificationOnchainModel(
    modelName: string,
    data: bigint[][]
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.read.predictDecisionTreeClassificationOnchainModel(
        [modelName, data]
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async trainRandomForestRegressionOffChainData(
    data: bigint[][],
    label: bigint[],
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainRandomForestRegressionOffChainData(
        [data, label, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async predictRandomForestRegressionOnchainModel(
    modelName: string,
    data: bigint[][]
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.read.predictRandomForestRegressionOnchainModel([
        modelName,
        data,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async trainRandomForestClassificationOffChainData(
    data: bigint[][],
    label: bigint[],
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainRandomForestClassificationOffChainData(
        [data, label, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  async predictRandomForestClassificationOnchainModel(
    modelName: string,
    data: bigint[][]
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.read.predictRandomForestClassificationOnchainModel(
        [modelName, data]
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }
}
