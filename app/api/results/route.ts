import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

const dataDir = path.join(process.cwd(), 'data')

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const testCode = searchParams.get('testCode')
  const userId = searchParams.get('userId')

  console.log('API called with testCode:', testCode, 'and userId:', userId)

  if (!testCode || !userId) {
    console.log('Missing testCode or userId')
    return NextResponse.json({ error: 'Test code and user ID are required' }, { status: 400 })
  }

  const resultsFilePath = path.join(dataDir, 'results.json')
  console.log('Attempting to read results from:', resultsFilePath)

  try {
    const fileContents = await fs.readFile(resultsFilePath, 'utf8')
    const results = JSON.parse(fileContents)

    console.log('Total results found:', results.length)

    const userResult = results.find((result: any) => 
      result.user_id === userId && result.test_code === testCode
    )

    if (!userResult) {
      console.log('No results found for user:', userId, 'and test:', testCode)
      return NextResponse.json({ error: 'No results found for this user and test code' }, { status: 404 })
    }

    console.log('Found result for user:', userId, 'and test:', testCode)
    return NextResponse.json(userResult)
  } catch (error) {
    console.error('Error reading results:', error)
    return NextResponse.json({ error: 'Error reading or processing results' }, { status: 500 })
  }
}

