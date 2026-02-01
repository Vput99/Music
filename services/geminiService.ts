import { GoogleGenAI, Type } from "@google/genai";
import { Song } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const playlistSchema = {
  type: Type.OBJECT,
  properties: {
    playlistName: { type: Type.STRING },
    description: { type: Type.STRING },
    songs: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            artist: { type: Type.STRING },
            genre: { type: Type.STRING },
            youtubeId: { type: Type.STRING, description: "The 11-character YouTube Video ID (e.g., 'dQw4w9WgXcQ')." },
            existingId: { type: Type.STRING },
            isNewDiscovery: { type: Type.BOOLEAN }
        },
        required: ["title", "artist", "genre", "youtubeId", "isNewDiscovery"]
      },
    },
  },
  required: ["playlistName", "description", "songs"],
};

const lyricsSchema = {
    type: Type.OBJECT,
    properties: {
        lyrics: { type: Type.STRING, description: "The lyrics of the song formatted with line breaks." }
    },
    required: ["lyrics"]
};

const cleanJson = (text: string) => {
    if (!text) return "{}";
    // Remove markdown code blocks if present (```json ... ```)
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const generateLyrics = async (title: string, artist: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Generate the lyrics for the song "${title}" by "${artist}". Return plain text with line breaks.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: lyricsSchema
            }
        });
        const json = JSON.parse(cleanJson(response.text || "{}"));
        return json.lyrics || "Lyrics not available.";
    } catch (e) {
        console.error("Lyrics generation error:", e);
        return "Could not load lyrics at this time.";
    }
}

export const generateSmartPlaylist = async (
  mood: string,
  availableSongs: Song[]
): Promise<{ playlistName: string; description: string; songs: Song[] }> => {
  
  // Simplify context to reduce token usage and confusion
  const songDbString = availableSongs.map(s => `${s.id}:${s.title}-${s.artist}`).join(', ');

  const prompt = `
    User Request: "${mood}".
    Local DB: [${songDbString}]
    
    1. Search via Google to find relevant songs for the mood/request.
    2. IMPORTANT: For each song, identify the 11-character YouTube Video ID for the official audio/video.
    3. Construct a playlist of 5-10 songs.
    4. If a song matches the Local DB, use its 'existingId'.
    
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: playlistSchema,
      },
    });

    const text = cleanJson(response.text || "{}");
    const result = JSON.parse(text);
    
    // Process songs
    const processedSongs = (result.songs || []).map((item: any, index: number) => {
        if (item.existingId && availableSongs.find(s => s.id === item.existingId)) {
            return availableSongs.find(s => s.id === item.existingId);
        } else {
            // New song found on YouTube
            const yId = item.youtubeId || "dQw4w9WgXcQ"; // Fallback ID
            return {
                id: `ai_yt_${yId}_${Date.now()}_${index}`,
                title: item.title,
                artist: item.artist,
                album: "YouTube Music",
                // Use YouTube Thumbnail as cover
                coverUrl: `https://i.ytimg.com/vi/${yId}/maxresdefault.jpg`,
                youtubeId: yId,
                duration: 180, // Estimate
                color: '#8b5cf6', // Violet default
                genre: item.genre || 'Pop',
            } as Song;
        }
    }).filter((s: Song | undefined) => s !== undefined);

    return {
        playlistName: result.playlistName || `Mix: ${mood}`,
        description: result.description || "AI Curated Playlist",
        songs: processedSongs
    };

  } catch (error) {
    console.error("AI Playlist Error:", error);
    // Fallback to a shuffled local list + alert
    const shuffled = [...availableSongs].sort(() => 0.5 - Math.random());
    return {
      playlistName: `Offline Mix: ${mood}`,
      description: "Could not connect to AI. Enjoy this local mix instead.",
      songs: shuffled.slice(0, 5)
    };
  }
};