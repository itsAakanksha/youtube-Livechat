import { useEffect, useState, useRef } from "react";
import YouTube from "react-youtube";
import { StreamChat } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,

  VirtualizedMessageList,
  Window,
} from "stream-chat-react";

import 'stream-chat-react/dist/css/index.css';
import "./App.css";
import './index.css'

export default function Home() {
  const [user, setUser] = useState({
   
  });
  const [client, setClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [messages, setMessages] = useState([]);

  const videoRef = useRef();

  useEffect(() => {
    if (!user?.id) return;

    async function init() {
      const chatClient = StreamChat.getInstance(
        import.meta.env.VITE_STREAM_KEY
      );

      await chatClient.connectUser(user, chatClient.devToken(user.id));

      const channel = chatClient.channel("livestream", "mylivestream", {
        name: "My Live Stream",
      });
      await channel.watch();

      setChannel(channel);
      setClient(chatClient);
    }

    init();

     return () => {
      client.disconnectUser();
      setChannel(undefined);
    }

  
  }, [user.id]);



  useEffect(() => {
    if (!channel) return;
    const listener = channel.on("message.new", async (event) => {
      const player = videoRef.current.getInternalPlayer();
      const time = await player.getCurrentTime();

      setMessages((prev) => {
        return [
          ...prev,
          {
            message: event.message,
            time,
          },
        ];
      });
    });
    return () => {
      listener.unsubscribe();
    };
  }, [channel]);

  /**
   * onStartVideo
   */

  function onStartVideo() {
    const player = videoRef.current.getInternalPlayer();
    player.playVideo();
  }

  /**
   * onStopVideo
   */

  function onStopVideo() {
    const player = videoRef.current.getInternalPlayer();
    player.pauseVideo();
  }

  /**
   * onReplayVideo
   */

  function onReplayVideo() {
    const player = videoRef.current.getInternalPlayer();

    player.pauseVideo();
    player.seekTo(0);
    player.playVideo();

    const channel = client.channel(
      "livestream",
      `mylivestream-replay-${Date.now()}`,
      {
        name: "My Live Stream",
      }
    );

    setChannel(channel);

    setInterval(async () => {
      const time = await player.getCurrentTime();

      const currentMessages = messages.filter(({ time: messageTime }) => {
        const diff = time - messageTime;
        return diff <= 1 && diff > 0;
      });

      currentMessages.forEach(async ({ message }) => {
        await channel.sendMessage({
          text: message.text,
        });
      });
    }, 1000);
  }

  return (
    <div className="container">
  

   <div className="main">
      {!user?.id ? (
        <div >
          <h2>Stream</h2>
          <p>To get started, enter your username or alias:</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const id = Array.from(e.currentTarget.elements).find(({ name }) => name === "userId").value;
            setUser({ id });
          }}>
            <input type="text" name="userId" />
            <button>Join</button>
          </form>
        </div>
      ) : (
        <div className="stream">
          <div className="streamVideo">
            <YouTube
              ref={videoRef}
              videoId="KRDwp6J_LTQ"
              // glsSGdw-xWJ6PklG
              opts={{
                playerVars: { controls: 0 }
              }}
            />
            <p>
              <button onClick={onStartVideo}>Start</button>
              <button onClick={onStopVideo}>Stop</button>
              <button onClick={onReplayVideo}>Replay</button>
            </p>
          </div>
  
          {client && channel && (
            <Chat client={client} theme="livestream dark">
              <Channel channel={channel}>
                <Window>
                  <ChannelHeader live />
                  <VirtualizedMessageList />
                  {!channel.id.includes("replay") && (
                    <MessageInput focus />
                  )}
                </Window>
              </Channel>
            </Chat>
          )}
        </div>
      )}
      </div>
    </div>
  );
 }  