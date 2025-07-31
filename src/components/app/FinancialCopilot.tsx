
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Bot, User, Loader2, ArrowUp, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useForecast } from '@/context/ForecastContext';
import { useToast } from '@/hooks/use-toast';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';


export function FinancialCopilot() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { 
    proactiveAnalysis, 
    setProactiveAnalysis, 
    isCopilotOpen, 
    setIsCopilotOpen, 
    t, 
    locale,
    messages,
    setMessages,
    inputs,
    financials,
  } = useForecast();
  const { toast } = useToast();
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // State for resizable window
  const [size, setSize] = useState({ width: 550, height: 200 });
  const [isResizing, setIsResizing] = useState<{ right?: boolean, top?: boolean, left?: boolean }>({});
  const chatRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, direction: 'right' | 'top' | 'left') => {
    e.preventDefault();
    setIsResizing({ [direction]: true });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (Object.values(isResizing).every(v => !v)) return;

    setSize(prevSize => {
      let newWidth = prevSize.width;
      let newHeight = prevSize.height;

      if (isResizing.right) {
        newWidth = e.clientX - (chatRef.current?.getBoundingClientRect().left ?? 0);
      }
      if (isResizing.left) {
          const right = (chatRef.current?.getBoundingClientRect().right ?? 0);
          newWidth = right - e.clientX;
      }
      if (isResizing.top) {
        newHeight = (chatRef.current?.getBoundingClientRect().bottom ?? 0) - e.clientY;
      }
      
      const minWidth = 400;
      const minHeight = 300;

      return {
        width: Math.max(newWidth, minWidth),
        height: Math.max(newHeight, minHeight)
      };
    });
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing({});
  }, []);

  useEffect(() => {
    if (Object.values(isResizing).some(v => v)) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);


  useEffect(() => {
    if (proactiveAnalysis && isCopilotOpen) {
        handleSendMessage(proactiveAnalysis, true);
        setProactiveAnalysis(null);
    }
  }, [proactiveAnalysis, isCopilotOpen]);


   useEffect(() => {
    if (messages.length > 0) { 
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

    if (financials.error || !financials.data || !inputs) {
        toast({
            variant: "destructive",
            title: "Cannot start copilot",
            description: "Please run a report from the Inputs page first to load the data.",
        });
        return;
    }

    const userMessage: Message = { role: 'user', text: currentInput };
    const newMessages = [...messages, userMessage];
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
            inputs: inputs,
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
    <div 
        ref={chatRef}
        className="fixed bottom-4 left-4 z-50"
        style={{ width: size.width, height: size.height }}
    >
        <Card className="w-full h-full flex flex-col shadow-2xl rounded-xl bg-card animate-in slide-in-from-bottom-5 relative">
            <div 
                className="absolute top-0 -left-1 h-full w-2 cursor-ew-resize"
                onMouseDown={(e) => handleMouseDown(e, 'left')}
            />
            <div 
                className="absolute top-0 -right-1 h-full w-2 cursor-ew-resize"
                onMouseDown={(e) => handleMouseDown(e, 'right')}
            />
            <div 
                className="absolute -top-1 left-0 w-full h-2 cursor-ns-resize"
                onMouseDown={(e) => handleMouseDown(e, 'top')}
            />

            <Button variant="ghost" size="icon" onClick={() => setIsCopilotOpen(false)} className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-background border shadow-md z-10">
                <X className="h-4 w-4" />
            </Button>
            
            <ScrollArea className="flex-1 p-4 min-h-0" ref={scrollAreaRef}>
              <div className="space-y-4 text-sm">
                {messages.map((msg, index) => (
                  <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? 'justify-end' : '')}>
                    {msg.role === 'bot' && <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-1" />}
                    <div className={cn("p-2.5 rounded-lg", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    {msg.role === 'user' && <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />}
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
