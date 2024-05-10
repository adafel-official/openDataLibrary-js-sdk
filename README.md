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

2. Create a new schema

```
await client.createSchema(
  "demo schema",
  ["col1", "col2", "col3"],
  Category.Gaming
);
```

Return: transaction hash (type `0x${string}`).

3. Add user analytics

```
await client.addAnalytics(
  "0x264f9...",
  "demo schema",
  ["columnName1", "columnName2", "columnName3"],
  [1n, 2n, 3n] // adding sample data
);
```

Return: transaction hash (type `0x${string}`).

4. Get all the analytics under the particular schema.

```
await client.getSchemaData(
  "demo schema",
)
```

Return: `bigint[][]`
