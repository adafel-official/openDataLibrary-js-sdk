import {
  WalletClient,
  PublicClient,
  PrivateKeyAccount,
  http,
  createWalletClient,
  custom,
  getContract,
  toBytes,
  toHex,
  WriteContractReturnType,
  Address,
  ReadContractReturnType,
} from "viem";
import { ODLClientOptions } from "./types";
import abiJson from "./abi/UserAnalytics.json";

enum Category {
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
  public userAnalyticsContract: any;
  public privateKeyAccount?: PrivateKeyAccount;
  public chain: any;
  public account!: { address: `0x${string}` };

  constructor({ rpcUrl: rpc, account: privateKeyAccount }: ODLClientOptions) {
    const chain = {
      id: 22068238331863,
      name: "odlSubnet",
      nativeCurrency: {
        name: "Open Data Library Token",
        symbol: "ODL",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [rpc ? rpc : "https://testnet-rpc.adafel.com"],
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
        : window.ethereum
        ? custom(window.ethereum)
        : http(),
    });
    this.privateKeyAccount = privateKeyAccount;
    this.userAnalyticsContract = getContract({
      abi: abiJson.abi,
      address: "0xbe7D63fDeE3c849faDCea8710317DE854d723C0d",
      client: { wallet: this.walletClient, public: this.publicClient },
    });
  }

  addNewUser(userAddress: Address): Promise<WriteContractReturnType> {
    return this.userAnalyticsContract.write.addUser([userAddress]);
  }

  createSchema(
    schemaName: string,
    columns: string[],
    category: Category
  ): Promise<WriteContractReturnType | Error> {
    try {
      const columnSerialized = columns.map((c) => {
        return toHex(
          toBytes(String(c), {
            size: 32,
          })
        );
      });

      const schemaNameSerialized = toHex(
        toBytes(schemaName, {
          size: 32,
        })
      );

      return this.userAnalyticsContract.write.addSchema([
        schemaNameSerialized,
        columnSerialized,
        category,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }

  addAnalytics(
    userAddress: Address,
    schemaName: string,
    columns: string[],
    data: bigint[]
  ): Promise<WriteContractReturnType | Error> {
    try {
      const columnSerialized = columns.map((c) => {
        return toHex(
          toBytes(String(c), {
            size: 32,
          })
        );
      });

      const schemaNameSerialized = toHex(
        toBytes(schemaName, {
          size: 32,
        })
      );

      return this.userAnalyticsContract.write.addAnalytics([
        userAddress,
        schemaNameSerialized,
        columnSerialized,
        data,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }

  updateAnalytics(
    userAddress: Address,
    schemaName: string,
    columns: string[],
    data: bigint[]
  ): Promise<WriteContractReturnType | Error> {
    try {
      const columnSerialized = columns.map((c) => {
        return toHex(
          toBytes(String(c), {
            size: 32,
          })
        );
      });

      const schemaNameSerialized = toHex(
        toBytes(schemaName, {
          size: 32,
        })
      );

      return this.userAnalyticsContract.write.updateAnalytics([
        userAddress,
        schemaNameSerialized,
        columnSerialized,
        data,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }

  getAggregateActivityData(): Promise<ReadContractReturnType> {
    return this.userAnalyticsContract.read.getUserActivityMatrix();
  }

  getSchemaList(): Promise<ReadContractReturnType> {
    return this.userAnalyticsContract.read.getAllSchemas();
  }

  getSchemaData(schemaName: string): Promise<ReadContractReturnType | Error> {
    try {
      const schemaNameSerialized = toHex(
        toBytes(schemaName, {
          size: 32,
        })
      );

      return this.userAnalyticsContract.read.getAnalyticsDataBySchemaName([
        schemaNameSerialized,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }

  getSchemaColumns(
    schemaName: string
  ): Promise<ReadContractReturnType | Error> {
    try {
      const schemaNameSerialized = toHex(
        toBytes(schemaName, {
          size: 32,
        })
      );

      return this.userAnalyticsContract.read.getColumnsOfSchema([
        schemaNameSerialized,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }

  getSchemaUserId(
    schemaName: string,
    userAddress: Address
  ): Promise<ReadContractReturnType | Error> {
    try {
      const schemaNameSerialized = toHex(
        toBytes(schemaName, {
          size: 32,
        })
      );

      return this.userAnalyticsContract.read.getSchemaAddressToId([
        schemaNameSerialized,
        userAddress,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }

  getSchemaUserAddress(
    schemaName: string,
    userId: bigint
  ): Promise<ReadContractReturnType | Error> {
    try {
      const schemaNameSerialized = toHex(
        toBytes(schemaName, {
          size: 32,
        })
      );

      return this.userAnalyticsContract.read.getSchemaIdToAddress([
        schemaNameSerialized,
        userId,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }

  getUserId(userAddress: Address): Promise<ReadContractReturnType> {
    return this.userAnalyticsContract.read.addressToId([userAddress]);
  }

  getUserAddress(userId: bigint): Promise<ReadContractReturnType> {
    return this.userAnalyticsContract.read.idToAddress([userId]);
  }

  getCredits(address: Address): Promise<ReadContractReturnType> {
    return this.userAnalyticsContract.read.consumerCredits([address]);
  }

  getCategoriesEnums() {
    return {
      Gaming: 0,
      Marketplace: 1,
      Defi: 2,
      Dao: 3,
      Web3Social: 4,
      Identity: 5,
      Certificates: 6,
    };
  }

  getCategoriesList() {
    return [
      "Gaming",
      "Marketplace",
      "Defi",
      "Dao",
      "Web3Social",
      "Identity",
      "Certificates",
    ];
  }
}
