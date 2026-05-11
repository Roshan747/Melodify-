import Groq from 'groq-sdk';
import { Song } from '../types';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

export async function getRecommendedSongs(preferences: string, history: Song[] = [], genre?: string, year?: string, userArtists: string[] = []): Promise<(Partial<Song> & { reason: string })[]> {
  const historyContext = history.length > 0 
    ? `User's recent history: ${history.map(s => `${s.title} by ${s.artist}`).join(", ")}.`
    : "";
    
  const artistContext = userArtists.length > 0
    ? `The user's favorite artists are: ${userArtists.join(", ")}.`
    : "";

  const filterContext = [
    genre ? `Genre: ${genre}` : null,
    year ? `Release Year: ${year}` : null
  ].filter(Boolean).join(", ");

  try {
    const message = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Suggest 5 songs matching these criteria:
Topic/Mood: "${preferences}"
${artistContext}
${filterContext ? `Filters: ${filterContext}` : ""}
${historyContext}
Use the history and favorite artists to refine the style but prioritize the specified preferences and filters.
For each song, provide a short "reason" (e.g., "Classic ${genre} track from ${year}", "Matches your interest in lo-fi beats").
Return ONLY a JSON array of objects with "title", "artist", "album", "reason", "genre", and "releaseDate". No other text.
Example format: [{"title":"Song Name","artist":"Artist Name","album":"Album Name","reason":"Why recommended","genre":"Genre","releaseDate":"YYYY-MM-DD"}]`
        }
      ]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      let jsonText = content.text;
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      return JSON.parse(jsonText);
    }
    return [];
  } catch (error) {
    console.error("Groq Error:", error);
    return [];
  }
}

export async function getSongLyrics(title: string, artist: string): Promise<string> {
  try {
    const message = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Provide the lyrics for the song "${title}" by "${artist}". 
Return only the lyrics text without any additional commentary. 
If you can't find them, return "Lyrics not available for this song."`
        }
      ]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    return "Error fetching lyrics.";
  } catch (error) {
    console.error("Groq Lyrics Error:", error);
    return "Error fetching lyrics.";
  }
}

export async function getAuraXChat(
  message: string, 
  chatHistory: { role: 'user' | 'auraX', text: string }[],
  currentSong: Song | null, 
  songHistory: Song[] = [], 
  userArtists: string[] = []
): Promise<string> {
  const songContext = currentSong 
    ? `The user is currently listening to "${currentSong.title}" by "${currentSong.artist}" from the album "${currentSong.album}".`
    : "No song is currently playing.";
    
  const artistContext = userArtists.length > 0
    ? `The user's favorite artists are: ${userArtists.join(", ")}.`
    : "";

  const historyContext = songHistory.length > 0
    ? `Recent listening history: ${songHistory.map(s => `${s.title} by ${s.artist}`).join(", ")}.`
    : "";

  try {
    const messages = [
      ...chatHistory.map((msg) => ({
        role: msg.role === 'auraX' ? 'assistant' as const : 'user' as const,
        content: msg.text
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    const response = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 512,
      messages: messages,
      system: `You are Vinnu AI, a musical co-pilot for the Melodify music streaming app. You're helpful, friendly, and knowledgeable about music.
${songContext}
${artistContext}
${historyContext}
Respond with insights about music, recommendations, and engaging conversation. Keep responses concise and musical.`
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    return "I'm thinking about that...";
  } catch (error) {
    console.error("Groq Chat Error:", error);
    return "I'm having trouble thinking right now. Try again!";
  }
}

export async function getSongMetadataFromUrl(url: string): Promise<{ title?: string; artist?: string }> {
  try {
    const message = await groq.messages.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `Extract the song title and artist from this YouTube URL: ${url}
Look at typical YouTube URL formats and patterns. If you can determine the song title and artist, return JSON: {"title":"Song Title","artist":"Artist Name"}
If you cannot determine, return: {"title":"","artist":""}
Return ONLY valid JSON, no other text.`
        }
      ]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      try {
        return JSON.parse(content.text);
      } catch {
        return {};
      }
    }
    return {};
  } catch (error) {
    console.error("Groq Metadata Error:", error);
    return {};
  }
}
