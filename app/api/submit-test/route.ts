import { NextResponse } from 'next/server'
import path from 'path'
import { promises as fs } from 'fs'

const dataDir = path.join(process.cwd(), 'data')
const answersFilePath = path.join(dataDir, 'answers.json')
const resultsFilePath = path.join(dataDir, 'results.json')

async function ensureFileExists(filePath: string) {
  try {
    await fs.access(filePath)
    console.log(`File exists: ${filePath}`)
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(filePath, '[]', 'utf8')
      console.log(`Created file: ${filePath}`)
    } else {
      console.error(`Error accessing file: ${filePath}`, error)
      throw error
    }
  }
}

export async function POST(request: Request) {
  console.log('Submit test API route called');
  try {
    const data = await request.json()
    console.log('Received data:', JSON.stringify(data, null, 2))
    
    if (!data.userId || !data.testCode || !Array.isArray(data.answers)) {
      console.error('Invalid data format:', data)
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 })
    }

    // Ensure the data directory exists
    await fs.mkdir(dataDir, { recursive: true })
    console.log('Data directory checked/created')

    // Ensure answers.json and results.json exist
    await ensureFileExists(answersFilePath)
    await ensureFileExists(resultsFilePath)
    console.log('Required files checked/created')
    
    let answers = []
    let results = []

    try {
      const answersFileContents = await fs.readFile(answersFilePath, 'utf8')
      answers = JSON.parse(answersFileContents)
      console.log('Existing answers loaded')
    } catch (error) {
      console.error('Error reading answers file:', error)
      return NextResponse.json({ success: false, error: 'Error reading answers file' }, { status: 500 })
    }

    try {
      const resultsFileContents = await fs.readFile(resultsFilePath, 'utf8')
      results = JSON.parse(resultsFileContents)
      console.log('Existing results loaded')
    } catch (error) {
      console.error('Error reading results file:', error)
      return NextResponse.json({ success: false, error: 'Error reading results file' }, { status: 500 })
    }

    // Process answers and results...
    console.log('Processing submission...')

    const processedAnswers = data.answers.map((answer: any) => ({
      user_id: data.userId,
      question_id: answer.question_id,
      answer: answer.answer,
      confidence: answer.confidence,
      correct_answer: answer.correct_answer,
      subtopic_id: answer.subtopic_id,
      competence: answer.competence,
      time_taken: answer.time_taken
    }))

    answers.push(...processedAnswers)
    console.log('Answers processed')

    // Calculate results...
    const correctAnswers = data.answers.filter((answer: any) => 
      answer.answer === answer.correct_answer
    ).length
    const totalQuestions = data.answers.length
    const score = (correctAnswers / totalQuestions) * 100

    const result = {
      user_id: data.userId,
      user_name: data.userName,
      test_code: data.testCode,
      score,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      confidence_counts: {
        'very-confident': data.answers.filter((a: any) => a.confidence === 'very-confident').length,
        'unsure': data.answers.filter((a: any) => a.confidence === 'unsure').length,
        'dont-know': data.answers.filter((a: any) => a.confidence === 'dont-know').length,
        'not-specified': data.answers.filter((a: any) => a.confidence === 'not-specified').length
      },
      end_time: data.endTime
    }

    results.push(result)
    console.log('Results processed')

    console.log('Writing answers to file:', answersFilePath)
    try {
      await fs.writeFile(answersFilePath, JSON.stringify(answers, null, 2))
    } catch (error) {
      console.error('Error writing to answers file:', error)
      return NextResponse.json({ success: false, error: 'Error saving test data' }, { status: 500 })
    }

    console.log('Writing results to file:', resultsFilePath)
    await fs.writeFile(resultsFilePath, JSON.stringify(results, null, 2))
    

    console.log('Test submitted successfully')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in submit-test API route:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred while submitting the test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

