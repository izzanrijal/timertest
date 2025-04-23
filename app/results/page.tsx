import ResultsPage from '@/components/ResultsPage'
import { Suspense } from 'react'

export default function Results() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ResultsPage />
      </Suspense>
    </main>
  )
}

