import React, { useState } from "react"
import { Launcher } from "popup-chat-react"
import { getFunctions, httpsCallable } from "firebase/functions"

const App = () => {
  const [state, setState] = useState({
    messageList: [],
    newMessagesCount: 0,
    isOpen: false,
    fileUpload: true,
  })

  const functions = getFunctions()
  const getAnswer = httpsCallable(functions, "getAnswer")

  async function onMessageWasSent(message) {
    setState((state) => ({
      ...state,
      messageList: [...state.messageList, message],
    }))

    const result = await getAnswer({ text: message })
    sendMessage(result)
  }

  function onFilesSelected(fileList) {
    const objectURL = window.URL.createObjectURL(fileList[0])

    setState((state) => ({
      ...state,
      messageList: [
        ...state.messageList,
        {
          type: "file",
          author: "me",
          data: {
            url: objectURL,
            fileName: fileList[0].name,
          },
        },
      ],
    }))
  }

  function sendMessage(text) {
    if (text.length > 0) {
      const newMessagesCount = state.isOpen
        ? state.newMessagesCount
        : state.newMessagesCount + 1

      setState((state) => ({
        ...state,
        newMessagesCount: newMessagesCount,
        messageList: [
          ...state.messageList,
          {
            author: "them",
            type: "text",
            data: { text },
          },
        ],
      }))
    }
  }

  function onClick() {
    setState((state) => ({
      ...state,
      isOpen: !state.isOpen,
      newMessagesCount: 0,
    }))
  }

  return (
    <div>
      <Launcher
        agentProfile={{
          teamName: "Gemeinde Sonntagberg",
          // imageUrl:
          //   "https://a.slack-edge.com/66f9/img/avatars-teams/ava_0001-34.png",
        }}
        onMessageWasSent={onMessageWasSent}
        onFilesSelected={onFilesSelected}
        messageList={state.messageList}
        newMessagesCount={state.newMessagesCount}
        onClick={onClick}
        isOpen={state.isOpen}
        showEmoji
        fileUpload={state.fileUpload}
        pinMessage={{
          // imageUrl:
          //   "https://a.slack-edge.com/66f9/img/avatars-teams/ava_0001-34.png",
          title: "Deine digitale Unterstützung!",
          text: "Ich helfe dir mit all deinen Fragen und dabei, Formulare auszufüllen.",
        }}
        placeholder='...'
      />
    </div>
  )
}
export default App
