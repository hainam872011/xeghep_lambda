import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import {DateTime} from "luxon";
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.SAMPLE_TABLE;
export const getAllHistory = async (event) => {
    if (event.httpMethod !== 'GET') {
        throw new Error(`getAllItems only accept GET method, you tried: ${event.httpMethod}`);
    }
    const timeQuery = DateTime.now().minus({days: 30}).toFormat('yyyy-MM-dd')
    const params = {
        TableName : tableName,
        ScanIndexForward: false,    // true = ascending, false = descending
        FilterExpression: '#createdAt >= :createdAt',
        ExpressionAttributeNames: {"#createdAt": "createdAt"},
        ExpressionAttributeValues: {
            ':createdAt': timeQuery
        },
    };
    let items, count
    try {
        const data = await ddbDocClient.send(new ScanCommand(params));
        items = data.Items;
        count = data.Count;
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
