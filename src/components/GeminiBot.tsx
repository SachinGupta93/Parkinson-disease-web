import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Bot, X, Send, AlertTriangle, Minimize, Maximize, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ScrollArea } from './ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { getGeminiResponse, testGeminiConnection, getGeminiQuotaInfo } from '@/utils/gemini';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const GeminiBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your Parkinson\'s Disease Assistant. I can help answer questions about Parkinson\'s disease, symptoms, treatments, research developments, and general medical information. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [quotaInfo, setQuotaInfo] = useState(getGeminiQuotaInfo());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update quota info periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setQuotaInfo(getGeminiQuotaInfo());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Test Gemini API connection on component mount
  useEffect(() => {
    const testApiConnection = async () => {
      try {
        const isConnected = await testGeminiConnection();
        setApiReady(isConnected);
        if (!isConnected) {
          console.warn('Gemini API connection failed, will use fallback responses');
          toast.warning('Gemini AI service temporarily unavailable', {
            description: 'Using local medical knowledge instead'
          });
        } else {
          console.log('Gemini API connection successful');
        }
      } catch (error) {
        console.error('Error testing Gemini API connection:', error);
        setApiReady(false);
        
        // Check if it's a quota error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('429') || errorMessage.includes('quota')) {
          toast.warning('Gemini AI daily quota exceeded', {
            description: 'Using local medical knowledge instead. Quota resets daily.'
          });
        } else {
          toast.error('Could not connect to Gemini API', {
            description: 'Using local responses instead'
          });
        }
      }
    };
    
    testApiConnection();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
    if (isMinimized) setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userInput.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    
    try {
      // Check if input contains prohibited topics
      const prohibitedTopics = checkForProhibitedTopics(userInput);
      
      if (prohibitedTopics) {
        // Add bot response about limitations
        setTimeout(() => {
          const botResponse: Message = {
            role: 'assistant',
            content: `I'm sorry, but I'm designed to provide information about Parkinson's disease and general medical information. I can't ${prohibitedTopics}. How else can I help you with health-related questions?`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botResponse]);
          setIsLoading(false);
        }, 1000);
        return;
      }
      
      // Create a system prompt to focus on Parkinson's disease expertise
      const systemPrompt = `You are a specialized AI assistant focused on Parkinson's disease and general medical information. 
      Provide accurate, helpful, and compassionate responses about Parkinson's disease, its symptoms, treatments, research, and related medical information.
      You should decline to answer questions outside your medical expertise area.
      Always clarify that you're providing general information and not medical advice.
      Keep your responses concise, informative and focused on the medical domain.`;
      
      // Prepare the enhanced prompt with system instructions
      const enhancedPrompt = `${systemPrompt}\n\nUser question: ${userInput}`;
      
      try {
        // Check if API is ready before calling
        if (apiReady === false) {
          // Skip API call and use fallback immediately
          const fallbackResponse: Message = {
            role: 'assistant',
            content: 'I\'m currently using local knowledge to answer: \n\n' + generateResponse(userInput),
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, fallbackResponse]);
          return;
        }
        
        // Call the Gemini API with proper error handling
        const response = await getGeminiResponse(enhancedPrompt);
        
        if (response.startsWith('Error:')) {
          throw new Error(response);
        }
        
        const botResponse: Message = {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
        
        // Update quota info after API call
        setQuotaInfo(getGeminiQuotaInfo());
      } catch (error) {
        console.error('API call failed, using fallback:', error);
        const fallbackResponse: Message = {
          role: 'assistant',
          content: 'I\'m having trouble connecting to my knowledge service. Here\'s what I know locally: \n\n' + generateResponse(userInput),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallbackResponse]);
        
        // Update quota info after fallback
        setQuotaInfo(getGeminiQuotaInfo());
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      const botResponse: Message = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again later.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to check for prohibited topics
  const checkForProhibitedTopics = (input: string): string | null => {
    const lowercaseInput = input.toLowerCase();
    
    if (lowercaseInput.includes('illegal') || 
        lowercaseInput.includes('hack') || 
        lowercaseInput.includes('weapon') || 
        lowercaseInput.match(/\bdrugs?\b/) ||
        lowercaseInput.match(/\bporn\b/) ||
        lowercaseInput.includes('suicide') ||
        lowercaseInput.includes('terror')) {
      return 'discuss illegal activities, hacking, weapons, illicit drugs, adult content, or provide harmful advice';
    }
    
    if (lowercaseInput.includes('invest') || 
        lowercaseInput.includes('stock') || 
        lowercaseInput.includes('money') || 
        lowercaseInput.includes('bitcoin') ||
        lowercaseInput.includes('crypto') ||
        lowercaseInput.includes('nft')) {
      return 'provide financial or investment advice';
    }
    
    if (lowercaseInput.includes('code') && 
        (lowercaseInput.includes('write') || 
         lowercaseInput.includes('create') || 
         lowercaseInput.includes('generate'))) {
      return 'write or debug code (I\'m focused on medical information)';
    }
    
    if (lowercaseInput.includes('politics') || 
        lowercaseInput.includes('election') || 
        lowercaseInput.includes('vote') || 
        lowercaseInput.includes('president') ||
        lowercaseInput.includes('democrat') ||
        lowercaseInput.includes('republican')) {
      return 'discuss political topics (I\'m focused on healthcare and medical information)';
    }
    
    if (lowercaseInput.includes('diagnosis') && 
        (lowercaseInput.includes('my') || 
         lowercaseInput.includes('me') || 
         lowercaseInput.includes('i am') || 
         lowercaseInput.includes('i have'))) {
      return 'provide a personal medical diagnosis. While I can discuss general Parkinson\'s symptoms, please consult a healthcare professional for personal medical advice';
    }
    
    return null;
  };

  // Simple response generator for demo purposes
  const generateResponse = (input: string): string => {
    const lowercaseInput = input.toLowerCase();
    
    if (lowercaseInput.includes('parkinson')) {
      if (lowercaseInput.includes('symptom')) {
        return "Common symptoms of Parkinson's disease include tremors, bradykinesia (slowness of movement), rigid muscles, impaired posture and balance, loss of automatic movements, speech changes, and writing changes. Early signs can be subtle and may include reduced arm swing while walking, a softer or slurred voice, or slight tremor in the hand at rest.";
      }
      
      if (lowercaseInput.includes('treatment') || lowercaseInput.includes('medicine')) {
        return "Treatments for Parkinson's disease include medications like carbidopa-levodopa, dopamine agonists, and MAO-B inhibitors that can help manage symptoms. Deep brain stimulation may be an option for advanced cases. Physical therapy, occupational therapy, and speech therapy can also help maintain quality of life. While there's no cure yet, research continues to advance our understanding and treatment options.";
      }
      
      if (lowercaseInput.includes('cause')) {
        return "The exact cause of Parkinson's disease remains unclear, but several factors appear to play a role. These include genetic mutations (though these are rare except in cases with many family members affected), environmental triggers such as exposure to certain toxins, and the presence of Lewy bodies (clumps of specific substances) and alpha-synuclein found in brain cells of people with Parkinson's.";
      }
      
      return "Parkinson's disease is a neurodegenerative disorder that affects predominantly dopamine-producing neurons in a specific area of the brain called the substantia nigra. It causes motor symptoms like tremors, stiffness, and slowness, as well as non-motor symptoms such as depression, sleep problems, and cognitive changes. While it's progressive, many people can manage symptoms effectively for years with proper treatment.";
    }
    
    if (lowercaseInput.includes('hello') || lowercaseInput.includes('hi ')) {
      return "Hello! I'm your Parkinson's Disease Assistant. How can I help you today? You can ask me about Parkinson's symptoms, treatments, latest research, or other health-related questions.";
    }
    
    if (lowercaseInput.includes('thank')) {
      return "You're welcome! If you have any other questions about Parkinson's disease or other medical topics, feel free to ask.";
    }
    
    return "I'm here to provide information about Parkinson's disease and general medical topics. Could you please clarify your question? You might want to ask about symptoms, treatments, causes, or recent research developments in Parkinson's disease.";
  };

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <>
      {/* Bot toggle button */}
      <div className="fixed bottom-6 right-6 z-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleToggleChat}
                className={`rounded-full p-3 h-14 w-14 shadow-lg ${
                  isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                }`}
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Bot className="h-6 w-6" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{isOpen ? 'Close Assistant' : 'Open Parkinson\'s Disease Assistant'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Bot dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '520px'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-40 w-full max-w-md"
          >
            <Card className="border border-purple-200 shadow-xl bg-white dark:bg-zinc-900 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-white" />
                  <div className="flex flex-col">
                    <h3 className="font-medium text-white">Parkinson's Disease Assistant</h3>
                    {/* Quota indicator */}
                    {quotaInfo.isQuotaExceeded ? (
                      <div className="flex items-center gap-1 text-xs text-red-200">
                        <Clock className="h-3 w-3" />
                        AI quota exceeded - using local responses
                      </div>
                    ) : (
                      <div className="text-xs text-blue-100">
                        {quotaInfo.dailyRequestCount}/45 AI requests used today
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleMinimize} 
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    {isMinimized ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleToggleChat} 
                    className="h-8 w-8 text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Bot limitations notice */}
                    <div className="bg-amber-50 dark:bg-amber-900/30 p-3 border-b border-amber-200 dark:border-amber-800 flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        I can only provide general medical information. I cannot diagnose conditions, 
                        prescribe treatments, or replace professional medical advice. Please consult with a healthcare provider for personal medical needs.
                      </p>
                    </div>

                    {/* Chat messages */}
                    <ScrollArea className="h-[320px] p-4">
                      <div className="space-y-4">
                        {messages.map((message, index) => (
                          <div 
                            key={index} 
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-[85%] rounded-lg p-3 ${
                                message.role === 'user' 
                                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
                                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <p className="text-[10px] mt-1 opacity-70 text-right">
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {isLoading && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-zinc-800 rounded-lg p-3 rounded-bl-none max-w-[85%]">
                              <div className="flex space-x-2 items-center">
                                <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '200ms' }} />
                                <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '400ms' }} />
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Input area */}
                    <div className="border-t border-gray-200 dark:border-zinc-700 p-4">
                      <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                          ref={inputRef}
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder="Ask about Parkinson's disease..."
                          className="flex-1"
                          disabled={isLoading}
                        />
                        <Button
                          type="submit" 
                          disabled={isLoading || !userInput.trim()}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Send className="h-4 w-4" />
                          <span className="sr-only">Send</span>
                        </Button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GeminiBot;
