/* NexusTaskManager.tsx
   Task management interface for Nexus
*/
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle, Trash2, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface NexusTaskManagerProps {
  conversationId?: number;
}

export default function NexusTaskManager({ conversationId }: NexusTaskManagerProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  // Fetch tasks
  const { data: tasks, refetch } = trpc.nexus.listTasks.useQuery();
  const createTaskMutation = trpc.nexus.createTask.useMutation();
  const updateTaskMutation = trpc.nexus.updateTaskStatus.useMutation();

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      await createTaskMutation.mutateAsync({
        title: newTaskTitle,
        conversationId,
        priority: newTaskPriority,
      });
      setNewTaskTitle("");
      refetch();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: number, newStatus: "pending" | "in_progress" | "completed" | "failed") => {
    try {
      await updateTaskMutation.mutateAsync({
        taskId,
        status: newStatus,
      });
      refetch();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-300 border-red-400/50";
      case "high":
        return "bg-orange-500/20 text-orange-300 border-orange-400/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/50";
      case "low":
        return "bg-green-500/20 text-green-300 border-green-400/50";
      default:
        return "bg-cyan-500/20 text-cyan-300 border-cyan-400/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case "in_progress":
        return <Circle className="w-5 h-5 text-cyan-400 animate-pulse" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Circle className="w-5 h-5 text-metal-silver/60" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-void via-void-2 to-void-3">
      {/* Create task */}
      <div className="border-b border-cyan-400/20 p-4 bg-void-2/50 backdrop-blur-sm">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-cyan-400">Create Task</h3>
          <div className="flex gap-2">
            <Input
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              placeholder="Task title..."
              className="flex-1 bg-void-3 border-cyan-400/30 text-metal-silver placeholder-metal-silver/40"
              onKeyPress={e => e.key === "Enter" && handleCreateTask()}
            />
            <select
              value={newTaskPriority}
              onChange={e => setNewTaskPriority(e.target.value as any)}
              className="px-3 py-2 bg-void-3 border border-cyan-400/30 text-metal-silver rounded text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Med</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <Button
              onClick={handleCreateTask}
              disabled={!newTaskTitle.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 text-black font-semibold"
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tasks list */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {!tasks || tasks.length === 0 ? (
            <div className="text-center py-12 text-metal-silver/50">
              <p className="text-sm">No tasks yet. Create one to get started!</p>
            </div>
          ) : (
            tasks.map(task => (
              <Card
                key={task.id}
                className="bg-void-2 border-cyan-400/20 hover:border-cyan-400/40 transition-colors p-4 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => {
                      const nextStatus = task.status === "completed" ? "pending" : "completed";
                      handleUpdateTaskStatus(task.id, nextStatus);
                    }}
                    className="mt-1 flex-shrink-0"
                  >
                    {getStatusIcon(task.status)}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4
                        className={`text-sm font-medium ${
                          task.status === "completed" ? "line-through text-metal-silver/50" : "text-metal-silver"
                        }`}
                      >
                        {task.title}
                      </h4>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="text-xs text-metal-silver/60 line-clamp-2">{task.description}</p>
                    )}
                    {task.result && (
                      <p className="text-xs text-cyan-300/70 mt-2 p-2 bg-cyan-400/10 rounded border border-cyan-400/20">
                        {task.result}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <select
                      value={task.status}
                      onChange={e => handleUpdateTaskStatus(task.id, e.target.value as any)}
                      className="px-2 py-1 bg-void-3 border border-cyan-400/30 text-metal-silver rounded text-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
