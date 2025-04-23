import TestInterface from '@/components/TestInterface'
import { Suspense } from 'react'
import type { JSX } from 'react'

export default function TestPage() {
  return (
    <main className="min-h-screen bg-background p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <TestInterface />
      </Suspense>
    </main>
  )
}

