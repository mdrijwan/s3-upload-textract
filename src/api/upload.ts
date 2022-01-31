import * as textractHelper from 'aws-textract-helper'
import { s3Upload, documentExtract, formatResponse } from '../helpers/common'

let response

export const handler = async (event) => {
  try {
    const parsedBody = JSON.parse(event.body)
    const base64File = parsedBody.file
    const decodedFile = Buffer.from(base64File.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const params = {
      Bucket: process.env.UPLOAD_BUCKET,
      Key: `images/${new Date().toISOString()}.jpeg`,
      Body: decodedFile,
      ContentType: 'image/jpeg',
    }

    const uploadResult = await s3Upload(params)
    console.log('UPLOAD RESULT', uploadResult)
    const textractData = await documentExtract(uploadResult.Key)
    // console.log('TEXT DATA', textractData)

    const formData = textractHelper.createForm(textractData, { trimChars: [':', ' '] })
    console.log('FORM DATA', JSON.stringify(formData))
    // function trim (data) {
    //     return data.replace(/(^\s+|\s+$)/g, '')
    // }

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

    response = {
      message: 'Successfully uploaded file to S3',
      uploadResult,
      extractedData,
    }

    return formatResponse(200, response)
  } catch (error) {
    console.error(error)

    return formatResponse(400, error.message)
  }
}
