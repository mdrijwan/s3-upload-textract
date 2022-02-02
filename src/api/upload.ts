import {
  s3Upload,
  analyzeProcess,
  formatResponse,
  detectProcess,
  extractProcess,
} from '../helpers/common'
import { documentDataModel, extractedDataModel, s3ParamsModel } from '../helpers/model'
import * as textractHelper from 'aws-textract-helper'

let response

export const handler = async (event) => {
  try {
    const parsedBody = JSON.parse(event.body)
    const base64File = parsedBody.file
    const decodedFile = Buffer.from(base64File.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const params: s3ParamsModel = {
      Bucket: process.env.UPLOAD_BUCKET,
      Key: `images/${new Date().toISOString()}.jpeg`,
      Body: decodedFile,
      ContentType: 'image/jpeg',
    }

    const uploadResult = await s3Upload(params)
    // console.log('UPLOAD RESULT', uploadResult)

    const textractData = await analyzeProcess(uploadResult.Key)
    // console.log('TEXT DATA', textractData)

    const formData = textractHelper.createForm(textractData, { trimChars: [':', ' '] })
    // console.log('FORM DATA', JSON.stringify(formData))

    const extractedData: extractedDataModel = await extractProcess(formData)
    // console.log('EXTRACTED DATA', extractedData)

    const analyzedData: documentDataModel = await detectProcess(uploadResult.Key)
    // console.log('ANALYZED DATA', analyzedData)

    const unifiedData = {
      make: analyzedData.make,
      model: extractedData.model,
      carRegistrationNumber: analyzedData.registrationNo,
      yearOfManufacture: extractedData.manufactureYear,
      bodyType: analyzedData.bodyType.toLocaleLowerCase(),
      numberOfSeats: analyzedData.seatingCapacity,
      engineCapacity: analyzedData.cylinderCapacity,
      chasisNumber: extractedData.chassis,
      engineNumber: analyzedData.engineNo,
      color: analyzedData.color.toLocaleLowerCase(),
      class: extractedData.class.toLocaleLowerCase(),
      transactionNumber: extractedData.transacation,
      dateOfIssue: extractedData.issueDate,
      dateOfRegistration: extractedData.registrationDate,
      taxValue: extractedData.taxValue,
      taxExemptWarranty: extractedData.taxExemptWarranty,
    }

    response = {
      s3Data: {
        message: 'Successfully uploaded file to S3',
        buecketName: uploadResult.Bucket,
        key: uploadResult.Key,
        url: uploadResult.Location,
      },
      userData: unifiedData,
    }

    return formatResponse(200, response)
  } catch (error) {
    console.error(error)

    return formatResponse(400, error.message)
  }
}
