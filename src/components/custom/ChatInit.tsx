"use client"

import { useChat, type UseChatOptions } from "ai/react"

import { Chat } from "@/components/ui/chat"
import { useState } from "react"

type ChatDemoProps = {
    initialMessages?: UseChatOptions["initialMessages"]
}

const ChatInit = (props: ChatDemoProps) => {
    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        append,
        stop,
        isLoading,
        addToolResult
    } = 
    useChat({ api: '/api/chat3',
        
        async onToolCall({ toolCall }) {
            if (toolCall.toolName === 'getLocation') {
                const confirmed = window.confirm("This application needs access to your location. Do you allow it?");
                if (confirmed) {
                    requestLocation(toolCall.toolCallId);
                }
            }
          },
     })
    // } = useChat(props)

    const [location, setLocation] = useState({});

    const requestLocation = (toolCallId: string) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ latitude, longitude });
                    addToolResult({ toolCallId, result: { latitude, longitude } });
                },
                (error) => console.error("Error getting user location:", error)
            );
        } else {
            console.error("Geolocation is not supported by this browser.");
        }
    };

    return (
        <Chat
            className="grow"
            messages={messages.filter((msg)=>!msg.toolInvocations)}
            handleSubmit={handleSubmit}
            input={input}
            handleInputChange={handleInputChange}
            isGenerating={isLoading}
            stop={stop}
            append={append}
            // suggestions={[
            //     "What is the weather today?",
            //     "Is it going to rain today?",
            //     "How windy is it outside?",
            //     "What time will the sun set today?"
            // ]}
            suggestions={[
                "Give me list of all meetings.",
                "Do I have any event planned for today?",
                "Can I schedule a meeting?"
            ]}
        />
    )
}

export default ChatInit;