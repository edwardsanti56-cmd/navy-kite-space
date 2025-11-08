import { useState, useRef, useEffect } from "react";
import { Paperclip, Mic, Send, X, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatInputBarProps {
  onSendMessage: (message: string) => Promise<void>;
  onSendMedia: (file: File, caption?: string) => Promise<void>;
  onSendAudio: (audioBlob: Blob) => Promise<void>;
  disabled?: boolean;
}

export function ChatInputBar({ onSendMessage, onSendMedia, onSendAudio, disabled }: ChatInputBarProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (disabled) return;

    try {
      if (selectedFile) {
        await onSendMedia(selectedFile, message || undefined);
        handleClearFile();
        setMessage("");
      } else if (message.trim()) {
        await onSendMessage(message.trim());
        setMessage("");
      }
    } catch (error) {
      console.error('Error sending:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length > 0) {
          await onSendAudio(audioBlob);
        }
        
        audioChunksRef.current = [];
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasContent = message.trim() || selectedFile;

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border px-4 py-3 z-30">
      {selectedFile && previewUrl && (
        <div className="mb-3 bg-card rounded-lg p-2 relative shadow-[var(--shadow-soft)]">
          <Button
            onClick={handleClearFile}
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 hover:bg-background"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="w-20 h-20 rounded-md overflow-hidden bg-muted">
            {selectedFile.type.startsWith('video/') ? (
              <video src={previewUrl} className="w-full h-full object-cover" />
            ) : (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            )}
          </div>
        </div>
      )}

      <div className="max-w-screen-lg mx-auto flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="ghost"
          size="icon"
          disabled={disabled || isRecording}
          className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent/10"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <div className="flex-1 bg-card rounded-full border border-input shadow-[var(--shadow-soft)] flex items-center px-4 py-2">
          {isRecording ? (
            <div className="flex items-center gap-3 w-full">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm text-foreground font-medium">{formatTime(recordingTime)}</span>
              </div>
            </div>
          ) : (
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              disabled={disabled}
              className="flex-1 border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 min-h-[24px] max-h-[72px] text-sm placeholder:text-muted-foreground"
              rows={1}
              style={{
                height: 'auto',
                overflowY: message.split('\n').length > 3 ? 'auto' : 'hidden'
              }}
            />
          )}
        </div>

        {isRecording ? (
          <Button
            onClick={stopRecording}
            variant="default"
            size="icon"
            className="shrink-0 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <Square className="h-5 w-5 fill-current" />
          </Button>
        ) : hasContent ? (
          <Button
            onClick={handleSend}
            variant="default"
            size="icon"
            disabled={disabled}
            className="shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            onClick={startRecording}
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent/10"
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
