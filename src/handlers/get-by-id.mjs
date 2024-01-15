import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, GetCommand, ScanCommand} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.SAMPLE_TABLE;
export const getByIdHandler = async (event) => {
  if (event.httpMethod !== 'GET') {
    throw new Error(`getMethod only accept GET method, you tried: ${event.httpMethod}`);
  }
  const id = parseInt(event.pathParameters.id);
  const params = {
    TableName : tableName,
    FilterExpression: '#id = :id',
    ExpressionAttributeNames: {"#id": "id"},
    ExpressionAttributeValues: {
      ':id': id
    },
  };
  let item = {}
  try {
    const data = await ddbDocClient.send(new ScanCommand(params));
    item = data.Items && data.Items.length ? data.Items[0] : {};
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
    body: JSON.stringify(item),
  };
  console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`);
  return response;
}
