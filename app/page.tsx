'use client'

import Image from "next/image";
import axios, { isCancel, AxiosError } from 'axios';
import { useEffect, useState } from "react";


type messageProps = {
    message: string;
    sender: string;
}

export default function Home() {
    const [mainChat, setMainChat] = useState<messageProps[]>([]);
    const [message, setMessage] = useState("");
    const [receivedMessage, setReceivedMessage] = useState("")

    async function sendMessage(sender: string, message: string) {
        try {
            console.log("reached here")
            const response = await axios.post('http://127.0.0.1:8000/extractText/',
                { question: message },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log(response);
            setReceivedMessage(response.data.answer)
            setMessage("")
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        if(receivedMessage !== ""){
            setMainChat([...mainChat, { message: receivedMessage, sender: "bot" }])
        }
    }, [receivedMessage])

    return (
        <div className="flex flex-col items-center p-sm [fontFamily: 'Arial, sans-serif']">
            <div className="w-[800px] h-[600px] border-[1px] border-solid border-[#ccc] p-sm overflow-auto mb-4">
                {mainChat.map((msg, i) => (
                    <div key={i} className={`my-6 p-2 ${msg.sender === "user" ? 'bg-[#0070f3] text-[#fff] ml-12 mr-2' : 'bg-[#ccc] mr-12 ml-2'} rounded-[5px]`}>
                        {msg.message.split("\n").map((line, j) => (
                            <p key={j}>{line}</p>
                        ))}
                    </div>
                ))}
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="flex justify-center w-full">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-[300px] p-2 rounded-[5px] border-[1px] border-solid border-[#ccc]"
                />
                <button type="submit" onClick={() => {
                    if (message !== "") {
                        setMainChat([...mainChat, { message: message, sender: "user" }])
                        sendMessage("user", message)
                    }
                }
                } className="ml-4 rounded-[5px] border-none bg-[#0070f3] text-[#fff] cursor-pointer px-2 py-4">
                    Send
                </button>
            </form>
        </div>
    );
}
