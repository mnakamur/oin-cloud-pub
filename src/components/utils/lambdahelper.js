//import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { formatToJST } from './helper';
import { post } from 'aws-amplify/api';
export async function errorToLambda(createuserid, pdfId, appname, functionname, msg) {
  const jstTime = formatToJST(new Date());
  try {
    const restOperation = post({
      apiName: 'lambdaApi',
      path: '/shomeiErrorCwatch',
      options: {
        body: { jstTime, createuserid, pdfId, appname, functionname, msg },
        headers: {
          'X-Amz-Invocation-Type': 'Event', // 非同期実行を指定
        },
      },
    });
    const resbody = await restOperation.response;
    console.log(resbody);
  } catch (error) {
    console.log('POST call failed: ', error);
  }
}
export async function invokeLambda(functionName, payLoad) {
  try {
    const restOperation = post({
      apiName: 'lambdaApi',
      path: '/' + functionName,
      options: {
        body: payLoad,
        headers: {
          'X-Amz-Invocation-Type': 'Event', // 非同期実行を指定
        },
      },
    });
    const resbody = await restOperation.response;
    return resbody;
  } catch (error) {
    console.log('POST call failed: ', error);
    return error;
  }
}
