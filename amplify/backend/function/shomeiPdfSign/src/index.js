/* Amplify Params - DO NOT EDIT
	API_PDFVUEAMPPRJ_BUNSYOTABLE_ARN
	API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME
	API_PDFVUEAMPPRJ_CONTENTSTABLE_ARN
	API_PDFVUEAMPPRJ_CONTENTSTABLE_NAME
	API_PDFVUEAMPPRJ_GRAPHQLAPIENDPOINTOUTPUT
	API_PDFVUEAMPPRJ_GRAPHQLAPIIDOUTPUT
	API_PDFVUEAMPPRJ_GRAPHQLAPIKEYOUTPUT
	API_PDFVUEAMPPRJ_SHOMEITABLE_ARN
	API_PDFVUEAMPPRJ_SHOMEITABLE_NAME
	ENV
	FUNCTION_SHOMEIFLOW_NAME
	FUNCTION_SHOMEIMAILBOUNCE_NAME
	REGION
	STORAGE_AMPLIFYVUEPDF_BUCKETNAME
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { KMSClient, SignCommand } = require('@aws-sdk/client-kms');
const kmsclient = new KMSClient({ region: 'ap-northeast-1' });
const { Lambda } = require('@aws-sdk/client-lambda');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3client = new S3Client({ region: 'ap-northeast-1' });
const dynamoDB = DynamoDBDocument.from(new DynamoDB());
const lambda = new Lambda();

const forge = require('node-forge');
const SignPdfforKms = require('node-signpdf/src/signpdfforKms');
const { _signersToAsn1, _signerToAsn1, _attributeToAsn1 } = require('node-signpdf/src/asn1util');
const SignPdfError = require('node-signpdf/src/SignPdfError');
const plainAddPlaceholder = require('node-signpdf/src/helpers/plainAddPlaceholder');
const bucket = process.env.STORAGE_AMPLIFYVUEPDF_BUCKETNAME;
var pemCert;
var dummyPRkey;
const resHeader = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

//Mainここからメイン処理
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return preflightResponse();
  }
  const eventBody = event.body;
  //const eventBody = parseRequestBody(event.body);
  console.log('eventBody=', eventBody);
  const pathName = 'protected' + '/' + eventBody.s3folder + '/' + eventBody.createUserId;
  const docfileName = pathName + '/' + eventBody.pdfId;
  let pdfBuffer = await s3GetObject(docfileName);
  let dumx509 = process.env.DUM_X509;
  pemCert = await s3GetObject(dumx509);

  let dumPR = process.env.DUM_PRKEY;
  dummyPRkey = await s3GetObject(dumPR);

  console.log(1);
  const shomeiName = await shomeiRead(eventBody.pdfId, eventBody.routeNo);
  const contentsItem = await contentsRead(eventBody.pdfId, eventBody.routeNo);

  try {
    let widgetItem = {};
    if (contentsItem.length > 0) {
      for (const widgetItem of contentsItem) {
        pdfBuffer = await signFunc(pdfBuffer, dummyPRkey, pemCert, shomeiName, widgetItem);
      }
    } else {
      pdfBuffer = await signFunc(pdfBuffer, dummyPRkey, pemCert, shomeiName, widgetItem);
    }
  } catch (error) {
    console.log(
      '署名できませんでした.メールを飛ばします',
      eventBody.pdfId,
      eventBody.routeNo,
      eventBody.createUserId,
      error
    );
    await shomeiErrorSend(eventBody.pdfId, eventBody.routeNo);
  }

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: docfileName,
      Body: pdfBuffer,
    });

    await s3client.send(command);
    await bunsyoStatus_update(eventBody.pdfId, eventBody.routeNo);
    await shomeiStatus_update(eventBody.pdfId, eventBody.routeNo);
    await nextRootGo(eventBody.pdfId, eventBody.routeNo);
  } catch (e) {
    console.log('exception:', e);
  }
};
//export end
async function s3GetObject(fileName) {
  const param_s3 = {
    Bucket: bucket,
    Key: fileName,
  };
  try {
    const command = new GetObjectCommand(param_s3);
    const response = await s3client.send(command);
    const resByteArray = await response.Body.transformToByteArray();
    const bodyBuffer = Buffer.from(resByteArray);
    return bodyBuffer;
  } catch (error) {
    throw new Error(`Error getting object from S3: ${error.message}`);
  }
}
async function signFunc(pdfBuffer, p12, pemCert, shomeiName, widgetItem) {
  pdfBuffer = await plainAddPlaceholder({
    pdfBuffer,
    reason: shomeiName + 'によって署名されました',
    contactInfo: process.env.CONTACTINFO_MAIL,
    signatureLength: 8192,
    name: shomeiName,
    location: 'tokyo',
    Widget: widgetItem,
  });
  console.log(2);
  //add
  var signer_md = new SignPdfforKms();
  var { p7, pdf, byteRange, placeholderLength } = signer_md.sign(pdfBuffer, p12, pemCert);

  console.log(9);
  var signer = p7.signers[0];
  var pdf_md = signer.md.digest().getBytes();
  let mdarray = new Uint8Array(pdf_md.length);
  for (let i = 0; i < pdf_md.length; i++) {
    mdarray[i] = pdf_md.charCodeAt(i);
  }
  var kms_params = {
    KeyId: process.env.KMS_ARN, // The asymmetric KMS key to be used to generate the digital signature. This example uses an alias of the KMS key.
    Message: mdarray,
    MessageType: 'DIGEST', // Indicates whether the message is RAW or a DIGEST.
    SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_512', //RSASSA_PKCS1_V1_5_SHA_512
  };
  try {
    const command = new SignCommand(kms_params);
    const KMS_end = await kmsclient.send(command);
    var signBuffer = Buffer.from(KMS_end.Signature);
    //.promise();
  } catch (e) {
    console.log('exception: ' + e);
  }
  p7.signers[0].signature = signBuffer.toString('binary');

  p7.signerInfos = _signersToAsn1(p7.signers);
  const raw = forge.asn1.toDer(p7.toAsn1()).getBytes();
  console.log(10);
  if (raw.length * 2 > placeholderLength) {
    throw new SignPdfError(
      `Signature exceeds placeholder length: ${raw.length * 2} > ${placeholderLength}`,
      SignPdfError.TYPE_INPUT
    );
  }
  let signature = Buffer.from(raw, 'binary').toString('hex');
  console.log(11);

  signature += Buffer.from(
    String.fromCharCode(0).repeat(placeholderLength / 2 - raw.length)
  ).toString('hex');

  pdf = Buffer.concat([
    pdf.slice(0, byteRange[1]),
    Buffer.from(`<${signature}>`),
    pdf.slice(byteRange[1]),
  ]);
  //ここで一旦終わり
  console.log(14);

  return pdf;
}
//graphQL　関数群
async function shomeiRead(pdfId, routeNo) {
  let itemid_r = pdfId + routeNo;
  const params = {
    TableName: process.env.API_PDFVUEAMPPRJ_SHOMEITABLE_NAME,
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
      ':id': itemid_r,
    },
  };
  try {
    const result = await dynamoDB.query(params);
    return result.Items[0].name;
  } catch (e) {
    console.log('exception:', e);
  }
}
async function contentsRead(pdfId, routeNo) {
  let itemid_r = pdfId + routeNo;
  const params = {
    TableName: process.env.API_PDFVUEAMPPRJ_CONTENTSTABLE_NAME, // テーブル名
    IndexName: 'gsi-Shomei.content', // GSI名
    KeyConditionExpression: 'shomeiContentId = :id',
    ExpressionAttributeValues: {
      ':id': itemid_r, // shomeiContentIdの値をeventから取得
    },
  };
  try {
    const contents_result = await dynamoDB.query(params);
    return contents_result.Items; // クエリ結果を返す
  } catch (error) {
    console.error('DynamoDB shomei Query Error: ', error);
  }
}
async function bunsyoStatus_update(pdfId, routeNo) {
  const update_params_bun = {
    TableName: process.env.API_PDFVUEAMPPRJ_BUNSYOTABLE_NAME,
    Key: { id: pdfId },
    UpdateExpression: 'set #a = :x,#b =:y', // 属性は#から始まるバインド変数、値は:から始まるバインド変数
    ExpressionAttributeNames: { '#a': 'bunStatus', '#b': 'updatedAt' }, // 属性名はname
    ExpressionAttributeValues: { ':x': 'signed' + ',' + routeNo, ':y': new Date().toISOString() },
  };
  try {
    const update_result_bun = await dynamoDB.update(update_params_bun);
  } catch (e) {
    console.log('exception:', e);
  }
}
async function shomeiStatus_update(pdfId, routeNo) {
  const update_params_bun = {
    TableName: process.env.API_PDFVUEAMPPRJ_SHOMEITABLE_NAME,
    Key: { id: pdfId + routeNo },
    UpdateExpression: 'set #a = :x,#b =:y', // 属性は#から始まるバインド変数、値は:から始まるバインド変数
    ExpressionAttributeNames: { '#a': 'shomeiStatus', '#b': 'updatedAt' }, // 属性名はname
    ExpressionAttributeValues: { ':x': 'signed', ':y': new Date().toISOString() },
  };
  try {
    await dynamoDB.update(update_params_bun);
  } catch (e) {
    console.log('exception:', e);
  }
}
async function nextRootGo(pdfId, routeNo) {
  const params = {
    FunctionName: process.env.FUNCTION_SHOMEIFLOW_NAME,
    InvocationType: 'Event', // 非同期呼び出しもしくはEvent
    Payload: JSON.stringify({ pdfId: pdfId, routeNo: parseInt(routeNo, 10) + 1 }), // 送信するデータ (オプション)
    //Payload: { pdfId: pdfId, routeNo: parseInt(routeNo, 10) + 1 }, // 送信するデータ (オプション)
  };
  try {
    await lambda.invoke(params);
    return 'success';
  } catch (error) {
    console.error('Error Invoking Lambda:', error);
    return error;
  }
}
async function shomeiErrorSend(pdfId, routeNo) {
  const params_SE = {
    FunctionName: process.env.FUNCTION_SHOMEIMAILBOUNCE_NAME,
    InvocationType: 'Event', // 非同期呼び出しもしくはEvent
    Payload: JSON.stringify({
      Records: [
        { body: JSON.stringify({ notificationType: 'signError', pdfId: pdfId, routeNo: routeNo }) },
      ],
    }), // 送信するデータ (オプション)
  };
  try {
    await lambda.invoke(params_SE);
    return 'success';
  } catch (error) {
    console.error('Error Invoking Lambda:', error);
    return error;
  }
}
const preflightResponse = () => ({
  statusCode: 200,
  headers: resHeader,
  body: JSON.stringify('Hello from Lambda!'),
});
const parseRequestBody = (event) => (event.httpMethod === 'POST' ? JSON.parse(event) : event);
