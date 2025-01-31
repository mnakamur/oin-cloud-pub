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
const s3 = new S3({
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: process.env.IAM_ACCESS_KEY_ID,
    secretAccessKey: process.env.IAM_SECRET_ACCESS_KEY,
  },
});
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

  try {
    const requestBody = parseRequestBody(event);
    const shomeiResult = await fetchShomei(requestBody);
    const shomeiUrl = await getUrl(requestBody);
    if (shomeiUrl.statusCode > 400) {
      const message = `Error ${shomeiUrl.statusCode}: ${shomeiUrl.statusText || 'Unknown error'}`;
      throw new Error(message);
    }
    const bunsyoResult = await updateBunsyo(requestBody, shomeiUrl);
    const { docName: docName, userName: createUser } = bunsyoResult.Attributes;
    await mailSendAll(requestBody.pdfId, createUser, docName, shomeiResult.Items);
  } catch (error) {
    console.error('Error Type:', error['__type']);
    console.error('Error Message:', error['Message']);
    console.error('Error:', error);
  }
}; //export の最後
const preflightResponse = () => ({
  statusCode: 200,
  headers: resHeader,
  body: JSON.stringify('Hello from Lambda!'),
});
const parseRequestBody = (event) => (event.httpMethod === 'POST' ? JSON.parse(event.body) : event);
async function fetchShomei(request) {
  let itemid_r = request.pdfId;

  const params = {
    TableName: process.env.API_PDFVUEAMPPRJ_SHOMEITABLE_NAME,
    IndexName: 'gsi-bunsyo.shomei',
    KeyConditionExpression: '#id = :id',
    ExpressionAttributeNames: {
      '#id': 'bunsyoShomeiId',
    },
    ExpressionAttributeValues: {
      ':id': itemid_r,
    },
  };
  const result = await dynamoDB.query(params);
  return result;
}
async function getUrl(request) {
  const pathName = request.s3folder + request.createUserId;
  const fileName = pathName + '/' + request.pdfId;
  const expires = 604800;
  const params_geturl = {
    Bucket: bucket,
    Key: fileName,
  };
  try {
    const signedUrl = await await getSignedUrl(s3, new GetObjectCommand(params_geturl), {
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
async function mailSendAll(pdfId, createUser, docName, shomeiResult) {
  if (shomeiResult.length > 0) {
    for (let i = 0; i < shomeiResult.length; i++) {
      const mailAd = shomeiResult[i].mail;
      const mailResult = await mailSend(mailAd, pdfId, createUser, docName);

      if (!mailResult.MessageId) {
        throw new Error('mailsend error=', mailResult);
      }
    }
  } else {
    throw new Error('署名ルートがとれませんでした');
  }
}
async function mailSend(mailAd, itemId, createUser, docName) {
  const fixedText =
    createUser +
    '様からの文書' +
    '｢' +
    docName +
    '｣文書への署名処理が完了しました。下記リンクより文書をダウンロードしてください。文書は7日後には参照できなくなります。';
  const link = `${linkUrl}/signComplete/${itemId}`;
  var messageBody = `${fixedText}\n\nリンク: ${link}`;
  const displayName = '押印クラウド';
  const encodedName = encodeToBase64(displayName);
  const sourceHeader = `=?UTF-8?B?${encodedName}?= <${process.env.CONTACTINFO_MAIL}>`;
  var mail_params = {
    Destination: {
      ToAddresses: [mailAd],
    },
    Message: {
      Body: {
        Text: { Data: messageBody },
      },

      Subject: { Data: fixedText },
    },
    Source: sourceHeader,
    ReplyToAddresses: [process.env.CONTACTINFO_MAIL],
  };
  try {
    const data = await ses.sendEmail(mail_params);
    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
function encodeToBase64(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}
