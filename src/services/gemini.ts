import { GoogleGenAI, Type } from "@google/genai";
import { Song } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 5 songs matching these criteria:
      Topic/Mood: "${preferences}"
      ${artistContext}
      ${filterContext ? `Filters: ${filterContext}` : ""}
      ${historyContext}
      Use the history and favorite artists to refine the style but prioritize the specified preferences and filters.
      For each song, provide a short "reason" (e.g., "Classic ${genre} track from ${year}", "Matches your interest in lo-fi beats").
      Return only a JSON array of objects with "title", "artist", "album", "reason", "genre", and "releaseDate".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              artist: { type: Type.STRING },
              album: { type: Type.STRING },
              reason: { type: Type.STRING },
              genre: { type: Type.STRING },
              releaseDate: { type: Type.STRING }
            },
            required: ["title", "artist", "album", "reason", "genre", "releaseDate"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}

export async function getSongLyrics(title: string, artist: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide the lyrics for the song "${title}" by "${artist}". 
      Return only the lyrics text without any additional commentary. 
      If you can't find them, return "Lyrics not found available for this song."`,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Lyrics Error:", error);
    return "Error fetching lyrics.";
  }
}

export async function getAuraChat(message: string, currentSong: Song | null, history: Song[] = [], userArtists: string[] = []): Promise<string> {
  const songContext = currentSong 
    ? `The user is currently listening to "${currentSong.title}" by "${currentSong.artist}" from the album "${currentSong.album}".`
    : "No song is currently playing.";
    
  const artistContext = userArtists.length > 0
    ? `The user's favorite artists are: ${userArtists.join(", ")}.`
    : "";

  const historyContext = history.length > 0
    ? `User's recent history includes: ${history.slice(0, 5).map(s => `"${s.title}" by ${s.artist}`).join(", ")}.`
    : "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: `You are Aura, an elite music assistant for the "Melodify" music app. 
        You are sophisticated, knowledgeable, and passionate about music history, theory, and culture.
        Context: ${songContext} ${artistContext} ${historyContext}
        Keep your responses concise, engaging, and focused on the music. 
        If asked for recommendations, use the context to provide high-quality suggestions.`
      }
    });

    return response.text;
  } catch (error) {
    console.error("Aura Chat Error:", error);
    return "I'm having trouble connecting to my musical database right now. Let's keep the music playing!";
  }
}

export async function getSongMetadataFromUrl(url: string): Promise<Partial<Song>> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract song metadata (Title, Artist, Album, Genre, Year) from this YouTube URL: ${url}. 
      If you can't be certain, make an educated guess based on common video titles for this song.
      Return only as a JSON object with keys: "title", "artist", "album", "genre", "releaseDate".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            album: { type: Type.STRING },
            genre: { type: Type.STRING },
            releaseDate: { type: Type.STRING }
          },
          required: ["title", "artist", "album", "genre", "releaseDate"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Metadata Error:", error);
    return {};
  }
}
