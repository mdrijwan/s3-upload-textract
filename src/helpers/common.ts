import { S3, Textract } from 'aws-sdk'

const s3 = new S3()
const textract = new Textract()

export const s3Upload = async function (params) {
  try {
    const result = await s3.upload(params).promise()

    return result
  } catch (error) {
    console.log('Error', error)
  }
}

export const documentExtract = async function (key) {
  return new Promise((resolve) => {
    const params = {
      Document: {
        S3Object: {
          Bucket: process.env.UPLOAD_BUCKET,
          Name: key,
        },
      },
      FeatureTypes: ['FORMS'],
    }

    textract.analyzeDocument(params, (error, data) => {
      if (error) {
        console.log('Error', error)

        return resolve(error)
      }
      resolve(data)
    })
  })
}

export const formatResponse = (statusCode: number, response) => {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response, null, '\t'),
  }
}
