import React, { useState, useRef } from "react";
import { getGeminiResponse, testGeminiConnection } from "@/utils/gemini";
import { DEFAULT_SYSTEM_PROMPT, checkForProhibitedTopics, generateFallbackResponse } from "@/utils/geminiConfig";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Brain, Loader2, SendIcon, RefreshCw } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const GeminiChat: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: "Hello! I'm your Parkinson's Disease Assistant. How can I help you today?" 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unchecked' | 'available' | 'unavailable'>('unchecked');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    
    // Add user message
    const userMessage = { role: 'user' as const, content: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    
    // Check for prohibited topics
    const prohibitedTopic = checkForProhibitedTopics(trimmedInput);
    if (prohibitedTopic) {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `I'm sorry, but I'm designed to provide information about Parkinson's disease and general medical information. I can't ${prohibitedTopic}. How else can I help you with health-related questions?` 
        }]);
        setLoading(false);
      }, 800); // Short delay for natural feel
      return;
    }
    
    try {
      // If API status is unchecked, check it first
      if (apiStatus === 'unchecked') {
        const isAvailable = await testGeminiConnection();
        setApiStatus(isAvailable ? 'available' : 'unavailable');
        
        if (!isAvailable) {
          toast({
            title: "Gemini AI service unavailable",
            description: "Using fallback response mode",
            variant: "destructive"
          });
        }
      }
      
      if (apiStatus === 'unavailable') {
        // Use fallback response if API is unavailable
        const fallbackReply = generateFallbackResponse(trimmedInput);
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'I\'m currently using local knowledge to answer: \n\n' + fallbackReply
          }]);
          setLoading(false);
        }, 1200); // Slightly longer delay for fallback to seem natural
        return;
      }
      
      // Prepare the enhanced prompt with system instructions
      const enhancedPrompt = `${DEFAULT_SYSTEM_PROMPT}\n\nUser question: ${trimmedInput}`;
      const reply = await getGeminiResponse(enhancedPrompt);
      
      // Add assistant message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: reply 
      }]);
      
      // Scroll to the latest message
      setTimeout(scrollToBottom, 100);
      
    } catch (error) {
      console.error("Error getting Gemini response:", error);
      toast({
        title: "Error",
        description: "Failed to get response from Gemini",
        variant: "destructive"
      });
      
      // Add error message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error while processing your request. Please try again." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const checkApiConnection = async () => {
    setApiStatus('unchecked');
    setLoading(true);
    
    try {
      const isAvailable = await testGeminiConnection();
      setApiStatus(isAvailable ? 'available' : 'unavailable');
      
      toast({
        title: isAvailable ? "Connected to Gemini AI" : "Gemini AI unavailable",
        description: isAvailable 
          ? "The AI service is ready to use" 
          : "Using fallback response mode",
        variant: isAvailable ? "default" : "destructive"
      });
    } catch (error) {
      setApiStatus('unavailable');
      toast({
        title: "Connection Error",
        description: "Failed to connect to Gemini AI",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>Parkinson's Disease AI Assistant</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkApiConnection}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="sr-only">Check Connection</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {apiStatus === 'unavailable' && (
          <Alert className="mb-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <AlertTitle>Limited Functionality</AlertTitle>
            <AlertDescription>
              The Gemini AI service is currently unavailable. Responses may be limited.
            </AlertDescription>
          </Alert>
        )}
        
        <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p>Thinking...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex w-full items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question about Parkinson's disease..."
            className="min-h-[80px]"
            disabled={loading}
          />
          <Button 
            type="submit" 
            disabled={loading || !input.trim()}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default GeminiChat;
