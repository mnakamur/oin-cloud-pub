/* Amplify Params - DO NOT EDIT
	API_PDFVUEAMPPRJ_BUNSYOTABLE_ARN
	API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME
	API_PDFVUEAMPPRJ_GRAPHQLAPIENDPOINTOUTPUT
	API_PDFVUEAMPPRJ_GRAPHQLAPIIDOUTPUT
	API_PDFVUEAMPPRJ_GRAPHQLAPIKEYOUTPUT
	API_PDFVUEAMPPRJ_SHOMEITABLE_ARN
	API_PDFVUEAMPPRJ_SHOMEITABLE_NAME
	ENV
	FUNCTION_SHOMEIDOCTSTAMP_NAME
	REGION
	STORAGE_AMPLIFYVUEPDF_BUCKETNAME
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { Lambda } = require('@aws-sdk/client-lambda');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, S3 } = require('@aws-sdk/client-s3');
const { SES } = require('@aws-sdk/client-ses');
const { createHash } = require('crypto');
var ses = new SES({ region: 'us-east-1' });
const lambda = new Lambda();
const dynamoDB = DynamoDBDocument.from(new DynamoDB());
const s3 = new S3({
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.IAM_ACCESS_KEY_ID,
    secretAccessKey: process.env.IAM_SECRET_ACCESS_KEY,
  },
});

const bucket = process.env.STORAGE_AMPLIFYVUEPDF_BUCKETNAME;
//const linkUrl = 'http://localhost:5173';
const linkUrl = process.env.SITE_URL;
const resHeader = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return preflightResponse();
  }
  try {
    const requestBody = event.body ? event.body : event;
    //const requestBody = parseRequestBody(event);
    console.log('requestBody=', requestBody);
    //const requestBody = event.body;
    const response = await processShomeiRequest(requestBody);
    return successResponse(response);
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(error);
  }
};

const preflightResponse = () => ({
  statusCode: 200,
  headers: resHeader,
  body: JSON.stringify('Hello from Lambda!'),
});
//const parseRequestBody = (event) => (event.httpMethod === 'POST' ? JSON.parse(event.body) : event);
const parseRequestBody = (event) => (event.body ? event.body : event);
const successResponse = (data) => ({
  statusCode: 200,
  headers: resHeader,
  body: JSON.stringify(data),
});

const errorResponse = (error) => ({
  statusCode: 500,
  headers: resHeader,
  body: JSON.stringify({ error: error.message }),
});
async function processShomeiRequest(request) {
  const shomeiResult = await getShomei(request);
  const bunsyoResult = await getBunsyo(request);

  if (isLastRoute(request, bunsyoResult)) {
    await shomeiDocTstamp(request.pdfId, bunsyoResult.Items[0].createUser);
    return { message: '最終署名が完了しました' };
  }

  if (shomeiResult.Items.length > 0) {
    const shomeiUrl = await getUrl(bunsyoResult.Items[0]);
    await updateBunsyo(request, shomeiUrl);
    const mailResult = await sendMail(shomeiResult.Items[0], request, bunsyoResult);
    if (mailResult.MessageId) {
      const update_result = await updateShomei(request, mailResult.MessageId);
      if (update_result.Attributes.shomeiStatus == 'save')
        return { message: 'メール送信処理が完了しました' };
    } else {
      throw new Error('DB不整合が発生しています');
    }
  }
}
const isLastRoute = (request, bunsyoResult) =>
  bunsyoResult.Items[0].shomeiLength === request.routeNo;

async function getShomei(request) {
  let itemid_r = request.pdfId + request.routeNo;
  const params = {
    TableName: process.env.API_PDFVUEAMPPRJ_SHOMEITABLE_NAME,
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
      ':id': itemid_r,
    },
  };
  const result = await dynamoDB.query(params);
  return result;
}
async function updateShomei(request, messageId) {
  let itemid_r = request.pdfId + request.routeNo;
  const update_params = {
    TableName: process.env.API_PDFVUEAMPPRJ_SHOMEITABLE_NAME,
    Key: { id: itemid_r },
    UpdateExpression: 'set #a = :x, #b = :y,#c = :z', // 属性は#から始まるバインド変数、値は:から始まるバインド変数
    ExpressionAttributeNames: { '#a': 'shomeiStatus', '#b': 'messageId', '#c': 'updatedAt' }, // 属性名はname
    ExpressionAttributeValues: { ':x': 'send', ':y': messageId, ':z': new Date().toISOString() },
    ReturnValues: 'UPDATED_OLD',
  };
  const result = await dynamoDB.update(update_params);
  return result;
}
async function getBunsyo(request) {
  const bun_params = {
    TableName: process.env.API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME,
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
      ':id': request.pdfId,
    },
  };
  const result_bun = await dynamoDB.query(bun_params);
  return result_bun;
}
async function getUrl(bunresult) {
  let expires = 604800;
  const pathName = 'protected/' + bunresult.identityId + '/' + bunresult.createUser;
  const fileName = pathName + '/' + bunresult.id;
  const params_geturl = {
    Bucket: bucket,
    Key: fileName,
  };
  try {
    const signedUrl = await getSignedUrl(s3, new GetObjectCommand(params_geturl), {
      expiresIn: expires /* add value from \'Expires\' from v2 call if present, else remove */,
    });

    const expiresAt = Date.now() + expires * 1000;
    return { url: signedUrl, expiresAt: expiresAt };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
async function updateBunsyo(request, shomeiUrl) {
  const isoDate = new Date(shomeiUrl.expiresAt).toISOString();
  const update_params_bun = {
    TableName: process.env.API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME,
    Key: { id: request.pdfId },
    UpdateExpression: 'set #a = :x,#b = :y,#c = :z', // 属性は#から始まるバインド変数、値は:から始まるバインド変数
    ExpressionAttributeNames: {
      '#a': 'docRef',
      '#b': 'docRefExp',
      '#c': 'updatedAt',
    }, // 属性名はname
    ExpressionAttributeValues: {
      ':x': shomeiUrl.url,
      ':y': isoDate,
      ':z': new Date().toISOString(),
    },
    ReturnValues: 'ALL_NEW',
  };
  const update_result_bun = await dynamoDB.update(update_params_bun);
  return update_result_bun;
}

async function sendMail(shomeiItem, request, bunsyoResult) {
  const mailAd = shomeiItem.mail;
  const docName = bunsyoResult.Items[0].docName;
  const createUser = bunsyoResult.Items[0].userName;
  let cuserReq = { pdfId: request.pdfId, routeNo: '0' };
  const root0Result = await getShomei(cuserReq);

  const hash = createHash('sha1');
  hash.update(request.pdfId + request.routeNo);
  const idDigest = hash.copy().digest('hex');

  const createUserMail = root0Result.Items[0].mail;

  const link = `${linkUrl}/signdo/${request.pdfId},${request.routeNo},${idDigest}`;

  const messageBody = `${createUser}様からの文書「${docName}」に関する署名メールが届いています。\n\nリンク: ${link}`;
  const displayName = '押印クラウド';
  const encodedName = encodeToBase64(displayName);

  const sourceHeader = `=?UTF-8?B?${encodedName}?= <${process.env.CONTACTINFO_MAIL}>`;

  const mailParams = {
    Destination: { ToAddresses: [mailAd] },
    Message: {
      Body: { Text: { Data: messageBody } },
      Subject: { Data: `${createUser}様の文書 「${docName}」に関する署名メールが届いています。` },
    },
    Source: sourceHeader,
    ReplyToAddresses: [process.env.CONTACTINFO_MAIL, createUserMail],
  };

  const result = await ses.sendEmail(mailParams);
  console.log('メール送信結果:', result, mailParams);
  return result;
}
function encodeToBase64(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

async function shomeiDocTstamp(itemId, userID) {
  const params = {
    FunctionName: process.env.FUNCTION_SHOMEIDOCTSTAMP_NAME,
    InvocationType: 'Event', // 非同期呼び出しもしくはEvent
    Payload: JSON.stringify({ pdfId: itemId, createUserId: userID }), // 送信するデータ (オプション)
  };
  try {
    await lambda.invoke(params);
    return 'success';
  } catch (error) {
    console.error('Error Invoking Lambda:', error);
    return error;
  }
}
