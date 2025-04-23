import fs from 'fs'
import path from 'path'

const dataDir = path.join(process.cwd(), 'data')

// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
  console.log('Created data directory:', dataDir)
}

const files = ['results.json', 'users.json', 'answers.json']

files.forEach(file => {
  const filePath = path.join(dataDir, file)
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf8')
    console.log(`Created ${file}`)
  } else {
    console.log(`${file} already exists`)
  }
})

console.log('Data files initialization complete')

