import { Response } from 'express'

export const sendResponse = (res: Response, resp: any, statusCode: number = 200): void => {
  res.status(statusCode).send(resp)
}

export const getFieldsChanges = (updatingData: any, originData: any): any => {
  const keys: string[] = Object.keys(updatingData)
  return keys.reduce((prev: any, key: string) => {
    if (updatingData[key] && (updatingData[key] !== originData[key] && originData[key])) {
      if (!prev) {
        prev = {};
      }
      prev[key] = updatingData[key]
      return prev;
    }
    return prev;
  }, null)
}

export const setUpdateFields = (updatingData: any, model: any): any => {
  const keys: string[] = Object.keys(updatingData)
  keys.forEach((key: string) => {
    model[key] = updatingData[key]
  })
  return model;
}