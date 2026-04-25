/* NexusDashboard.tsx
   Main Nexus AI Assistant dashboard with chat, tasks, and avatar
*/
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut, Settings, MessageSquare, CheckSquare, Brain } from "lucide-react";
import { trpc } from "@/lib/trpc";
import NexusAvatar from "@/components/NexusAvatar";
import NexusChat from "@/components/NexusChat";
import NexusTaskManager from "@/components/NexusTaskManager";
import ParticleField from "@/components/ParticleField";

export default function NexusDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("chat");

  // Create new conversation on load
  const createConvMutation = trpc.nexus.createConversation.useMutation();

  useEffect(() => {
    if (user && !currentConversationId) {
      createConvMutation.mutate(
        {
          title: `Conversation with ${user.name || "Jeffrey"}`,
          model: "qwen3.5-9b",
          uncensoredMode: false,
        },
        {
          onSuccess: () => {
            // Refetch conversations to get the new one
            // For now, we'll just set a placeholder
            setCurrentConversationId(1);
          },
        }
      );
    }
  }, [user, currentConversationId, createConvMutation]);

  if (authLoading) {
    return (
      <div className="w-full h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-metal-silver">Initializing Nexus...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <p className="text-metal-silver mb-4">Please log in to access Nexus</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-void text-metal-silver overflow-hidden">
      <ParticleField />

      {/* Header */}
      <div className="relative z-20 border-b border-cyan-400/20 bg-void-2/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-glow-blue">NEXUS</h1>
            <p className="text-xs text-metal-silver/60">AI Assistant by Jeffrey</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-metal-silver">{user.name || "User"}</p>
              <p className="text-xs text-metal-silver/60">{user.email}</p>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="text-metal-silver hover:text-cyan-400 hover:bg-cyan-400/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-[calc(100vh-80px)] flex gap-6 p-6 max-w-7xl mx-auto">
        {/* Left: Avatar Panel */}
        <div className="hidden lg:flex flex-col w-1/3 rounded-lg border border-cyan-400/20 bg-void-2/50 backdrop-blur-sm p-6 overflow-hidden">
          <NexusAvatar isThinking={false} isListening={false} />
          <div className="mt-6 text-center space-y-2">
            <h2 className="text-lg font-semibold text-cyan-400">Nexus</h2>
            <p className="text-xs text-metal-silver/60">Advanced AI Assistant</p>
            <div className="pt-4 flex justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs text-cyan-400">Ready</span>
            </div>
          </div>
        </div>

        {/* Right: Chat & Tasks */}
        <div className="flex-1 rounded-lg border border-cyan-400/20 bg-void-2/50 backdrop-blur-sm overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            {/* Tab navigation */}
            <TabsList className="w-full bg-void-3 border-b border-cyan-400/20 rounded-none justify-start px-4 py-0">
              <TabsTrigger
                value="chat"
                className="data-[state=active]:bg-cyan-600/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 rounded-none border-b-2 border-transparent"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="data-[state=active]:bg-cyan-600/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 rounded-none border-b-2 border-transparent"
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                Tasks
              </TabsTrigger>
              <TabsTrigger
                value="learning"
                className="data-[state=active]:bg-cyan-600/20 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 rounded-none border-b-2 border-transparent"
              >
                <Brain className="w-4 h-4 mr-2" />
                Learning
              </TabsTrigger>
            </TabsList>

            {/* Tab content */}
            <TabsContent value="chat" className="flex-1 overflow-hidden m-0">
              {currentConversationId ? (
                <NexusChat conversationId={currentConversationId} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="flex-1 overflow-hidden m-0">
              <NexusTaskManager conversationId={currentConversationId || undefined} />
            </TabsContent>

            <TabsContent value="learning" className="flex-1 overflow-hidden m-0 p-6">
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <Brain className="w-12 h-12 text-cyan-400/40 mx-auto mb-4" />
                  <p className="text-metal-silver/60 text-sm">Learning logs will appear here as Nexus improves</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
