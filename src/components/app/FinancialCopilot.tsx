
'use client';

import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bot, User, Loader2, ArrowUp, X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useForecast } from '@/context/ForecastContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';


interface Message {
  role: 'user' | 'bot';
  text: string;
}

const CollapsedBar = ({ onOpen }: { onOpen: () => void }) => (
    <div 
        className="fixed bottom-4 left-4 md:left-[84px] w-[calc(100%-32px)] md:w-1/2 max-w-lg h-14 bg-card border rounded-xl shadow-lg flex items-center p-3 gap-3 cursor-pointer hover:shadow-xl transition-shadow duration-300 animate-in fade-in slide-in-from-bottom-5"
        onClick={onOpen}
    >
        <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot size={20} />
            </AvatarFallback>
        </Avatar>
        <p className="text-sm text-muted-foreground">
           Hi — I’m your Financial Co-Pilot. Ask me anything about these numbers.
        </p>
    </div>
);


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
    return <CollapsedBar onOpen={() => setIsCopilotOpen(true)} />;
  }
  
  return (
    <Sheet open={isCopilotOpen} onOpenChange={setIsCopilotOpen}>
        <SheetContent 
            side="bottom" 
            className="h-[60vh] md:h-[70vh] w-full md:w-1/2 max-w-2xl mx-auto rounded-t-2xl border-t-4 border-primary p-0 flex flex-col"
        >
             <SheetHeader className="p-4 border-b flex-row items-center justify-between">
                <SheetTitle className="flex items-center gap-2">
                    <Bot size={20} /> Financial Copilot
                </SheetTitle>
                 <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close</span>
                    </Button>
                 </SheetClose>
             </SheetHeader>
             <ScrollArea className="flex-1" ref={scrollAreaRef}>
                  <div className="space-y-4 p-4">
                    {messages.length === 0 && !isLoading && (
                        <Card className="bg-muted border-dashed h-full">
                            <CardHeader>
                                <CardTitle className="text-lg">Welcome!</CardTitle>
                                <CardDescription>Ask me anything about your forecast or for UI improvements.</CardDescription>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                <p>For example, you can ask:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>"Review my fixed costs for any issues."</li>
                                    <li>"Are my product margins realistic?"</li>
                                    <li>"How can I make this page clearer?"</li>
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                    {messages.map((msg, index) => (
                      <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'bot' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                        <div className={`p-3 rounded-lg max-w-sm text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
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
                <div className="p-4 border-t bg-background">
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
        </SheetContent>
    </Sheet>
  );
}
