/* NexusChat.tsx
   Main Nexus chat interface with message history and input
*/
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Streamdown } from "streamdown";
import { Send, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface NexusChatProps {
  conversationId: number;
}

export default function NexusChat({ conversationId }: NexusChatProps) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string; id?: number | string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const { data: fetchedMessages } = trpc.nexus.getMessages.useQuery({ conversationId });
  const sendMessageMutation = trpc.nexus.sendMessage.useMutation();

  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        id: msg.id,
      })));
    }
  }, [fetchedMessages]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);

    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const response = await sendMessageMutation.mutateAsync({
        conversationId,
        message: userMessage,
      });

      // Add assistant response
      setMessages(prev => [...prev, { role: "assistant", content: response.response }]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-void via-void-2 to-void-3">
      {/* Messages area */}
      <ScrollArea className="flex-1 p-6 space-y-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-cyan-400/60 text-lg font-semibold mb-2">Welcome to Nexus</div>
              <p className="text-metal-silver/50 text-sm max-w-xs">
                Start a conversation with your AI assistant. Ask for help with tasks, coding, or anything else.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-cyan-600/20 border border-cyan-400/40 text-cyan-100 animate-msg-right"
                      : "glass-panel text-metal-silver animate-msg-left"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Streamdown>{msg.content}</Streamdown>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="glass-panel px-4 py-3 rounded-lg flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span className="text-sm text-metal-silver">Nexus is thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-cyan-400/20 p-4 bg-void-2/50 backdrop-blur-sm">
        <div className="flex gap-3 items-end">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === "Enter" && !isLoading && handleSendMessage()}
            placeholder="Message Nexus..."
            disabled={isLoading}
            className="flex-1 bg-void-3 border-cyan-400/30 text-metal-silver placeholder-metal-silver/40 focus:border-cyan-400/60 focus:ring-cyan-400/30"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 text-black font-semibold transition-all duration-200"
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
