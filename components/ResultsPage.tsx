'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TestResults {
  score: number
  total_questions: number
  correct_answers: number
  confidence_counts: {
    'very-confident': number
    'unsure': number
    'dont-know': number
  }
}

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const testCode = searchParams.get('testCode')
  const userId = searchParams.get('userId')
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    console.log('testCode:', testCode)
    console.log('userId:', userId)
  }, [testCode, userId])

  useEffect(() => {
    const fetchResults = async () => {
      if (!testCode || !userId) {
        setError('Missing test code or user ID')
        setIsLoading(false)
        return
      }

      const url = `/api/results?testCode=${testCode}&userId=${userId}`
      console.log('Fetching results from:', url)

      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log('Received data:', data)
        setTestResults(data)
      } catch (error) {
        console.error('Error loading results:', error)
        setError('Failed to load test results. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [testCode, userId])

  if (isLoading) {
    return <div>Loading results...</div>
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (!testResults) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>No Results Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No test results were found for this test code and user.</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Test Results</CardTitle>
        <CardDescription>
          Here are your test results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Your Score</h2>
            <div className="text-5xl font-bold text-primary">
              {testResults.score.toFixed(2)}%
            </div>
            <p className="mt-2">
              Correct Answers: {testResults.correct_answers} / {testResults.total_questions}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Response Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                  Very Confident
                </span>
                <span className="font-semibold">{testResults.confidence_counts['very-confident']}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                  Unsure
                </span>
                <span className="font-semibold">{testResults.confidence_counts['unsure']}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  Don't Know
                </span>
                <span className="font-semibold">{testResults.confidence_counts['dont-know']}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => router.push('/')}>
          Return to Home
        </Button>
      </CardFooter>
    </Card>
  )
}

