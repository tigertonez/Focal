
'use client';

import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, User, Loader2, ChevronDown, ChevronUp, ArrowUp } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useForecast } from '@/context/ForecastContext';
import { cn } from '@/lib/utils';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export function FinancialCopilot() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { proactiveAnalysis, setProactiveAnalysis } = useForecast();
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (proactiveAnalysis && messages.length === 0) {
        const botMessage: Message = { sender: 'bot', text: proactiveAnalysis };
        setMessages([botMessage]);
        setIsExpanded(true);
        setProactiveAnalysis(null);
    }
  }, [proactiveAnalysis, messages.length, setProactiveAnalysis]);

  useEffect(() => {
    if (isExpanded) {
        setTimeout(() => {
            scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
    }
  }, [messages, isExpanded]);

  const handleSendMessage = async (question?: string) => {
    const currentInput = question || input;
    if (currentInput.trim() === '' || isLoading) return;

    const userMessage: Message = { sender: 'user', text: currentInput };
    setMessages(prev => [...prev, userMessage]);
    if (!question) {
        setInput('');
    }
    setIsLoading(true);
    setError(null);
    
    try {
      const canvas = await html2canvas(document.body, { logging: false, useCORS: true });
      const screenshotDataUri = canvas.toDataURL('image/png');

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copilot',
          question: currentInput,
          screenshotDataUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get a response from the copilot.');
      }

      const result = await response.json();
      const botMessage: Message = { sender: 'bot', text: result.answer };
      setMessages(prev => [...prev, botMessage]);

    } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred.';
        setError(errorMessage);
        const botMessage: Message = { sender: 'bot', text: "Sorry, I ran into an error. Please try again." };
        setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="fixed bottom-4 left-4 w-96 z-50 flex flex-col shadow-lg rounded-xl">
        <CardHeader 
            className="flex flex-row items-center justify-between p-2 border-b cursor-pointer" 
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Bot size={16} />
                Financial Copilot
                {proactiveAnalysis && !isExpanded && (
                    <span className="absolute top-2 left-2 h-2 w-2 rounded-full bg-destructive" />
                )}
            </CardTitle>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </CardHeader>
        <div className={cn("transition-all duration-300 ease-in-out overflow-hidden", isExpanded ? "max-h-40" : "max-h-0")}>
            <CardContent className="p-0 h-36 flex flex-col">
                <ScrollArea className="flex-1 p-3" ref={scrollAreaRef}>
                  <div className="space-y-4">
                    {messages.length === 0 && !isLoading && (
                        <div className="text-center text-sm text-muted-foreground pt-4">
                            <p>Ask me anything.</p>
                        </div>
                    )}
                    {messages.map((msg, index) => (
                      <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'bot' && <Bot className="h-5 w-5 text-primary flex-shrink-0" />}
                        <div className={`p-2.5 rounded-lg max-w-sm text-sm ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                     {isLoading && (
                      <div className="flex items-start gap-3">
                        <Bot className="h-5 w-5 text-primary flex-shrink-0" />
                        <div className="p-2.5 rounded-lg bg-muted flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    )}
                     {error && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertTitle className="text-sm">Error</AlertTitle>
                            <AlertDescription className="text-xs">{error}</AlertDescription>
                        </Alert>
                     )}
                  </div>
                </ScrollArea>
                <div className="p-2 border-t bg-background">
                  <div className="relative">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask a question..."
                      className="pr-12 min-h-[40px] text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
                      onClick={() => handleSendMessage()}
                      disabled={isLoading || !input.trim()}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
            </CardContent>
        </div>
    </Card>
  );
}
