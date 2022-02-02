const AWS = require('aws-sdk')
const textractHelper = require('aws-textract-helper')
const multipart = require('aws-lambda-multipart-parser')
const s3 = new AWS.S3()
const textract = new AWS.Textract()
const BUCKET_NAME = process.env.UPLOAD_BUCKET

module.exports.handler = async (event) => {
  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  }

  try {
    const result = await multipart.parse(event, false)
    console.log('result', result)
    const file = result.file
    const fileName = new Date().toISOString().replace('.', '-')
    const params = {
      Bucket: BUCKET_NAME,
      Key: `images/${fileName}-${file.filename}`,
      Body: file.content,
      ContentType: file.contentType,
    }
    console.log('params', params)

    const uploadResult = await s3.upload(params).promise()
    console.log('UPLOAD RESULT', uploadResult)
    const textractData = await documentExtract(uploadResult.Key)
    // console.log('TEXT DATA', textractData)

    const formData = textractHelper.createForm(textractData, { trimChars: [':', ' '] })
    console.log('FORM DATA', JSON.stringify(formData))

    const extractedData = {
      transacation: formData.Transaction.trimEnd(),
      model: formData.Model.trimEnd(),
      issueDate: formData['Date of Issue'].trimEnd(),
      registrationDate: formData['Date registered as Owner'].trimEnd(),
      taxExemptWarranty: formData['Value of Unexpired Portion of Tax-exempt Warranty'].trimEnd(),
      manufactureYear: formData['Year of Manufacture'].trimEnd(),
      registrationMark: formData['Registration Mark'].trimEnd(),
      class: formData.Class.trimEnd(),
      taxValue: formData['First Registration Taxable Value'].trimEnd(),
      chassis: formData[''].trimEnd(),
    }
    console.log('EXTRACT DATA', JSON.stringify(extractedData))

    response.body = JSON.stringify({
      message: 'Successfully uploaded file to S3',
      uploadResult,
      extractedData,
    })
  } catch (e) {
    console.error(e)
    response.body = JSON.stringify({ message: 'File failed to upload', errorMessage: e })
    response.statusCode = 500
  }

  async function documentExtract(key) {
    return new Promise((resolve) => {
      const params = {
        Document: {
          S3Object: {
            Bucket: BUCKET_NAME,
            Name: key,
          },
        },
        FeatureTypes: ['FORMS'],
      }

      textract.analyzeDocument(params, (err, data) => {
        if (err) {
          return resolve(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  return response
}
