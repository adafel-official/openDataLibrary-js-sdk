# Open Data Library (ODL) sdk

Typescript SDK for interacting with Open Data Library protocol.

Features

- Add new users: `addNewUser`
- Create new schema: `createSchema`
- Add new data points: `addAnalytics`
- Update existing data points: `updateAnalytics`
- Get aggregate user activity data across multiple schema: `getAggregateActivityData`
- Get list of all schemas: `getSchemaList`
- Get all data points of particular schema: `getSchemaData`

## Installation

```
npm i @adafel/opendatalibrary-js-sdk
```

## Quickstart

1. Initialize the client instance

```
import { privateKeyToAccount } from 'viem/accounts';
import { OpenDataLibrary, Category } from "@adafel/opendatalibrary-js-sdk";
const privateKey = '0xabc'; // optional

const client = new OpenDataLibrary({
  account: privateKeyToAccount(privateKey), // optional
});
```

Note: if the private key is not supplied then sdk will use provider from `window.ethereum`.

2. Reading Data from CSV
   You can read data from a CSV file and format it for use with the library:

```javascript
const csvPath = "./data.csv";
const inputColumns = ["column1", "column2"];
const labelColumn = "label";

const [inputData, labels] = await odl.getDataFromCSV(
  csvPath,
  inputColumns,
  labelColumn
);
```

3. Adding Data to the Blockchain
   To add data to the blockchain, use the `addData` method:

```javascript
const schemaName = "MySchema";
const columns = ["column1", "column2"];
const category = Category.Gaming;
const data = inputData;

await odl.addData(schemaName, columns, category, data);
```

4. Training a Model
   You can train different models using the provided methods. For example, to train a linear regression model:

```javascript
const modelName = "MyLinearRegressionModel";

await odl.trainLinearRegressionOffChainData(inputData, labels, modelName);
```

5. Making Predictions
   To make predictions using a trained model:

```javascript
const predictions = await odl.predictLinearRegressionOnchainModel(
  modelName,
  inputData
);
```
