'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

interface Question {
  id: string
  scenario: string
  question: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e: string
  correct_answer: string
  image_url?: string
  subtopic_list_id: string
  competence: string
}

interface Answer {
  answer: string
  confidence: string
  time_taken: number
}

interface ConfidenceLevelPopupProps {
  isOpen: boolean
  onClose: () => void
  onSelectConfidence: (confidence: string) => void
  timeLeft: number
}

const ConfidenceLevelPopup: React.FC<ConfidenceLevelPopupProps> = ({ isOpen, onClose, onSelectConfidence, timeLeft }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Confidence Level</DialogTitle>
          <DialogDescription>
            Please select your confidence level for this question. Time left: {timeLeft} seconds
          </DialogDescription>
        </DialogHeader>
        <RadioGroup onValueChange={onSelectConfidence} className="space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="very-confident" id="popup-very-confident" />
            <Label htmlFor="popup-very-confident">Sangat Yakin (Very Confident)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="unsure" id="popup-unsure" />
            <Label htmlFor="popup-unsure">Masih Ragu (Unsure)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dont-know" id="popup-dont-know" />
            <Label htmlFor="popup-dont-know">Saya Tidak Tahu untuk jawaban soal ini (I Don't Know)</Label>
          </div>
        </RadioGroup>
      </DialogContent>
    </Dialog>
  )
}

export default function TestInterface() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const testCode = searchParams.get('testCode')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15)
  const [isReviewMode, setIsReviewMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const isMounted = useRef(true)
  const [showConfidencePopup, setShowConfidencePopup] = useState(false)
  const [confidencePopupTimeLeft, setConfidencePopupTimeLeft] = useState(8)

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`/api/questions?testCode=${testCode}`)
        if (!response.ok) {
          throw new Error('Failed to fetch questions')
        }
        const data = await response.json()
        const questionData = data[2].data
        if (isMounted.current) {
          setQuestions(questionData)
          setAnswers(questionData.map(() => ({ answer: '', confidence: '', time_taken: 0 })))
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error loading questions:', error)
        if (isMounted.current) {
          setSubmissionError('Failed to load questions. Please try again.')
          setIsLoading(false)
        }
      }
    }

    if (testCode) {
      fetchQuestions()
    }

    return () => {
      isMounted.current = false
    }
  }, [testCode])

  const moveToNextQuestion = useCallback(() => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prevQuestion => prevQuestion + 1)
      setTimeLeft(15) // Reset timer for the next question
    } else {
      setIsReviewMode(true)
    }
  }, [currentQuestion, questions.length])

  const handleTimeUp = useCallback(() => {
    if (isMounted.current) {
      const newAnswers = [...answers]
      newAnswers[currentQuestion] = {
        ...newAnswers[currentQuestion],
        time_taken: 15,
        answer: newAnswers[currentQuestion].answer || '',
      }
      setAnswers(newAnswers)
      
      if (newAnswers[currentQuestion].answer) {
        setShowConfidencePopup(true)
        setConfidencePopupTimeLeft(8)
      } else {
        setTimeLeft(15) // Reset timer before moving to next question
        moveToNextQuestion()
      }
    }
  }, [answers, currentQuestion, moveToNextQuestion])

  const handleConfidencePopupClose = useCallback(() => {
    setShowConfidencePopup(false)
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = {
      ...newAnswers[currentQuestion],
      confidence: newAnswers[currentQuestion].confidence || 'not-specified'
    }
    setAnswers(newAnswers)
    moveToNextQuestion()
  }, [answers, currentQuestion, moveToNextQuestion])

  const handleConfidenceSelection = useCallback((confidence: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = {
      ...newAnswers[currentQuestion],
      confidence: confidence
    }
    setAnswers(newAnswers)
    setShowConfidencePopup(false)
    moveToNextQuestion()
  }, [answers, currentQuestion, moveToNextQuestion])

  useEffect(() => {
    if (showConfidencePopup) {
      const timer = setInterval(() => {
        setConfidencePopupTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer)
            handleConfidencePopupClose()
            return 0
          }
          return prevTime - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [showConfidencePopup, handleConfidencePopupClose])

  useEffect(() => {
    if (isReviewMode || isLoading || showConfidencePopup) return

    const timer = setInterval(() => {
      if (isMounted.current) {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer)
            handleTimeUp()
            return 15 // Reset to 15 seconds instead of 0
          }
          return prevTime - 1
        })
      }
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [currentQuestion, isReviewMode, isLoading, handleTimeUp, showConfidencePopup])

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = {
      ...newAnswers[currentQuestion],
      answer: value
    }
    setAnswers(newAnswers)
  }

  const handleConfidenceChange = (value: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = {
      ...newAnswers[currentQuestion],
      confidence: value
    }
    setAnswers(newAnswers)
  }

  const nextQuestion = useCallback(() => {
    if (answers[currentQuestion].answer && !answers[currentQuestion].confidence) {
      setShowConfidencePopup(true)
      setConfidencePopupTimeLeft(8)
    } else {
      const newAnswers = [...answers]
      newAnswers[currentQuestion] = {
        ...newAnswers[currentQuestion],
        time_taken: 15 - timeLeft,
        confidence: newAnswers[currentQuestion].confidence || (newAnswers[currentQuestion].answer ? 'not-specified' : '')
      }
      setAnswers(newAnswers)
      setTimeLeft(15) // Reset timer before moving to next question
      moveToNextQuestion()
    }
  }, [answers, currentQuestion, timeLeft, moveToNextQuestion])

  const submitTest = async () => {
    console.log('Submit test clicked')
    try {
      setIsSubmitting(true)
      setSubmissionError(null)
      setShowSubmitModal(false)

      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      console.log('User data:', userData)

      if (!userData.user_id) {
        throw new Error('User data not found. Please start the test again.')
      }

      const testData = {
        userId: userData.user_id,
        userName: userData.name,
        testCode: testCode,
        answers: answers.map((answer, index) => ({
          ...answer,
          question_id: questions[index].id,
          correct_answer: questions[index].correct_answer,
          subtopic_id: questions[index].subtopic_list_id,
          competence: questions[index].competence,
        })),
        endTime: new Date().toISOString()
      }

      console.log('Submitting test data:', testData)

      const response = await fetch('/api/submit-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response data:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit test')
      }

      if (result.success) {
        toast({
          title: "Test Submitted",
          description: "Your test has been successfully submitted.",
        })
        router.push(`/results?testCode=${testCode}&userId=${userData.user_id}`)
      } else {
        throw new Error('Failed to submit test')
      }
    } catch (error) {
      console.error('Error submitting test:', error)
      setSubmissionError(error instanceof Error ? error.message : 'An unknown error occurred')
      toast({
        title: "Error",
        description: "Failed to submit test. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (questions.length === 0) {
    return <div>No questions found for this test.</div>
  }

  if (isReviewMode) {
    return (
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6">Review Your Answers</h1>
        {questions.map((question, index) => (
          <Card key={index} className="mb-4">
            <CardContent className="p-4">
              <h2 className="font-semibold mb-2">Question {index + 1}</h2>
              <p>{question.question}</p>
              <div className="mt-2">
                <span className="font-semibold">Your answer: </span>
                {answers[index]?.answer || 'Not answered'}
              </div>
              <div className="mt-1">
                <span className="font-semibold">Confidence: </span>
                {answers[index]?.confidence || 'Not specified'}
              </div>
              <div className="mt-1">
                <span className="font-semibold">Time taken: </span>
                {answers[index]?.time_taken || 0} seconds
              </div>
            </CardContent>
          </Card>
        ))}
        {submissionError && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{submissionError}</AlertDescription>
          </Alert>
        )}
        <Button 
          onClick={submitTest} 
          disabled={isSubmitting} 
          className="mt-4 w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Test'}
        </Button>
      </div>
    )
  }

  const currentQuestionData = questions[currentQuestion]

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Question {currentQuestion + 1} / {questions.length}</h1>
        <div className="text-xl font-semibold">
          Time left: {timeLeft} seconds
        </div>
      </div>

      <Progress value={(currentQuestion / questions.length) * 100} className="mb-4" />

      <Card>
        <CardContent className="p-6">
          <p className="mb-4 text-gray-600">{currentQuestionData.scenario}</p>
          <h2 className="text-xl font-semibold mb-4">{currentQuestionData.question}</h2>

          <RadioGroup
            value={answers[currentQuestion]?.answer || ''}
            onValueChange={handleAnswerChange}
            className="space-y-2"
          >
            {['A', 'B', 'C', 'D', 'E'].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${option}`} />
                <Label htmlFor={`option-${option}`}>{currentQuestionData[`option_${option.toLowerCase()}` as keyof Question]}</Label>
              </div>
            ))}
          </RadioGroup>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Confidence Level:</h3>
            <RadioGroup
              value={answers[currentQuestion]?.confidence || ''}
              onValueChange={handleConfidenceChange}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="very-confident" id="very-confident" />
                <Label htmlFor="very-confident">Sangat Yakin (Very Confident)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unsure" id="unsure" />
                <Label htmlFor="unsure">Masih Ragu (Unsure)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dont-know" id="dont-know" />
                <Label htmlFor="dont-know">Saya Tidak Tahu untuk jawaban soal ini (I Don't Know)</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-6">
        <Button onClick={nextQuestion}>
          {currentQuestion === questions.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </div>

      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Test</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit the test? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>No</Button>
            <Button onClick={submitTest}>Yes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfidenceLevelPopup
        isOpen={showConfidencePopup}
        onClose={handleConfidencePopupClose}
        onSelectConfidence={handleConfidenceSelection}
        timeLeft={confidencePopupTimeLeft}
      />
    </div>
  )
}

