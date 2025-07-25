
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Bot, User, Loader2, ArrowUp, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useForecast } from '@/context/ForecastContext';
import { getFinancials } from '@/lib/get-financials';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

export function FinancialCopilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { proactiveAnalysis, setProactiveAnalysis, isCopilotOpen, setIsCopilotOpen, t, locale } = useForecast();
  const { toast } = useToast();
  
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
        setMessages([{ role: 'bot', text: t.copilot.initial }]);
        setTimeout(() => {
            const scrollViewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
            if (scrollViewport) {
                scrollViewport.scrollTo({ top: scrollViewport.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    }
  }, [isCopilotOpen, t]);

   useEffect(() => {
    if (messages.length > 1) { // Scroll on new messages, but not initial welcome
        setTimeout(() => {
            const scrollViewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
            if (scrollViewport) {
                scrollViewport.scrollTo({ top: scrollViewport.scrollHeight, behavior: 'smooth' });
            }
        }, 100);
    }
  }, [messages]);


  const handleSendMessage = async (question?: string, isProactive: boolean = false) => {
    const currentInput = question || input;
    if (currentInput.trim() === '' || isLoading) return;

    const financials = getFinancials();
    if (financials.error || !financials.data || !financials.inputs) {
        toast({
            variant: "destructive",
            title: "Cannot start copilot",
            description: "Please run a report from the Inputs page first to load the data.",
        });
        return;
    }

    const userMessage: Message = { role: 'user', text: currentInput };
    const newMessages = isProactive ? [userMessage] : [...messages, userMessage];
    
    setMessages(newMessages);
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
      
      const canvas = await import('html2canvas').then(m => m.default);
      const screenshotDataUri = await canvas(mainContent, { logging: false, useCORS: true }).then(c => c.toDataURL('image/png'));

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copilot',
          history: apiHistory,
          screenshotDataUri,
          language: locale,
          financials: {
            inputs: financials.inputs,
            data: financials.data,
          }
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.details || result.error || 'Failed to get a response from the copilot.');
      }

      const botMessage: Message = { role: 'bot', text: result.answer };
      
      setMessages(prev => [...prev, botMessage]);

    } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred.';
        setError(errorMessage);
        const botMessage: Message = { role: 'bot', text: t.copilot.error };
        setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed bottom-4 left-4 w-1/2 h-auto max-h-[60vh] z-50">
        <Card className="w-full h-full flex flex-col shadow-2xl rounded-xl bg-card animate-in slide-in-from-bottom-5">
            <Button variant="ghost" size="icon" onClick={() => setIsCopilotOpen(false)} className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-background border shadow-md z-10">
                <X className="h-4 w-4" />
            </Button>

            <ScrollArea className="flex-1" ref={scrollAreaRef}>
              <div className="space-y-4 p-4 text-sm">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'bot' && <Bot className="h-5 w-5 text-primary flex-shrink-0" />}
                    <div className={`p-2.5 rounded-lg max-w-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                     {msg.role === 'user' && <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                  </div>
                ))}
                 {isLoading && (
                  <div className="flex items-start gap-3">
                    <Bot className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="p-2.5 rounded-lg bg-muted flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-muted-foreground">{t.copilot.thinking}</span>
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

            <div className="p-2 border-t bg-background rounded-b-xl">
              <div className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t.copilot.placeholder}
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
    </div>
  );
}
