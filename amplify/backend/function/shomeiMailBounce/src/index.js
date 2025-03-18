/* Amplify Params - DO NOT EDIT
	API_PDFVUEAMPPRJ_BUNSYOTABLE_ARN
	API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME
	API_PDFVUEAMPPRJ_GRAPHQLAPIENDPOINTOUTPUT
	API_PDFVUEAMPPRJ_GRAPHQLAPIIDOUTPUT
	API_PDFVUEAMPPRJ_GRAPHQLAPIKEYOUTPUT
	API_PDFVUEAMPPRJ_SHOMEITABLE_ARN
	API_PDFVUEAMPPRJ_SHOMEITABLE_NAME
	AUTH_PDFVUEAMPPRJ4DDE32EC_USERPOOLID
	ENV
	REGION
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { SES } = require('@aws-sdk/client-ses');
var ses = new SES({ region: 'us-east-1' });
const dynamoDB = DynamoDBDocument.from(new DynamoDB());

exports.handler = async (event) => {
  const eventBody = event.Records[0].body;
  const bodyObj = JSON.parse(eventBody);
  let status;

  if (bodyObj.notificationType == 'Bounce') {
    status = 'sendError';
    await mailBounceProcess(bodyObj.mail.messageId, bodyObj.mail.destination[0], status);
  }
  if (bodyObj.notificationType == 'signError') {
    status = 'signError';
    await signErrorProcess(bodyObj.pdfId, bodyObj.routeNo, status);
  }
  return {
    statusCode: 200,
  };
};
async function mailBounceProcess(messageId, errorMailAd, status) {
  const shomeiId = await shomeiScan(messageId);
  const bunsyoId = await shomeiStatusUpdate(shomeiId, status);
  const resultBun = await updateBunsyo(bunsyoId, status);
  await sendMail(resultBun, status, errorMailAd);
}
async function signErrorProcess(pdfId, routeNo, status) {
  const shomeiId = pdfId + routeNo;
  const bunsyoId = await shomeiStatusUpdate(shomeiId, status);
  const resultBun = await updateBunsyo(bunsyoId, status);
  await sendMail(resultBun, status);
}
async function shomeiScan(messageId) {
  const shomei_params = {
    TableName: process.env.API_PDFVUEAMPPRJ_SHOMEITABLE_NAME,
    FilterExpression: 'messageId = :messageId',
    ExpressionAttributeValues: {
      ':messageId': messageId,
    },
  };
  const shomeiScanRes = await dynamoDB.scan(shomei_params);
  return shomeiScanRes.Items[0].id;
}
async function shomeiStatusUpdate(shomeiId, status) {
  const update_params = {
    TableName: process.env.API_PDFVUEAMPPRJ_SHOMEITABLE_NAME,
    Key: { id: shomeiId },
    UpdateExpression: 'set #a = :x,#b =:y', // 属性は#から始まるバインド変数、値は:から始まるバインド変数
    ExpressionAttributeNames: { '#a': 'shomeiStatus', '#b': 'updatedAt' }, // 属性名はname
    ExpressionAttributeValues: { ':x': status, ':y': new Date().toISOString() },
    ReturnValues: 'ALL_NEW',
  };
  const shomeiUpdateRes = await dynamoDB.update(update_params);
  return shomeiUpdateRes.Attributes.bunsyoShomeiId;
}
async function updateBunsyo(bunsyoId, status) {
  const updateBun_params = {
    TableName: process.env.API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME,
    Key: { id: bunsyoId },
    UpdateExpression: 'set #a = :x,#b=:y', // 属性は#から始まるバインド変数、値は:から始まるバインド変数
    ExpressionAttributeNames: { '#a': 'bunStatus', '#b': 'updatedAt' }, // 属性名はname
    ExpressionAttributeValues: { ':x': status, ':y': new Date().toISOString() },
    ReturnValues: 'ALL_NEW',
  };
  const result_bun = await dynamoDB.update(updateBun_params);
  return result_bun.Attributes;
}
async function sendMail(resultBun, status, errorMailAd = null) {
  const mailAd = resultBun.userEmail;
  const docName = resultBun.docName;
  const createUser = resultBun.userName;
  let messageBody;
  let subjectMessage;
  if (status == 'sendError') {
    messageBody = `${createUser}様の文書「${docName}」にて回送先のメールアドレス${errorMailAd}が届きませんでした。\n\nメールアドレスを確認してください`;
    subjectMessage = `${createUser}様の文書 「${docName}」に関してメールアドレスエラーが出ています`;
  } else {
    messageBody = `${createUser}様の文書「${docName}」は当サービスで署名できませんでした。文書とステータスをご確認ください`;
    subjectMessage = `${createUser}様の文書 「${docName}」に関して署名エラーが出ています`;
  }
  const displayName = '押印クラウドエラー通知';
  const encodedName = encodeToBase64(displayName);

  const sourceHeader = `=?UTF-8?B?${encodedName}?= <${process.env.CONTACTINFO_MAIL}>`;

  const signature = `
--------------------------------------
押印クラウド
https://www.oin-cloud.com
-------------------------------------- `;
  const fullMessageBody = `${messageBody}\n\n${signature}`;
  const mailParams = {
    Destination: { ToAddresses: [mailAd] },
    Message: { Body: { Text: { Data: fullMessageBody } }, Subject: { Data: subjectMessage } },
    Source: sourceHeader,
    ReplyToAddresses: [process.env.CONTACTINFO_MAIL],
  };
  const result = await ses.sendEmail(mailParams);
  return result;
}
function encodeToBase64(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}
