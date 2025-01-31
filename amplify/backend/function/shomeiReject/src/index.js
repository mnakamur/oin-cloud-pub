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
	FUNCTION_S3TRIGGER50282EAE_NAME
	FUNCTION_SHOMEICOMPLETE_NAME
	FUNCTION_SHOMEIFLOW_NAME
	REGION
	STORAGE_AMPLIFYVUEPDF_BUCKETNAME
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand, S3 } = require('@aws-sdk/client-s3');
const { SES } = require('@aws-sdk/client-ses');
var ses = new SES({ region: 'us-east-1' });
const dynamoDB = DynamoDBDocument.from(new DynamoDB());
const s3 = new S3({ region: 'ap-northeast-1' });

const bucket = process.env.STORAGE_AMPLIFYVUEPDF_BUCKETNAME;
const resHeader = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};
//const linkUrl = 'http://localhost:5173';
const linkUrl = process.env.SITE_URL;
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return preflightResponse();
  }
  const requestBody = event.body;
  //const requestBody = parseRequestBody(event);
  try {
    const shomeiR = await fetchShomei(requestBody);

    const rejectMailer = shomeiR['shomeiItems'][requestBody.route].name;
    const commentToAuthor = shomeiR['shomeiItems'][requestBody.route].commentToAuthor;
    const mailAd = shomeiR['shomeiItems'][0].mail;

    const bunAttributes = await bunsyoStatus_update(
      requestBody.pdfId,
      shomeiR.url,
      shomeiR.expiresAt
    );

    const docName = bunAttributes.docName;
    const mailResult = await mailSend(
      mailAd,
      requestBody.pdfId,
      docName,
      rejectMailer,
      commentToAuthor
    );
    return successResponse(mailResult);
  } catch (error) {
    return errorResponse(error);
  }
};
const preflightResponse = () => ({
  statusCode: 200,
  headers: resHeader,
  body: JSON.stringify('Hello from Lambda!'),
});
const parseRequestBody = (event) => (event.httpMethod === 'POST' ? JSON.parse(event.body) : event);

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

async function fetchShomei(request) {
  let itemid_r = request.pdfId;
  try {
    const params = {
      TableName: process.env.API_PDFVUEAMPPRJ_SHOMEITABLE_NAME,
      IndexName: 'gsi-bunsyo.shomei',
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'bunsyoShomeiId', // GSIの作成時に指定したキー名を設定
      },
      ExpressionAttributeValues: {
        ':id': itemid_r,
      },
    };
    const result = await dynamoDB.query(params);

    const pathName = 'public/' + request.createUserId;
    const fileName = pathName + '/' + request.pdfId;
    const expires = 604800;
    const params_geturl = {
      Bucket: bucket,
      Key: fileName,
    };

    const signedUrl = await await getSignedUrl(s3, new GetObjectCommand(params_geturl), {
      expiresIn: expires /* add value from 'Expires' from v2 call if present, else remove */,
    });
    const expiresAt = Date.now() + expires * 1000;
    return { shomeiItems: result.Items, url: signedUrl, expiresAt: expiresAt };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
async function mailSend(mailAd, itemId, docName, rejectMailer, commentToAuthor) {
  try {
    const displayName = '押印クラウドエラー通知';
    const encodedName = encodeToBase64(displayName);
    const sourceHeader = `=?UTF-8?B?${encodedName}?= <${process.env.CONTACTINFO_MAIL}>`;
    const fixedText =
      '文書' +
      docName +
      'が' +
      rejectMailer +
      '様に却下されました。下記リンクより確認してください。';
    const link = `${linkUrl}/signStatus/${itemId}`;
    var messageBody = `${fixedText}
  リンク: ${link}
  コメント：${commentToAuthor}`;
    var mail_params = {
      Destination: {
        ToAddresses: [mailAd],
      },
      Message: {
        Body: {
          Text: { Data: messageBody },
        },

        Subject: { Data: '文書' + docName + 'への署名が却下されました' },
      },
      Source: sourceHeader,
      ReplyToAddresses: [process.env.CONTACTINFO_MAIL],
    };

    const data = await ses.sendEmail(mail_params);
    console.log(data);
    return data;
  } catch (err) {
    console.error(err);
    throw err; // エラーを投げることで上位のエラーハンドリングが行われる
  }
}
async function bunsyoStatus_update(pdfId, url, expiresAt) {
  const isoDate = new Date(expiresAt).toISOString();
  const update_params_bun = {
    TableName: process.env.API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME,
    Key: { id: pdfId },
    UpdateExpression: 'set #a = :x,#b = :y,#c = :z,#d=:v', // 属性は#から始まるバインド変数、値は:から始まるバインド変数
    ExpressionAttributeNames: {
      '#a': 'bunStatus',
      '#b': 'docRef',
      '#c': 'docRefExp',
      '#d': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':x': 'reject',
      ':y': url,
      ':z': isoDate,
      ':v': new Date().toISOString(),
    },
    ReturnValues: 'ALL_NEW',
  };
  try {
    const update_result_bun = await dynamoDB.update(update_params_bun);
    return update_result_bun.Attributes;
  } catch (e) {
    console.log('exception:', e);
  }
}
function encodeToBase64(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}
