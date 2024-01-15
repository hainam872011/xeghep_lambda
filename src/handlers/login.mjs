import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {DynamoDBDocumentClient, GetCommand, PutCommand} from '@aws-sdk/lib-dynamodb'
const client = new DynamoDBClient({})
const ddbDocClient = DynamoDBDocumentClient.from(client)
const tableName = process.env.SAMPLE_TABLE
const bcrypt = require("bcrypt")
const jwtSecretKey = process.env.JWT_SECRET_KEY
const jwt = require('jsonwebtoken')
export const login = async (event) => {
    if (event.httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${event.httpMethod} method.`)
    }
    console.info('received:', event)

    const body = JSON.parse(event.body);
    const {user_name, password} = body
    if (!user_name || !password) throw new Error('User name or password is required')
    const user = await ddbDocClient.send(new GetCommand({
        TableName: tableName,
        Key: {
            user_name,
        },
    })).catch(e => {console.log(`[Login get user error] : ${JSON.stringify(e)}`)})
    if (!user || !user.Item || !bcrypt.compare(password, user.Item['password']))
        throw new Error('User name or password incorrect')
    const dataJwt = {
        time: Date(),
        user_name,
    }

    const token = jwt.sign(dataJwt, jwtSecretKey, {expiresIn: '4h'})
    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Headers" : "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
            "content-type": "application/json"
        },
        body: JSON.stringify({token, user_name: user.Item.user_name})
    };
    console.info(`response from: ${event.path} statusCode: ${response.statusCode} body: ${response.body}`)
    return response
};
