import * as SQLite from 'expo-sqlite';
import axios from 'axios';
import { Platform } from 'react-native';

const OPENROUTER_API_KEY = "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";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

export const transcribeAudio = async (uri) => {
    const formData = new FormData();
    formData.append('file', { uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''), type: 'audio/m4a', name: 'recording.m4a' });
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'es');
    try {
        const response = await axios.post(GROQ_URL, formData, { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'multipart/form-data' }, timeout: 15000 });
        return response.data.text;
    } catch (e) { throw new Error("Audio Error: " + (e.response?.data?.error?.message || e.message)); }
};

let dbInstance = null;
export const getDB = async () => {
    if (dbInstance) return dbInstance;
    dbInstance = await SQLite.openDatabaseAsync('aliagent_db');
    await new Promise(r => setTimeout(r, 300));
    await dbInstance.execAsync("CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, summary TEXT, start_time TEXT, end_time TEXT);");
    return dbInstance;
};

export const processAICommand = async (userMessage, currentEvents) => {
    const systemPrompt = `Eres un asistente de agenda. Fecha: ${new Date().toLocaleString()}. Agenda: ${JSON.stringify(currentEvents)}. Responde SOLO JSON: {"action": "CREATE"|"DELETE"|"TALK", "params": {"summary", "start_time", "end_time", "id"}, "response_message": "..."}`;

    try {
        const { data } = await axios.post(OPENROUTER_URL, {
            model: "minimax/minimax-m2.5:free",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMessage }],
            temperature: 0.1
        }, {
            headers: { 
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://alegent.app', // Obligatorio para algunos providers
                'X-Title': 'Alegent Organizer'
            },
            timeout: 30000 // Aumentamos a 30 segundos
        });

        if (!data.choices || data.choices.length === 0) throw new Error("IA no devolvió opciones.");

        let content = data.choices[0].message.content.trim();
        
        // Limpieza quirúrgica de JSON
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error("IA no respondió en formato JSON.");
        
        return JSON.parse(content.substring(start, end + 1));
    } catch (e) {
        const errorDetail = e.response ? JSON.stringify(e.response.data.error || e.response.data) : e.message;
        console.error("AGENT_FAIL:", errorDetail);
        throw new Error(`Fallo de conexión: ${errorDetail}`);
    }
};
