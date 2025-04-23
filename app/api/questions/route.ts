import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

export async function GET(request: Request) {
  console.log('Questions API route called')
  const { searchParams } = new URL(request.url)
  const testCode = searchParams.get('testCode')

  console.log('Received testCode:', testCode)

  if (!testCode) {
    console.error('Test code is required')
    return NextResponse.json({ error: 'Test code is required' }, { status: 400 })
  }

  const questionPackagesDir = path.join(process.cwd(), 'public', 'question_packages')

  try {
    console.log('Reading question packages directory:', questionPackagesDir)
    const files = await fs.readdir(questionPackagesDir)
    console.log('Files in question packages directory:', files)

    const matchingFile = files.find(file => file.toLowerCase() === `${testCode.toLowerCase()}.json`)

    if (!matchingFile) {
      console.error('Question package not found for testCode:', testCode)
      return NextResponse.json({ error: 'Question package not found' }, { status: 404 })
    }

    console.log('Found matching file:', matchingFile)
    const fileContents = await fs.readFile(path.join(questionPackagesDir, matchingFile), 'utf8')
    const questions = JSON.parse(fileContents)

    console.log('Successfully parsed questions:', questions)
    return NextResponse.json(questions)
  } catch (error) {
    console.error('Error reading question package:', error)
    return NextResponse.json({ error: 'Error reading question package' }, { status: 500 })
  }
}

