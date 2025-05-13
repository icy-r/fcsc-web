//fetch content from md file based on passed file name that is inside data folder
import fs from 'fs/promises';
import { marked } from 'marked';

// Function to parse YAML frontmatter
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return {
      frontmatter: null,
      content: content
    };
  }
  
  const frontmatterStr = match[1];
  const markdownContent = match[2];
  
  // Simple YAML parser for our specific needs
  const frontmatter = {};
  const lines = frontmatterStr.split('\n');
  
  let currentKey = null;
  let currentArray = null;
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Check if this is a new key
    if (!line.startsWith('  ')) {
      const [key, value] = line.split(':').map(s => s.trim());
      
      // If the value is empty, this might be the start of an array
      if (!value) {
        currentKey = key;
        frontmatter[currentKey] = [];
        currentArray = frontmatter[currentKey];
      } else {
        frontmatter[key] = value.replace(/^"(.*)"$/, '$1'); // Remove quotes if present
        currentKey = null;
        currentArray = null;
      }
    } 
    // This is an array item
    else if (line.startsWith('  - ') && currentArray) {
      const item = {};
      const itemContent = line.substring(4); // Remove '  - '
      
      // If this is a simple array item
      if (!itemContent.includes(':')) {
        currentArray.push(itemContent);
      } 
      // This is the start of an object in the array
      else {
        const [key, value] = itemContent.split(':').map(s => s.trim());
        item[key] = value.replace(/^"(.*)"$/, '$1'); // Remove quotes if present
        currentArray.push(item);
      }
    }
    // This is a property of an object in the array
    else if (line.startsWith('    ') && currentArray && currentArray.length > 0) {
      const lastItem = currentArray[currentArray.length - 1];
      const [key, value] = line.substring(4).split(':').map(s => s.trim());
      lastItem[key] = value.replace(/^"(.*)"$/, '$1'); // Remove quotes if present
    }
  }
  
  return {
    frontmatter,
    content: markdownContent
  };
}

// Helper function to sort events by date
function sortEventsByDate(events, ascending = true) {
    return [...events].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return ascending ? dateA - dateB : dateB - dateA;
    });
}

// Helper function to filter events by date
function filterEventsByDate(events, options = {}) {
    const { past = false, upcoming = true, limit = null } = options;
    const now = new Date();
    
    let filteredEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        if (upcoming && eventDate >= now) return true;
        if (past && eventDate < now) return true;
        return false;
    });
    
    // Sort events: upcoming events in ascending order, past events in descending order
    filteredEvents = sortEventsByDate(filteredEvents, upcoming);
    
    // Apply limit if specified
    if (limit && typeof limit === 'number') {
        filteredEvents = filteredEvents.slice(0, limit);
    }
    
    return filteredEvents;
}

// Fetch events with various options
export async function fetchEvents(options = {}) {
    try {
        const eventsData = await fetchContent('events', 'data');
        
        if (!eventsData || !eventsData.events || !Array.isArray(eventsData.events)) {
            return [];
        }
        
        return filterEventsByDate(eventsData.events, options);
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}

export async function fetchContent(fileName, returnFormat = 'html') {
    try {
        const filePath = `./src/data/${fileName}.md`;
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        // Parse frontmatter if present
        const { frontmatter, content } = parseFrontmatter(fileContent);

        // For marquee specifically, we want to format the content differently
        if (fileName === 'marquee') {
            // Convert markdown to HTML
            const htmlContent = marked.parse(content || fileContent);
            
            // Replace list items with a separator for marquee display
            const formattedContent = htmlContent
                .replace(/<\/?ol>/g, '') // Remove ordered list tags
                .replace(/<li>/g, '<span class="marquee-item">') // Replace opening li tags
                .replace(/<\/li>/g, '</span> <span class="marquee-separator">|</span> '); // Replace closing li tags with separator
            
            return formattedContent;
        }
        
        // If we want the structured data (frontmatter)
        if (returnFormat === 'data' && frontmatter) {
            return frontmatter;
        }
        
        // For other content, just convert markdown to HTML
        const htmlContent = marked.parse(content || fileContent);
        return htmlContent;
    } catch (error) {
        console.error(`Error reading file ${fileName}.md:`, error);
        return 'Content not available';
    }
}
