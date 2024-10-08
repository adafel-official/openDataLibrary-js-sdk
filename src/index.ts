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
  TransactionReceipt,
} from "viem";
import { ODLClientOptions } from "./types";
import abiJson from "./abi/ODL.json";
import { DataFrame } from "dataframe-js";
import CID from "cids";
import pinataSDK from "@pinata/sdk";
import { v4 as uuidv4 } from "uuid";
import { parse } from "csv-parse/sync";

export enum Category {
  Gaming = 0,
  Marketplace,
  Defi,
  Dao,
  Web3Social,
  Identity,
  Certificates,
}

/**
 * Class representing the Open Data Library.
 */
export class OpenDataLibrary {
  public walletClient: WalletClient;
  public publicClient!: PublicClient;
  public odlContract: any;
  private privateKeyAccount?: PrivateKeyAccount;
  public chain: any;
  public account!: { address: `0x${string}` };
  private pinataApiKey: string;
  private pinataSecretApiKey: string;

  /**
   * Creates an instance of OpenDataLibrary.
   * @param {ODLClientOptions} options - Options to initialize the library.
   */
  constructor({
    rpcUrl: rpc,
    account: privateKeyAccount,
    chainId: chainId,
    pinataApiKey: pinataApiKey,
    pinataSecretApiKey: pinataSecretApiKey,
    contractAddress: contractAddress,
  }: ODLClientOptions) {
    const chain = {
      id: chainId ?? 3995596960668836,
      name: "Adafel Testnet Network",
      nativeCurrency: {
        name: "Adafel Token",
        symbol: "ADFL",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: [rpc ?? "https://testnet-rpc.adafel.com"],
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
      address: contractAddress ?? "0x91f78FBEB6c5C29981aFBAB1B20037213E1Ecbc7",
      client: { wallet: this.walletClient, public: this.publicClient },
    });
    this.pinataApiKey = pinataApiKey ?? "";
    this.pinataSecretApiKey = pinataSecretApiKey ?? "";
  }

  /**
   * Reads data from a CSV file and formats it.
   * @param {string} csvBuffer - Buffer of the CSV file.
   * @param {string[]} inputColumns - Columns to be used as input.
   * @param {string} labelColumn - Column to be used as label.
   * @returns {Promise<[bigint[][], bigint[]]>} Formatted input data and labels.
   */
  public async getDataFromCSV(
    csvBuffer: any,
    inputColumns: string[],
    labelColumn: string
  ): Promise<[bigint[][], bigint[]] | Error> {
    try {
      let parsedOutput = parse(csvBuffer, {
        bom: true,
        cast: true,
        columns: true,
      });
      let data = new DataFrame(parsedOutput);
      let input = data.select(...inputColumns);
      let labels = data.select(labelColumn);
      let input_data = input.toArray();
      input_data = input_data.map((row) =>
        row.map((col: number) => BigInt(Math.round(col * 10000)))
      );
      let labels_array = labels.toArray();
      let labels_formatted: bigint[] = [];
      labels_array.map((row) =>
        row.map((col: number) =>
          labels_formatted.push(BigInt(Math.round(col * 10000)))
        )
      );

      return [input_data, labels_formatted];
    } catch (e) {
      throw new Error(String(e));
    }
  }

  public async uploadCidDataToIPFS(csvBuffer: any): Promise<string | Error> {
    try {
      let parsedOutput = parse(csvBuffer, {
        bom: true,
        cast: true,
        columns: true,
      });
      let data = new DataFrame(parsedOutput);
      let input_array = data.toArray();
      input_array = input_array.map((row) =>
        row.map((col: number) => Math.round(col * 10000))
      );

      const options = {
        pinataMetadata: {
          name: uuidv4(),
        },
      };

      const pinata = new pinataSDK(this.pinataApiKey, this.pinataSecretApiKey);
      const res = await pinata.pinJSONToIPFS(input_array, options);
      return res.IpfsHash;
    } catch (e) {
      throw new Error(String(e));
    }
  }

  /**
   * Retrieves the account information.
   * @returns {Promise<PrivateKeyAccount>} The account information.
   */
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

  /**
   * Switches the chain to the one specified in the configuration.
   */
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

  /**
   * Adds data to the blockchain.
   * @param {string} schemaName - The name of the schema.
   * @param {string[]} columns - The columns of the schema.
   * @param {Category} category - The category of the data.
   * @param {bigint[][]} data - The data to be added.
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
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

  /**
   * Trains a linear regression model with off-chain data.
   * @param {bigint[][]} data - The training data.
   * @param {bigint[]} label - The training labels.
   * @param {string} modelName - The name of the model.
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
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

  /**
   * train Linear Regression from Cid
   * @param cidInput - cid
   * @param train_indices - column indices to be included in training set
   * @param label_index - label index
   * @param modelName - modelname
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
  async trainLinearRegressionFromCid(
    cidInput: string,
    train_indices: Array<bigint>,
    label_index: bigint,
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainLinearRegressionCidData(
        [cidInput, train_indices, label_index, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  /**
   * Makes a prediction using a linear regression model stored on-chain.
   * @param {string} modelName - The name of the model.
   * @param {bigint[][]} data - The data for prediction.
   * @returns {Promise<ReadContractReturnType | Error>} The result of the contract read operation.
   */
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

  /**
   * Trains a logistic regression model with off-chain data.
   * @param {bigint[][]} data - The training data.
   * @param {bigint[]} label - The training labels.
   * @param {string} modelName - The name of the model.
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
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

  /**
   * train Logistic Regression from Cid
   * @param cidInput - cid
   * @param train_indices - column indices to be included in training set
   * @param label_index - label index
   * @param modelName - modelname
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
  async trainLogisticRegressionFromCid(
    cidInput: string,
    train_indices: Array<bigint>,
    label_index: bigint,
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainLogisticRegressionCidData(
        [cidInput, train_indices, label_index, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  /**
   * Makes a prediction using a logistic regression model stored on-chain.
   * @param {string} modelName - The name of the model.
   * @param {bigint[][]} data - The data for prediction.
   * @returns {Promise<ReadContractReturnType | Error>} The result of the contract read operation.
   */
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

  /**
   * Trains a KNN regression model with off-chain data.
   * @param {bigint[][]} data - The training data.
   * @param {bigint[]} label - The training labels.
   * @param {string} modelName - The name of the model.
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
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

  /**
   * train KNN Regression from Cid
   * @param cidInput - cid
   * @param train_indices - column indices to be included in training set
   * @param label_index - label index
   * @param modelName - modelname
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
  async trainKNNRegressionFromCid(
    cidInput: string,
    train_indices: Array<bigint>,
    label_index: bigint,
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainKNNRegressionCidData(
        [cidInput, train_indices, label_index, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  /**
   * Makes a prediction using a KNN regression model stored on-chain.
   * @param {string} modelName - The name of the model.
   * @param {bigint[][]} data - The data for prediction.
   * @returns {Promise<ReadContractReturnType | Error>} The result of the contract read operation.
   */
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

  /**
   * Trains a KNN classification model with off-chain data.
   * @param {bigint[][]} data - The training data.
   * @param {bigint[]} label - The training labels.
   * @param {string} modelName - The name of the model.
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
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

  /**
   * train KNN Classification from Cid
   * @param cidInput - cid
   * @param train_indices - column indices to be included in training set
   * @param label_index - label index
   * @param modelName - modelname
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
  async trainKNNClassificationFromCid(
    cidInput: string,
    train_indices: Array<bigint>,
    label_index: bigint,
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainKNNClassificationCidData(
        [cidInput, train_indices, label_index, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  /**
   * Makes a prediction using a KNN classification model stored on-chain.
   * @param {string} modelName - The name of the model.
   * @param {bigint[][]} data - The data for prediction.
   * @returns {Promise<ReadContractReturnType | Error>} The result of the contract read operation.
   */
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

  /**
   * Trains a decision tree regression model with off-chain data.
   * @param {bigint[][]} data - The training data.
   * @param {bigint[]} label - The training labels.
   * @param {string} modelName - The name of the model.
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
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

  /**
   * train Decision Tree Regression from Cid
   * @param cidInput - cid
   * @param train_indices - column indices to be included in training set
   * @param label_index - label index
   * @param modelName - modelname
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
  async trainDecisionTreeRegressionFromCid(
    cidInput: string,
    train_indices: Array<bigint>,
    label_index: bigint,
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainDecisionTreeRegressionCidData(
        [cidInput, train_indices, label_index, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  /**
   * Makes a prediction using a decision tree regression model stored on-chain.
   * @param {string} modelName - The name of the model.
   * @param {bigint[][]} data - The data for prediction.
   * @returns {Promise<ReadContractReturnType | Error>} The result of the contract read operation.
   */
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

  /**
   * Trains a decisin tree classification model with off-chain data.
   * @param {bigint[][]} data - The training data.
   * @param {bigint[]} label - The training labels.
   * @param {string} modelName - The name of the model.
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
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

  /**
   * train Decision Tree Classification from Cid
   * @param cidInput - cid
   * @param train_indices - column indices to be included in training set
   * @param label_index - label index
   * @param modelName - modelname
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
  async trainDecisionTreeClassificationFromCid(
    cidInput: string,
    train_indices: Array<bigint>,
    label_index: bigint,
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainDecisionTreeClassificationCidData(
        [cidInput, train_indices, label_index, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  /**
   * Makes a prediction using a decision tree classification model stored on-chain.
   * @param {string} modelName - The name of the model.
   * @param {bigint[][]} data - The data for prediction.
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract read operation.
   */
  async predictDecisionTreeClassificationOnchainModel(
    modelName: string,
    data: bigint[][]
  ): Promise<ReadContractReturnType | Error> {
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

  /**
   * Trains a random forest regression model with off-chain data.
   * @param {bigint[][]} data - The training data.
   * @param {bigint[]} label - The training labels.
   * @param {string} modelName - The name of the model.
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
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

  /**
   * train Random Forest Regression from Cid
   * @param cidInput - cid
   * @param train_indices - column indices to be included in training set
   * @param label_index - label index
   * @param modelName - modelname
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
  async trainRandomForestRegressionFromCid(
    cidInput: string,
    train_indices: Array<bigint>,
    label_index: bigint,
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainRandomForestRegressionCidData(
        [cidInput, train_indices, label_index, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  /**
   * Makes a prediction using a random forest regression model stored on-chain.
   * @param {string} modelName - The name of the model.
   * @param {bigint[][]} data - The data for prediction.
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract read operation.
   */
  async predictRandomForestRegressionOnchainModel(
    modelName: string,
    data: bigint[][]
  ): Promise<ReadContractReturnType | Error> {
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

  /**
   * Trains a random forest classification model with off-chain data.
   * @param {bigint[][]} data - The training data.
   * @param {bigint[]} label - The training labels.
   * @param {string} modelName - The name of the model.
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
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

  /**
   * train Random Forest Classification from Cid
   * @param cidInput - cid
   * @param train_indices - column indices to be included in training set
   * @param label_index - label index
   * @param modelName - modelname
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract write operation.
   */
  async trainRandomForestClassificationFromCid(
    cidInput: string,
    train_indices: Array<bigint>,
    label_index: bigint,
    modelName: string
  ): Promise<WriteContractReturnType | Error> {
    try {
      const account = await this.getAccount();
      await this.swithChain();

      return this.odlContract.write.trainRandomForestClassificationCidData(
        [cidInput, train_indices, label_index, modelName],
        {
          account: account,
        }
      );
    } catch (e) {
      throw new Error(String(e));
    }
  }

  /**
   * Makes a prediction using a random forest classification model stored on-chain.
   * @param {string} modelName - The name of the model.
   * @param {bigint[][]} data - The data for prediction.
   * @returns {Promise<WriteContractReturnType | Error>} The result of the contract read operation.
   */
  async predictRandomForestClassificationOnchainModel(
    modelName: string,
    data: bigint[][]
  ): Promise<ReadContractReturnType | Error> {
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

  /**
   * Returns transaction receipt after waiting for 3 confirmations
   * @param hash transaction hash
   * @returns {Promise<TransactionReceipt | Error>} The transaction receipt
   */
  async waitForTransaction(
    hash: `0x${string}`
  ): Promise<TransactionReceipt | Error> {
    try {
      const transaction = await this.publicClient.waitForTransactionReceipt({
        confirmations: 3,
        hash: hash,
      });

      return transaction;
    } catch (e) {
      throw new Error(String(e));
    }
  }

  getCidBytes(cidInput: string) {
    // Create a CID object
    const cid: any = new CID(cidInput);

    // Extract the bytes
    const bytes = cid.bytes;

    const result = Array.from(bytes, (byte: any) =>
      byte.toString(16).padStart(2, "0")
    ).join("");

    return result;
  }

  /**
   * Function to extract Cid data into matrix
   * @param cidInput - content CID
   * @param train_indices - array of training column indices
   * @param label_index - label index
   * @returns
   */
  async extractCidData(
    cidInput: string,
    train_indices: Array<bigint>,
    label_index: bigint
  ): Promise<ReadContractReturnType | Error> {
    try {
      // Create a CID object
      const cid: any = new CID(cidInput);

      // Extract the bytes
      const bytes = cid.bytes;

      const input = Array.from(bytes, (byte: any) =>
        byte.toString(16).padStart(2, "0")
      ).join("");
      return this.odlContract.read.extractCidData([
        input,
        train_indices,
        label_index,
      ]);
    } catch (e) {
      throw new Error(String(e));
    }
  }
}
