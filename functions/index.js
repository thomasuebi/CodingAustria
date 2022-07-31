const functions = require("firebase-functions")
const { Configuration, OpenAIApi } = require("openai")
const DiscoveryV1 = require("ibm-watson/discovery/v1")
const { IamAuthenticator } = require("ibm-watson/auth")
const { default: axios } = require("axios")
const convert = require("xml-js")

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.getAnswer = functions.https.onRequest(async (request, response) => {
  functions.logger.info(`Hello logs! Body: ${JSON.stringify(request.body)}`, {
    structuredData: true,
  })
  let answer = ""

  try {
    let history = request.body.data ? request.body.data.history : []
    history = Array.isArray(history) ? history : []

    const configuration = new Configuration({
      apiKey: functions.config().openai.key,
    })
    const openai = new OpenAIApi(configuration)

    if (history.length > 0) {
      // classify message
      const res1 = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: `Klassen: Frage, Anfrage, Keine Frage, Grundbuch, Firmenbuch\nNachricht: ${
          history[history.length - 1].data.text
        }\nKlassifizierung der Nachricht:`,
        temperature: 0.7,
        max_tokens: 256,
        top_p: 1,
        stop: ["\n"],
        frequency_penalty: 0,
        presence_penalty: 0,
      })

      functions.logger.info(
        `Classification: ${res1.data.choices[0].text.toLowerCase()}`,
        {
          structuredData: true,
        }
      )

      if (
        res1.data.choices[0].text.toLowerCase().includes("small talk") ||
        res1.data.choices[0].text.toLowerCase().includes("smalltalk")
      ) {
        // write reply
        const prompt = `Das Folgende ist ein Gespräch mit einem KI-Assistenten. Der Assistent spricht Deutsch, ist hilfsbereit, kreativ, clever und sehr freundlich. Wenn er etwas nicht beantworten kann, sagt er das ehrlich.\n\nMensch: Hallo, wer bist du?\n${(Array.isArray(
          history
        )
          ? history
          : []
        )
          .map(
            (message) =>
              `${message.author === "them" ? "KI: " : "Mensch: "}${
                message.data.text ? message.data.text : ""
              }`
          )
          .join("\n")}\nKI:`
        functions.logger.info("Prompt: " + prompt, { structuredData: true })

        const res = await openai.createCompletion({
          model: "text-davinci-002",
          prompt,
          temperature: 0.9,
          max_tokens: 150,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0.6,
          stop: ["Mensch:", "KI:"],
        })
        answer = res.data.choices[0].text
      } else if (
        res1.data.choices[0].text.toLowerCase().includes("grundbuchabfrage")
      ) {
        answer = "Lass uns einen Grundbuchauszug machen"
      } else if (
        res1.data.choices[0].text.toLowerCase().includes("firmenbuch") ||
        history[history.length - 1].data.text
          .toLowerCase()
          .includes("firmenbuch")
      ) {
        answer = "Lass uns einen Firmenbuchauszug machen"

        answer = "Lass uns einen Firmenbuchauszug machen"

        let access_token = ""
        const authentication_data = JSON.stringify({
          username: functions.config().verrechnungsstelle.user,
          password: functions.config().verrechnungsstelle.password,
        })

        const authentication = {
          method: "post",
          url: "https://sws-test.verrechnungsstelle.at/api/v1/authenticate",
          headers: {
            "X-API-KEY": functions.config().verrechnungsstelle.key,
            "Content-Type": "application/json",
            Cookie:
              "IMD_SESSION=u8o3h49mnjdh4ceqs4coaadcc1; PHPSESSID=u8o3h49mnjdh4ceqs4coaadcc1",
          },
          data: authentication_data,
        }

        const authResponse = await axios(authentication)
        access_token = authResponse.data["accessToken"]

        const company_request_data = JSON.stringify({
          fnr: /[0-9]{1,6} [a-z]/gi.exec(history[history.length - 1].data.text)
            ? /[0-9]{1,6} [a-z]/gi.exec(
                history[history.length - 1].data.text
              )[0]
            : "423651 t",
          stichtag: "2022-07-29",
          umfang: "aktuell",
          uvstInfo: {
            softwareName: "string",
            softwareVersion: "string",
            usewareKosten: 0,
            usewareProdukt: "string",
            betriebssystem: "string",
            geraeteName: "string",
            weitereInfo: "string",
          },
        })

        const company_request = {
          method: "post",
          url: "https://sws-test.verrechnungsstelle.at/api/v1/fb/auszug",
          headers: {
            "X-API-KEY":
              "ACH-T27RCD94UP5RHMAPT27HMCNUTDCUPCPQ5QN5CNE5R4CHZ27DQDSV7VZYS7W3FAX4",
            Authorization: "Bearer " + access_token,
            "Content-Type": "application/json",
            Cookie:
              "IMD_SESSION=u8o3h49mnjdh4ceqs4coaadcc1; PHPSESSID=u8o3h49mnjdh4ceqs4coaadcc1",
          },
          data: company_request_data,
        }

        const companyResonse = await axios(company_request)

        let buff = Buffer.from(companyResonse.data.response, "base64")
        let text = buff.toString("utf8")

        const company = convert.xml2js(text)
        answer = JSON.stringify(company)
        console.log(answer)

        let result = {}
        function simplify(obj, context) {
          if (obj.type === "text") {
            result[context.name] = obj.text
          } else {
            // eslint-disable-next-line no-unused-expressions
            Array.isArray(obj)
              ? obj.map((element) => simplify(element, obj))
              : obj.elements
              ? obj.elements.map((el) => {
                  simplify(el, obj)
                })
              : obj
          }
        }

        simplify(company)
        console.log(result)
        answer = Object.keys(result)
          .map(function (key, index) {
            return `${key.replace("ns13:", "")}: ${result[key]}`
          })
          .join("\n")
      } else if (
        res1.data.choices[0].text.toLowerCase().includes("frage") ||
        res1.data.choices[0].text.toLowerCase().includes("anfrage") ||
        res1.data.choices[0].text.toLowerCase().includes("keine frage")
      ) {
        const discovery = new DiscoveryV1({
          version: "2019-04-30",
          authenticator: new IamAuthenticator({
            apikey: functions.config().ibm.key,
          }),
          serviceUrl: functions.config().ibm.url,
        })

        const queryParams = {
          environmentId: functions.config().ibm.environment,
          collectionId: functions.config().ibm.collection,
          naturalLanguageQuery: history[history.length - 1].data.text,
        }

        function removeTags(str) {
          if (str === null || str === "") return ""
          else str = str.toString()

          // Regular expression to identify HTML tags in
          // the input string. Replacing the identified
          // HTML tag with a null string.
          return str.replace(/(<([^>]+)>)/gi, "")
        }

        const queryResponse = await discovery.query(queryParams)

        let result = history[history.length - 1].data.text
          .toLowerCase()
          .includes("schule")
          ? JSON.stringify(require("./schools.json"))
          : queryResponse.result.results[0]
          ? removeTags(queryResponse.result.results[0].text)
          : "Dazu finde ich leider nichts."
        if (queryResponse.result.results.length >= 3) {
          result =
            queryResponse.result.results[0].text +
            "\n" +
            queryResponse.result.results[1].text +
            "\n" +
            `Am 1.August findet ein gemeinsames Müllsammeln am Bludenz Bachbett statt.  Veranstaltet von der Gemeinde und dem Bürgermeister. Jede Hilfe ist willkommen. Für Getränke und Verpflegung ist gesorgt.
Die Bäume und Blumen an den Hauptstraße und dem Hauptplatz benötigen bei dieser Hitze intensivere Bewässerung. Ein Appell an alle Bürger, die ihrer Gemeinde einen Gefallen tun wollen. Gießt die Bäume und Blumen und helft somit das Stadtbild zu verschönern. Nehmt euch eure Gießkannen und ünterstützt mit dem Kummunalservice eure Mitmenschen.`
        }
        result = result.substring(0, 2000)
        functions.logger.info(result, {
          structuredData: true,
        })

        const prompt = `Kontext: ${result}\n\nDas Folgende ist ein Gespräch mit einem KI-Assistenten. Der Assistent spricht Deutsch, ist hilfsbereit, kreativ, clever und sehr freundlich. Wenn er etwas nicht beantworten kann, sagt er das ehrlich.\n\nMensch: Hallo, wer bist du?\n${(Array.isArray(
          history
        )
          ? history
          : []
        )
          .map(
            (message) =>
              `${message.author === "them" ? "KI: " : "Mensch: "}${
                message.data.text ? message.data.text : ""
              }`
          )
          .join("\n")}\nKI:`
        functions.logger.info("Prompt: " + prompt, { structuredData: true })

        const res = await openai.createCompletion({
          model: "text-davinci-002",
          prompt,
          temperature: 0.9,
          max_tokens: 150,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0.6,
          stop: ["Mensch:", "KI:"],
        })
        answer = res.data.choices[0].text
      } else {
        answer = "Frag mich bitte nochmal"
      }
    }
  } catch (error) {
    functions.logger.info(`Error: ${error.message}`, {
      structuredData: true,
    })
    answer = "Ich verstehe nicht ganz... Versuch's bitte nochmal."
  }

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
  response.send({ data: answer })
})
