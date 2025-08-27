<picture>
<img src="/public/guide/image/inkanCloud_Logo4E2.png" width=400px>   
</picture><br/>
![Security](https://img.shields.io/snyk/vulnerabilities/github/mnakamur/oin-cloud-pub)
# About oin-cloud.com?

[JA](README-JA.md)



"oin-cloud(https://www.oin-cloud.com)" is a cloud-service allows you to send PDF documents to signers and add electronic signatures and timestamps.<br/>
Additionally, you can add text inputs, stamp images, dates, and hand-drawn signatures before applying an electronic signature.

This is just a **"private"** electronic signature cloud service.
The reasons are as follows:

1.The electronic certificates used for signing are **"self-signed"** certificates generated with AWS KMS.<br/>
2.The timestamping service is also based on an open-source timestamping solution (https://freetsa.org/index_en.php).<br/>
\*Because of this, when viewing a signed document in Adobe Acrobat, a message stating
"Signature validity is unknown" may appear.

## Supported PDF Document Specifications

### Documents that cannot be registered <br/>

1.Non-PDF documents<br/>
2.Password-protected PDFs<br/>
3.Already signed PDFs<br/>
4.PDF over 2MB<br/>
5.PDFs containing form fields<br/>
6.PDFs created or modified using the latest Adobe Acrobat<br/>
(This service does not support streams and PDFs utilizing features from version 1.5 or later cannot currently be registered.Documents created using other PDF editors,such as latest PDFElement, are also not supported.)<br/>

### Example documents that can be registered

1.A PDF exported as a PDF/XSP document from a document created in WORD or EXCEL.<br/>
2.PDFs exported from OpenOffice or LibreOffice.<br/>

# How to use oin ｰ cloud.com

1. Sign up<br/>
   To register and request a signature on a document, you must create an account.
   Register using your email address and password.<br/>
   A verification code will be sent to your email. Enter the code to complete the registration.<br/>

2. Profile Setup（option）<br/>
   Register your name and company name (the registered company name + name will be displayed when forwarding documents).

3. Register a PDF Document<br/>
   Upload the document to be signed (PDF only, max file size: 2MB).<br/>
   Only one document can be registered for signing; attachments are not supported.

4. Create a Signature Route<br/>
   Add signers who need to sign the document.<br/>
   Set each signers name, email address, and signature attributes (whether they need to enter additional information).

5. Configure Signature Inputs<br/>
   Use this step if text fields, stamp images, or signature dates need to be entered during signing.<br/>
   After saving the signature route, use click and drag & drop to specify input locations on the document.<br/>
   Each signer can have multiple input fields assigned.

6. Send the Document<br/>
   The document will be forwarded in the order specified in the signature route.

7. Input, and Sign the Document<br/>
   Signers will receive a signature request email from oin-cloud.<br/>
   By clicking the link in the email, they can open the document, review its contents, input necessary information, and sign it.<br/>
   The document link is valid for 7 days after being sent.

8. Rejecting a Document<br/>
   If there are any issues with the document, the signer can reject it by providing a reason.<br/>
   A rejection email will be sent to the document creator.

9. Completing the Signature Process<br/>
   Once all signers have completed their signatures, an email confirming completion will be sent to all parties in the route.<br/>
   By clicking the link in the email, users can access the signed document.<br/>
   The completion link remains valid for 7 days, so be sure to download and save the signed document.<br/>

# About the "oin-cloud" System

oin-cloud.com is developed using various open-source software programs + AWS Amplify + AWS KMS.<br/>
<picture>
<img src="/public/guide/image/oinArch.png" width=700px>  
</picture><br/>  
**Key Open-Source Technologies Used**<br/>
Many thanks to everyone who contributed to its development and maintenance.<br/>
1.Backend<br/>
[node-signpdf](https://github.com/vbuch/node-signpdf)<br/>
[node-forge](https://github.com/digitalbazaar/forge)<br/>

2.Frontend<br/>
[Pdf-editor](https://github.com/Perfect0B0D/Pdf-editer?tab=readme-ov-file) <br/>[Pdf-editor vue](https://github.com/LibreSign/vue-pdf-editor)<br/>

3.TimeStamps<br/>
[freeTSA.org](https://freetsa.org/index_en.php)<br/>

## About the Electronic Signatures

The applied electronic signature follows the PAdES-T (Signature with Timestamp) level format.<br/>

The signature format for documents is based on PAdES-Basic (adbe.pkcs7.detached),
using SHA-512 as the hash algorithm and RSA PKCS#1 v1.5 as the signature algorithm.<br/>

The timestamp format is DocTimeStamp, using the same hash and signature algorithms as the document signature.<br/>
For more details on PDF signature formats, please refer to the PAdES documentation.<br/>

## License

MIT License
