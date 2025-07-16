
'use client';

import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, User, Loader2, ArrowUp, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useForecast } from '@/context/ForecastContext';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

export function FinancialCopilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { proactiveAnalysis, setProactiveAnalysis, isCopilotOpen, setIsCopilotOpen } = useForecast();
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (proactiveAnalysis && isCopilotOpen) {
        setMessages([]); 
        handleSendMessage(proactiveAnalysis, true);
        setProactiveAnalysis(null);
    }
  }, [proactiveAnalysis, isCopilotOpen, setProactiveAnalysis]);

  useEffect(() => {
    if (isCopilotOpen) {
        setTimeout(() => {
            const scrollViewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
            if (scrollViewport) {
                scrollViewport.scrollTo({ top: scrollViewport.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    }
  }, [messages, isCopilotOpen]);

  const handleSendMessage = async (question?: string, isProactive: boolean = false) => {
    const currentInput = question || input;
    if (currentInput.trim() === '' || isLoading) return;

    const userMessage: Message = { role: 'user', text: currentInput };
    const newMessages = [...messages, userMessage];
    
    if (!isProactive) {
       setMessages(newMessages);
    }
    setInput('');
    setIsLoading(true);
    setError(null);
    
    const apiHistory = newMessages.map(msg => ({
      role: msg.role === 'bot' ? 'model' : 'user',
      content: [{ text: msg.text }]
    }));

    try {
      const mainContent = document.querySelector('main');
      if (!mainContent) throw new Error("Main content area not found for screenshot.");
      
      const canvas = await html2canvas(mainContent, { logging: false, useCORS: true });
      const screenshotDataUri = canvas.toDataURL('image/png');

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copilot',
          history: apiHistory,
          screenshotDataUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to get a response from the copilot.');
      }

      const result = await response.json();
      const botMessage: Message = { role: 'bot', text: result.answer };
      
      if (isProactive) {
          setMessages([userMessage, botMessage]);
      } else {
          setMessages(prev => [...prev, botMessage]);
      }

    } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred.';
        setError(errorMessage);
        const botMessage: Message = { role: 'bot', text: "Sorry, I ran into an error. Please try again." };
        setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isCopilotOpen) {
    return null;
  }
  
  return (
    <Card className="fixed bottom-4 left-4 w-full max-w-3xl h-[25vh] max-h-[240px] z-50 flex flex-col shadow-2xl rounded-xl border-t-4 border-primary animate-in slide-in-from-bottom-5">
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b bg-background rounded-t-xl">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bot size={18} /> Financial Copilot
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={() => setIsCopilotOpen(false)} className="h-7 w-7">
            <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <ScrollArea className="flex-1 bg-background" ref={scrollAreaRef}>
          <div className="space-y-4 p-4 text-sm">
            {messages.length === 0 && !isLoading && (
                <div className="flex items-start gap-3">
                    <Bot className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div className="p-3 rounded-lg bg-muted">
                        <p>Welcome! Ask me anything about your forecast or for UI improvements.</p>
                    </div>
                </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'bot' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                <div className={`p-3 rounded-lg max-w-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                 {msg.role === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
              </div>
            ))}
             {isLoading && (
              <div className="flex items-start gap-3">
                <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground">Thinking...</span>
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
        <div className="p-3 border-t bg-background rounded-b-xl">
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
              rows={1}
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
    </Card>
  );
}
