"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Copy, Check, BookOpen, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Phrase {
  es: string;
  en: string;
  category?: string;
}

const QUICK_PHRASES: Phrase[] = [
  // Introductions
  { es: "Me llamo", en: "My name is", category: "Introductions" },
  { es: "Mi Nombre es", en: "My name is", category: "Introductions" },
  { es: "Hola, soy Markus", en: "Hi, I'm Markus", category: "Introductions" },
  { es: "¿Cómo te llamas?", en: "What is your name?", category: "Introductions" },
  { es: "(Yo) tengo … años", en: "I am … years old", category: "Introductions" },
  { es: "(Yo) soy de…", en: "I come from…", category: "Introductions" },
  
  // Greetings
  { es: "Buenos días", en: "Good morning", category: "Greetings" },
  { es: "Buenas tardes", en: "Good afternoon", category: "Greetings" },
  { es: "Buenas noches", en: "Good evening / Good night", category: "Greetings" },
  { es: "¿Cómo está usted?", en: "How are you? (formal)", category: "Greetings" },
  { es: "¿Cómo estás?", en: "How are you? (informal)", category: "Greetings" },
  { es: "¿Qué tal?", en: "How are you? (informal) / What's up?", category: "Greetings" },
  { es: "¿Cómo te va?", en: "How's it going?", category: "Greetings" },
  { es: "¿Qué haces?", en: "What are you doing?", category: "Greetings" },
  { es: "¿Qué pasa?", en: "What's happening?", category: "Greetings" },
  { es: "Bien, gracias", en: "Good, thank you", category: "Greetings" },
  { es: "Muy bien", en: "Very well", category: "Greetings" },
  { es: "Así, así", en: "So, so", category: "Greetings" },
  { es: "Como siempre", en: "As always", category: "Greetings" },
  { es: "¿Y tú?", en: "And you?", category: "Greetings" },
  
  // Polite Expressions
  { es: "¡Gracias!", en: "Thank you!", category: "Polite" },
  { es: "¡Muchas gracias!", en: "Thank you very much!", category: "Polite" },
  { es: "¡De nada!", en: "You're welcome! / No problem!", category: "Polite" },
  { es: "Por favor", en: "Please", category: "Polite" },
  { es: "¡Perdón!", en: "Excuse me!", category: "Polite" },
  { es: "¡Disculpe!", en: "Excuse me!", category: "Polite" },
  { es: "¡Lo siento!", en: "Sorry!", category: "Polite" },
  { es: "¡Sin problema!", en: "No problem!", category: "Polite" },
  
  // Question Words
  { es: "¿Qué…?", en: "What?", category: "Questions" },
  { es: "¿Quién…?", en: "Who?", category: "Questions" },
  { es: "¿Cuándo…?", en: "When?", category: "Questions" },
  { es: "¿Dónde…?", en: "Where?", category: "Questions" },
  { es: "¿Por qué…?", en: "Why?", category: "Questions" },
  { es: "¿Cuál?", en: "Which?", category: "Questions" },
  { es: "¿Cómo…?", en: "How?", category: "Questions" },
  
  // Common Questions
  { es: "¿Qué hora tienes?", en: "What time is it?", category: "Common Questions" },
  { es: "¿De dónde viene?", en: "Where are you from?", category: "Common Questions" },
  { es: "¿Dónde vives?", en: "Where do you live?", category: "Common Questions" },
  { es: "¿Puede ayudarme?", en: "Can you help me?", category: "Common Questions" },
  { es: "¿Podría ayudarle?", en: "Can I help you?", category: "Common Questions" },
  { es: "¿Cuánto cuesta eso?", en: "How much does it cost?", category: "Common Questions" },
  { es: "¿Entiende?", en: "Do you understand?", category: "Common Questions" },
  { es: "¡Puede repetirlo!", en: "Can you say that again?", category: "Common Questions" },
  { es: "¿Qué significa [word]?", en: "What does [word] mean?", category: "Common Questions" },
  { es: "¿Puedes hablar más despacio?", en: "Can you speak slowly?", category: "Common Questions" },
  { es: "¿Dónde puedo encontrar un taxi?", en: "Where can I find a taxi?", category: "Common Questions" },
  { es: "¿Dónde está [hotel's name] hotel?", en: "Where is [hotel's name] hotel?", category: "Common Questions" },
  
  // Answers
  { es: "Sí", en: "Yes", category: "Answers" },
  { es: "No", en: "No", category: "Answers" },
  { es: "Tal vez", en: "Maybe", category: "Answers" },
  { es: "Siempre", en: "Always", category: "Answers" },
  { es: "Nunca", en: "Never", category: "Answers" },
  { es: "Claro", en: "Of course", category: "Answers" },
  { es: "No entiendo", en: "I don't understand!", category: "Answers" },
  { es: "No (lo) sé", en: "I don't know!", category: "Answers" },
  { es: "No tengo ni idea", en: "I have no idea!", category: "Answers" },
  { es: "No hablo español", en: "I don't speak Spanish", category: "Answers" },
  { es: "Estoy perdido", en: "I'm lost", category: "Answers" },
  { es: "Mi español es malo", en: "My Spanish is bad", category: "Answers" },
];

export function QuickPhrasesPanel() {
  const [search, setSearch] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const filteredPhrases = QUICK_PHRASES.filter(
    (phrase) =>
      phrase.es.toLowerCase().includes(search.toLowerCase()) ||
      phrase.en.toLowerCase().includes(search.toLowerCase()) ||
      phrase.category?.toLowerCase().includes(search.toLowerCase())
  );

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({
      title: "Copied!",
      description: `"${text}" copied to clipboard`,
    });
  };

  // Group by category
  const groupedPhrases = filteredPhrases.reduce((acc, phrase) => {
    const category = phrase.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(phrase);
    return acc;
  }, {} as Record<string, typeof filteredPhrases>);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="lg" className="w-full justify-start bg-background text-[#FFF5EE] border border-border hover:bg-[#B2E0E6] hover:text-[#001F3F]">
          <BookOpen className="h-4 w-4 mr-2" /> Quick Phrases
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[90vw] sm:w-[400px] p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <SheetTitle>Quick Phrases</SheetTitle>
          <SheetDescription>
            {QUICK_PHRASES.length} Spanish/English phrases - tap to copy
          </SheetDescription>
        </SheetHeader>
        
        <div className="p-4 pb-2">
          <div className="relative">
            <Input
              placeholder="Search phrases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-8"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)] px-4">
          <div className="space-y-4 pb-4">
            {Object.entries(groupedPhrases).map(([category, phrases]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 sticky top-0 bg-background py-1">
                  {category}
                </h3>
                <div className="space-y-2">
                  {phrases.map((phrase, index) => {
                    const globalIndex = QUICK_PHRASES.indexOf(phrase);
                    return (
                      <div
                        key={globalIndex}
                        className="border border-border rounded-lg p-3 bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{phrase.es}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => copyToClipboard(phrase.es, globalIndex * 2)}
                          >
                            {copiedIndex === globalIndex * 2 ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">{phrase.en}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => copyToClipboard(phrase.en, globalIndex * 2 + 1)}
                          >
                            {copiedIndex === globalIndex * 2 + 1 ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
