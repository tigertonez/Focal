
'use client';

import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Bot, User, Loader2, Wand2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useForecast } from '@/context/ForecastContext';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export function FinancialCopilot() {
  const [isOpen, setIsOpen] = useState(false);
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
    }
  }, [proactiveAnalysis, messages.length]);

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
      setTimeout(() => {
        scrollAreaRef.current?.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };
  
  const handleSheetOpen = (open: boolean) => {
    setIsOpen(open);
    if(open && proactiveAnalysis) {
        setProactiveAnalysis(null); // Clear the badge when opened
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50" size="icon">
          <Wand2 className="h-6 w-6" />
          {proactiveAnalysis && (
            <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-destructive border-2 border-background" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-3/4 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bot />
            Financial Copilot
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'bot' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                <div className={`p-3 rounded-lg max-w-lg ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
                 {msg.sender === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
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
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your forecast..."
              className="pr-20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              onClick={() => handleSendMessage()}
              disabled={isLoading}
            >
              Ask
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
