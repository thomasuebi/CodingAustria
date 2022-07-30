const functions = require("firebase-functions")
const { Configuration, OpenAIApi } = require("openai")

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.getAnswer = functions.https.onRequest(async (request, response) => {
  functions.logger.info("Hello logs!", { structuredData: true })

  const configuration = new Configuration({
    apiKey: functions.config().openai.key,
  })
  const openai = new OpenAIApi(configuration)

  const res = await openai.createCompletion({
    model: "text-davinci-002",
    prompt:
      "Das Folgende ist ein Gespräch mit einem KI-Assistenten. Der Assistent ist hilfsbereit, kreativ, clever und sehr freundlich.\n\nMensch: Hallo, wer bist du?\nKI: Ich bin dein digitaler Assistent für die Gemeinde Sonntagberg. Wie kann ich Ihnen heute helfen?\nMensch:",
    temperature: 0.9,
    max_tokens: 150,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0.6,
    stop: [" Mensch:", " KI:"],
  })

  response.setHeader("Access-Control-Allow-Origin", "*")
  response.setHeader("Access-Control-Allow-Credentials", "true")
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,POST,PUT"
  )
  response.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
  )
  response.send({ text: "Hello from Firebase!" })
})
