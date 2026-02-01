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
            youtubeId: { type: Type.STRING, description: "The 11-character YouTube Video ID for this song (e.g., 'dQw4w9WgXcQ'). Look for official audio or music video." },
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
        const json = JSON.parse(response.text || "{}");
        return json.lyrics || "Lyrics not available.";
    } catch (e) {
        return "Could not load lyrics at this time.";
    }
}

export const generateSmartPlaylist = async (
  mood: string,
  availableSongs: Song[]
): Promise<{ playlistName: string; description: string; songs: Song[] }> => {
  
  const songDbString = availableSongs.map(s => `ID: ${s.id}, Title: "${s.title}", Artist: "${s.artist}"`).join('\n');

  const prompt = `
    I have a local music database:
    ${songDbString}

    User Request: "${mood}".
    
    1. Search via Google to find relevant songs. 
    2. IMPORTANT: For each song, find the specific **YouTube Video ID** (11 characters) for the official audio or music video.
    3. Construct a playlist of 3-8 songs.
    4. Check existing database match.
    
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

    const result = JSON.parse(response.text || "{}");
    
    // Process songs
    const processedSongs = result.songs.map((item: any, index: number) => {
        if (item.existingId) {
            return availableSongs.find(s => s.id === item.existingId);
        } else {
            // New song found on YouTube
            const yId = item.youtubeId || "dQw4w9WgXcQ"; // Fallback to safe ID if missing
            return {
                id: `ai_yt_${yId}_${index}`,
                title: item.title,
                artist: item.artist,
                album: "YouTube Music",
                // Use YouTube Thumbnail as cover
                coverUrl: `https://i.ytimg.com/vi/${yId}/maxresdefault.jpg`,
                youtubeId: yId,
                duration: 200, // Default approximate, player will update this
                color: '#ff0000',
                genre: item.genre || 'Pop',
                lyrics: undefined
            } as Song;
        }
    }).filter((s: Song | undefined) => s !== undefined);

    return {
        playlistName: result.playlistName,
        description: result.description,
        songs: processedSongs
    };

  } catch (error) {
    console.error("AI Error:", error);
    return {
      playlistName: `Mix: ${mood}`,
      description: "Offline fallback mix.",
      songs: availableSongs.slice(0, 5)
    };
  }
};