/* Amplify Params - DO NOT EDIT
	AUTH_PDFVUEAMPPRJ4DDE32EC_USERPOOLID
	ENV
	REGION
	STORAGE_AMPLIFYVUEPDF_BUCKETNAME
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
// make certificate through AWS KMS
const { KMSClient, SignCommand, GetPublicKeyCommand } = require('@aws-sdk/client-kms');
const kmsclient = new KMSClient({ region: 'ap-northeast-1' });
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3client = new S3Client({ region: 'ap-northeast-1' });
const forge = require('node-forge');
var asn1 = forge.asn1;
var pki = forge.pki;

var Sig;
var X509Sig;
var publicKey;
var object;
var cert;
var pubkey_data;

exports.handler = async (event, context) => {
  const bucket = process.env.STORAGE_AMPLIFYVUEPDF_BUCKETNAME;
  cert = pki.createCertificate();
  console.log(1);
  var pubkey_params = {
    KeyId: process.env.KMS_ARN,
  };
  try {
    const commandGetPub = new GetPublicKeyCommand(pubkey_params);
    const GetPubRes = await kmsclient.send(commandGetPub);
    pubkey_data = Buffer.from(GetPubRes.PublicKey).toString('binary');
    console.log(2);
    object = asn1.fromDer(pubkey_data, false);
  } catch (e) {
    console.log('exception: ' + e);
  }
  console.log(3);
  publicKey = pki.publicKeyFromAsn1(object);
  cert.publicKey = publicKey;
  cert.signatureOid = '1.2.840.113549.1.1.11';
  cert.siginfo.algorithmOid = cert.signatureOid;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date(process.env.CERTVALIDITY_DATE);
  cert.validity.notAfter = new Date(process.env.CERTVALIDITY_DATE);

  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 5);
  var attrs = [
    {
      name: 'commonName',
      value: process.env.COMMON_NAME,
    },
    {
      name: 'countryName',
      value: process.env.COUNTRY_NAME,
    },
    {
      shortName: 'ST',
      value: process.env.ST_NAME,
    },
    {
      name: 'localityName',
      value: process.env.LOCALITY_NAME,
    },
    {
      name: 'organizationName',
      value: process.env.ORG_NAME,
    },
    {
      shortName: 'OU',
      value: process.env.OU_NAME,
    },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  //
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: false,
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 2, // URI
          value: process.env.DNS1_NAME,
        },
        {
          type: 2, // IP 2はDNS
          value: process.env.DNS2_NAME,
        },
      ],
    },
    {
      name: 'subjectKeyIdentifier',
    },
    {
      name: 'authorityKeyIdentifier',
      keyIdentifier: true,
      authorityCertIssuer: true,
    },
  ]);
  //cert md作成
  console.log(4);
  cert.tbsCertificate = pki.getTBSCertificate(cert);
  var bytes = asn1.toDer(cert.tbsCertificate);
  var cert_bytes = bytes.getBytes();
  cert.md = forge.md.sha256.create();
  cert.md.update(cert_bytes);
  X509Sig = cert.md.digest().getBytes();
  let Write_bytes = new Uint8Array(X509Sig.length);
  for (let i = 0; i < X509Sig.length; i++) {
    Write_bytes[i] = X509Sig.charCodeAt(i);
  }
  //md→sig */
  var sig_params = {
    KeyId: process.env.KMS_ARN,
    Message: Write_bytes,
    MessageType: 'DIGEST', // Indicates whether the message is RAW or a DIGEST.
    SigningAlgorithm: 'RSASSA_PKCS1_V1_5_SHA_256', //
  };
  try {
    const KMScommand = new SignCommand(sig_params);
    const KMS_end = await kmsclient.send(KMScommand);
    Sig = Buffer.from(KMS_end.Signature).toString('binary');
    console.log(5);
    cert.signature = Sig;
  } catch (e) {
    console.log('exception: ' + e);
  }
  var asn1Cert = pki.certificateToAsn1(cert);
  var pemWK = pki.certificateToPem(cert);
  var X509Der = forge.asn1.toDer(asn1Cert).getBytes();

  let Write_bytes_Der = new Uint8Array(X509Der.length);
  for (let i = 0; i < X509Der.length; i++) {
    Write_bytes_Der[i] = X509Der.charCodeAt(i);
  }
  //DER file output
  var params_der = {
    Bucket: bucket,
    Key: process.env.OUT_DER,
    Body: Write_bytes_Der,
  };
  try {
    const putDerCommand = new PutObjectCommand(params_der);
    await s3client.send(putDerCommand);
  } catch (e) {
    console.log('exception: ' + e);
  }
  //pem file output
  var params_pem = {
    Bucket: bucket,
    Key: process.env.OUT_PEM,
    Body: pemWK,
  };
  try {
    const putPemCommand = new PutObjectCommand(params_pem);
    await s3client.send(putPemCommand);
  } catch (e) {
    console.log('exception: ' + e);
  }
};
