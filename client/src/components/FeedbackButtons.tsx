import { useState } from "react";
import { ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FeedbackButtonsProps {
  onFeedback?: (feedback: 'positive' | 'negative') => void;
  messageContent?: string;
}

export default function FeedbackButtons({ onFeedback, messageContent }: FeedbackButtonsProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFeedback = (type: 'positive' | 'negative') => {
    // Toggle: if same button clicked, deselect it
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);
    
    if (newFeedback) {
      onFeedback?.(newFeedback);
      console.log(`User feedback: ${newFeedback}`);
    } else {
      console.log('User feedback cleared');
    }
  };

  const handleCopy = async () => {
    if (messageContent) {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 mt-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? "Copied!" : "Copy"}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('positive')}
              className={`h-8 w-8 p-0 hover:bg-muted ${
                feedback === 'positive' ? 'bg-muted' : ''
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${feedback === 'positive' ? 'fill-current' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Good response</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback('negative')}
              className={`h-8 w-8 p-0 hover:bg-muted ${
                feedback === 'negative' ? 'bg-muted' : ''
              }`}
            >
              <ThumbsDown className={`h-4 w-4 ${feedback === 'negative' ? 'fill-current' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bad response</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

