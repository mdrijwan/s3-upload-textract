import * as _ from 'lodash'
import { S3, Textract } from 'aws-sdk'
import { documentDataModel, extractedDataModel, textractParamsModel } from './model'
import { constructData, getMake, isSpecialString } from './constructor'

const s3 = new S3()
const textract = new Textract()

export const formatResponse = (statusCode: number, response) => {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response, null, '\t'),
  }
}

export const trimData = async function (data) {
  return data.replace(/(^\s+|\s+$)/g, '')
}

export const s3Upload = async function (params) {
  try {
    const result = await s3.upload(params).promise()

    return result
  } catch (error) {
    console.log('Error', error)
  }
}

export const analyzeProcess = async function (key) {
  return new Promise((resolve) => {
    const params: textractParamsModel = {
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

export const extractProcess = async function (formData) {
  const extractedData: extractedDataModel = {
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
  console.log('extractedData', extractedData)

  return extractedData
}

export const detectProcess = async (key) => {
  let detectData
  const params = {
    Document: {
      S3Object: {
        Bucket: process.env.UPLOAD_BUCKET,
        Name: key,
      },
    },
  }
  try {
    const data = await textract.detectDocumentText(params).promise()

    if (data && data.Blocks && data.Blocks.length > 1) {
      const blocks = data.Blocks.slice(1)
      const filterBlock = _.filter(blocks, (r) => r.BlockType == 'LINE')
      const mapText = _.map(filterBlock, (r) => r.Text)
      const filterString = _.filter(mapText, (r) => !isSpecialString(r))

      detectData = await extractData(filterString)
      console.log('detectData', detectData)
    }

    return detectData
  } catch (err) {
    console.log('Error', err)
  }
}

async function extractData(data) {
  console.log('DATA', data)
  const yearOfManufacture = constructData(data, 2, true, 'manufacture', 'year')
  const engineNo = constructData(data, 5, true, 'engine no', 'engine')
  const model = constructData(data, 4, true, 'model', 'model')
  const bodyType = constructData(data, 1, false, 'body type', 'type')
  const chassis = constructData(data, 10, false, 'chassis', 'chassis')
  const registrationNo = constructData(data, 7, true, 'details', 'vehicle')
  const seatingCapacity = constructData(data, 0, true, 'seating', 'capacity')
  const cylinderCapacity = constructData(data, 3, true, 'cylinder', 'cylinder')
  const color = constructData(data, 2, false, 'colour', 'colour')
  const getClass = constructData(data, 2, false, 'class', 'class')
  const make = getMake(data)
  const documentData: documentDataModel = {
    class: getClass,
    yearOfManufacture: yearOfManufacture,
    make: make,
    model: model,
    chassis: chassis,
    engineNo: engineNo,
    cylinderCapacity: cylinderCapacity,
    color: color,
    bodyType: bodyType,
    registrationNo: registrationNo,
    seatingCapacity: seatingCapacity,
  }

  return documentData
}
