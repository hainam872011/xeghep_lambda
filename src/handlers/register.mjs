import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {DynamoDBDocumentClient, GetCommand, PutCommand} from '@aws-sdk/lib-dynamodb'
const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)
const tableName = process.env.SAMPLE_TABLE
const bcrypt = require("bcrypt")
import { nanoid } from 'nanoid'
import {verify} from '../utils/common.js'
export const register = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`)
    }
    console.info('received:', event)

    const body = JSON.parse(event.body);
    const header = JSON.parse(event.headers);
    const {user_name, phone, email, full_name, password} = body
    const token = header['Authorization'].startsWith('Bearer') ? header['Authorization'].slice(0, 7) : ''
    if (!user_name || !password) throw new Error('User name or password is required')
    const passwordEncrypt = bcrypt.hashSync(password.trim(), 10)
    const id = nanoid()
    const params = {
        TableName : tableName,
        Item: {id, user_name, phone, email, full_name, password: passwordEncrypt}
    }
    const verified = await verify(token)
    if (!verified.verified) throw new Error('Invalid token')
    const user = await ddbDocClient.send(new GetCommand({
        TableName: tableName,
        Key: {
            user_name,
        },
    })).catch(e => {
        console.log(`[Register get user]: ${JSON.stringify(e)}`)})
    if (user && user.Item) throw new Error(`User ${user_name} already existed`)
    const data = await ddbDocClient.send(new PutCommand(params)).catch(e => {console.log("Register error", JSON.stringify(e))})
    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
            "content-type": "application/json"
        },
        body: JSON.stringify(data)
    };
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`)
    return response
};
