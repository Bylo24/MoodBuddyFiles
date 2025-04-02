import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';
import { FALLBACK_QUOTES } from '../data/fallbackQuotes';

// Keep track of used quotes globally (across component instances)
let usedQuotes = new Set<string>();

export default function QuoteComponent() {
  const [quote, setQuote] = useState("");
  
  useEffect(() => {
    // Immediately show a fallback quote
    const fallbackQuote = getRandomFallbackQuote();
    setQuote(fallbackQuote);
    
    // Fetch a new quote in the background after a delay
    const timerId = setTimeout(() => {
      import('axios').then(({ default: axios }) => {
        fetchQuote(axios);
      });
    }, 2000);
    
    return () => clearTimeout(timerId);
  }, []);
  
  const getRandomFallbackQuote = () => {
    // Filter out used quotes
    const availableQuotes = FALLBACK_QUOTES.filter(q => !usedQuotes.has(q));
    
    // If all quotes have been used, reset the tracking
    if (availableQuotes.length === 0) {
      // Keep the last 5 used quotes to avoid immediate repetition
      const lastUsed = Array.from(usedQuotes).slice(-5);
      usedQuotes = new Set(lastUsed);
      return getRandomQuote(FALLBACK_QUOTES.filter(q => !usedQuotes.has(q)));
    }
    
    return getRandomQuote(availableQuotes);
  };
  
  const getRandomQuote = (quotes: string[]) => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const selectedQuote = quotes[randomIndex];
    
    // Add to used quotes set
    usedQuotes.add(selectedQuote);
    
    return selectedQuote;
  };
  
  const fetchQuote = async (axios: any) => {
    try {
      // API details
      const API_KEY = 'AIzaSyDUUxDUGBZjshZvXL20WAcK3Xy3HvJBCw8';
      const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
      
      // Add a timestamp to ensure we get a different response each time
      const timestamp = new Date().getTime();
      const prompt = `give me a short inspirational quote about mental health or wellness. Just provide the quote itself without attribution or explanation. Keep it under 2 sentences. Make it unique and different from common quotes. Timestamp: ${timestamp}`;
      
      const response = await axios({
        method: 'post',
        url: `${API_URL}?key=${API_KEY}`,
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 1.0,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100,
          }
        },
        timeout: 5000
      });
      
      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const responseText = response.data.candidates[0].content.parts[0].text;
        const extractedQuote = extractQuote(responseText);
        
        if (extractedQuote && !usedQuotes.has(extractedQuote)) {
          setQuote(extractedQuote);
          usedQuotes.add(extractedQuote);
        }
      }
    } catch (error) {
      // Already showing fallback quote, so no need to handle error
      console.log('Error fetching quote, using fallback:', error);
    }
  };
  
  const extractQuote = (text: string): string => {
    // Clean up the text
    const cleanText = text
      .replace(/^[\"']|[\"']$/g, '') // Remove quotes at beginning/end
      .replace(/\n+/g, ' ') // Replace multiple newlines with space
      .trim();
    
    // Try to extract just the quote part (without author)
    const patterns = [
      // Bold markdown: Quote **Author**
      /^(.*?)\s*\*\*.*?\*\*\s*$/,
      // Quote - Author
      /^(.*?)\s*[-–—].*?$/,
      // "Quote" - Author
      /^[\"'](.+?)[\"']\s*[-–—].*?$/,
      // Quote by Author
      /^(.*?)\s+by\s+.*?$/i,
      // Quote from Author
      /^(.*?)\s+from\s+.*?$/i,
    ];
    
    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/^[\"']|[\"']$/g, '');
      }
    }
    
    // If no pattern matches, check if there's a dash anywhere
    const dashIndex = cleanText.lastIndexOf('-');
    if (dashIndex > 0) {
      return cleanText.substring(0, dashIndex).trim();
    }
    
    // Return the whole text if we can't extract just the quote
    return cleanText;
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.quoteIcon}>"</Text>
      <Text style={styles.quote}>{quote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.primary + '22', // 13% opacity
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    position: 'relative',
    minHeight: 80,
  },
  quoteIcon: {
    fontSize: 32,
    color: theme.colors.primary,
    position: 'absolute',
    top: 4,
    left: 10,
    opacity: 0.3,
  },
  quote: {
    fontSize: 15,
    fontWeight: theme.fontWeights.medium,
    color: theme.colors.text,
    fontStyle: 'italic',
    lineHeight: 22,
    textAlign: 'center',
  },
});
