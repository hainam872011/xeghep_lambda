import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, GetCommand, ScanCommand} from '@aws-sdk/lib-dynamodb';
import {DateTime} from "luxon";

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.SAMPLE_TABLE;
export const getHistoryByAgency = async (event) => {
  if (event.httpMethod !== 'GET') {
    throw new Error(`getMethod only accept GET method, you tried: ${event.httpMethod}`);
  }
  const id = parseInt(event.pathParameters.id);
  const timeQuery = DateTime.now().minus({days: 30}).toFormat('yyyy-MM-dd')
  const params = {
    TableName : tableName,
    ScanIndexForward: false,    // true = ascending, false = descending
    FilterExpression: '(#fromId = :id OR #toId = :id) AND #createdAt >= :createdAt',
    ExpressionAttributeNames: {"#fromId": "fromId", "#toId": "toId", "#createdAt": "createdAt"},
    ExpressionAttributeValues: {
      ':id': id,
      ':createdAt': timeQuery
    },
  };
  let items
  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    items = data.Items;
  } catch (err) {
    console.log("Error", err);
  }
  const response = {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Headers" : "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      "content-type": "application/json"
    },
    body: JSON.stringify(items),
  };
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
  return response;
}
