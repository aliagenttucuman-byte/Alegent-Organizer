import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Alert } from 'react-native';
import { CalendarList, LocaleConfig } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { getDB, processAICommand, transcribeAudio } from './AgentLocal';

const { width } = Dimensions.get('window');

// Sistema de logs fuera del componente para capturar todo desde el segundo 0
let globalLogs = [];
const addGlobalLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    globalLogs = [{ id: Date.now() + Math.random(), text: `[${timestamp}] ${msg}` }, ...globalLogs].slice(0, 100);
};

export default function App() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [recording, setRecording] = useState(null);
  const [markedDates, setMarkedDates] = useState({});
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  // Sincronizar logs globales con el estado de la UI
  useEffect(() => {
    const interval = setInterval(() => {
        setLogs([...globalLogs]);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { 
    initSystem();
  }, []);

  const initSystem = async () => {
    addGlobalLog(">>> INICIANDO ALEGENT ORGANIZER <<<");
    try {
        addGlobalLog("Testeando conexión a Internet...");
        await fetch("https://google.com", { method: 'HEAD' });
        addGlobalLog("Internet: OK");
    } catch (e) {
        addGlobalLog("ERROR_RED: Sin acceso a internet.");
    }
    await loadEvents();
  };

  const loadEvents = async () => {
    setLoading(true);
    addGlobalLog("Consultando base de datos...");
    try {
      const db = await getDB();
      const allRows = await db.getAllAsync('SELECT * FROM events ORDER BY start_time ASC');
      addGlobalLog(`Base de datos lista. Eventos: ${allRows.length}`);
      setEvents(allRows);
      
      const now = new Date().toISOString().split('T')[0];
      const marked = {};
      allRows.forEach(e => { marked[e.start_time.split('T')[0]] = { marked: true, dotColor: '#00f2fe' }; });

      if (selectedDate) {
        marked[selectedDate] = { ...marked[selectedDate], selected: true, selectedColor: '#4facfe' };
        setFilteredEvents(allRows.filter(e => e.start_time.startsWith(selectedDate)));
      } else {
        setFilteredEvents(allRows.filter(e => e.start_time >= now));
      }
      setMarkedDates(marked);
    } catch (e) { 
        addGlobalLog(`ERROR_LOAD: ${e.message}`);
    } finally { setLoading(false); }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      addGlobalLog("Grabando voz...");
    } catch (err) { addGlobalLog("Error mic: " + err.message); }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setLoading(true);
    try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        addGlobalLog("Transcribiendo audio (Groq)...");
        const text = await transcribeAudio(uri);
        addGlobalLog(`Voz detectada: "${text}"`);
        await executeAI(text);
    } catch (e) { addGlobalLog("Error audio: " + e.message); setLoading(false); }
  };

  const executeAI = async (text) => {
    if (!text || !text.trim()) return;
    addGlobalLog("Procesando con Minimax...");
    try {
      const db = await getDB();
      const res = await processAICommand(text, events);
      addGlobalLog(`IA OK: ${res.action}`);
      if (res.action === "CREATE") {
        await db.runAsync('INSERT INTO events (summary, start_time, end_time) VALUES (?, ?, ?)', [res.params.summary, res.params.start_time, res.params.end_time]);
      } else if (res.action === "DELETE") {
        await db.runAsync('DELETE FROM events WHERE id = ?', [res.params.id]);
      }
      setMessage('');
      Alert.alert("Alegent", res.response_message);
      await loadEvents();
    } catch (e) { addGlobalLog("AGENT_FAIL: " + e.message); }
    finally { setLoading(false); }
  };

  const renderEvent = ({ item, index }) => (
    <View style={[styles.card, index === 0 && !selectedDate && styles.nextCard]}>
      <LinearGradient colors={index === 0 && !selectedDate ? ['#4facfe', '#00f2fe'] : ['#1e293b', '#0f172a']} style={styles.gradient}>
        <View style={styles.timeBadge}><Text style={styles.time}>{new Date(item.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text></View>
        <View style={{flex: 1, marginLeft: 15}}>
            <Text style={[styles.title, index === 0 && !selectedDate && {color: '#000'}]}>{item.summary.toUpperCase()}</Text>
            <Text style={[styles.date, index === 0 && !selectedDate && {color: '#334155'}]}>{new Date(item.start_time).toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity onPress={async () => { const db = await getDB(); await db.runAsync('DELETE FROM events WHERE id = ?', [item.id]); loadEvents(); }}>
            <Text style={{fontSize: 20}}>🗑️</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>ALEGENT ORGANIZER</Text>
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity onPress={() => { setSelectedDate(null); loadEvents(); }} style={styles.btn}><Text style={styles.btnText}>RELOAD</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLogs(!showLogs)} style={[styles.btn, showLogs && {backgroundColor: '#00f2fe'}]}><Text style={[styles.btnText, showLogs && {color: '#000'}]}>DEBUG</Text></TouchableOpacity>
          </View>
        </View>

        {!showLogs ? (
          <>
            <CalendarList horizontal pagingEnabled calendarWidth={width} markedDates={markedDates} onDayPress={(day) => { setSelectedDate(day.dateString); loadEvents(); }} theme={{ backgroundColor: '#020617', calendarBackground: '#020617', selectedDayBackgroundColor: '#4facfe', todayTextColor: '#00f2fe', dayTextColor: '#cbd5e1', monthTextColor: '#00f2fe' }} />
            <FlatList data={filteredEvents} keyExtractor={(item) => item.id.toString()} renderItem={renderEvent} contentContainerStyle={{padding: 20}} ListEmptyComponent={<Text style={styles.empty}>SIN REUNIONES</Text>} />
          </>
        ) : (
          <View style={styles.consoleContainer}>
             <TouchableOpacity onPress={() => { globalLogs = []; setLogs([]); }} style={styles.clearBtn}><Text style={styles.clearText}>CLEAR 🗑️</Text></TouchableOpacity>
             <ScrollView style={styles.console}>{logs.map(l => <Text key={l.id} style={styles.logText}>{l.text}</Text>)}</ScrollView>
          </View>
        )}

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={120} style={styles.inputArea}>
          <View style={styles.inputBox}>
            <TextInput style={styles.input} placeholder="AGENDAR..." placeholderTextColor="#475569" value={message} onChangeText={setMessage} onSubmitEditing={() => executeAI(message)} />
            <TouchableOpacity onPressIn={startRecording} onPressOut={stopRecording} style={[styles.mic, recording && {backgroundColor: '#ef4444'}]}>
                <Text style={{fontSize: 20}}>{recording ? '⚡' : '🎙️'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => executeAI(message)} style={styles.exec}><Text style={styles.execText}>EXEC</Text></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
        {loading && <ActivityIndicator size="large" color="#00f2fe" style={styles.loader} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  logo: { color: '#00f2fe', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  btn: { backgroundColor: '#1e293b', padding: 8, borderRadius: 8, marginLeft: 8 },
  btnText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  card: { marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b' },
  nextCard: { borderColor: '#4facfe', borderWidth: 2 },
  gradient: { padding: 15, flexDirection: 'row', alignItems: 'center' },
  timeBadge: { backgroundColor: '#00f2fe15', padding: 8, borderRadius: 8 },
  time: { color: '#00f2fe', fontWeight: 'bold', fontSize: 12 },
  title: { color: '#f8fafc', fontWeight: 'bold', fontSize: 14 },
  date: { color: '#64748b', fontSize: 11 },
  inputArea: { padding: 25, backgroundColor: '#0f172a' },
  inputBox: { flexDirection: 'row', backgroundColor: '#020617', borderRadius: 15, borderWidth: 1, borderColor: '#334155', alignItems: 'center', paddingRight: 5, height: 55 },
  input: { flex: 1, color: '#00f2fe', padding: 15, fontWeight: 'bold' },
  mic: { width: 45, height: 45, borderRadius: 22, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', marginRight: 5 },
  exec: { backgroundColor: '#4facfe', padding: 10, borderRadius: 10 },
  execText: { color: '#020617', fontWeight: '900', fontSize: 10 },
  consoleContainer: { flex: 1, backgroundColor: '#000', padding: 10 },
  clearBtn: { alignSelf: 'flex-end', backgroundColor: '#334155', padding: 5, borderRadius: 5, marginBottom: 5 },
  clearText: { color: 'white', fontSize: 10 },
  console: { flex: 1 },
  logText: { color: '#22c55e', fontSize: 10, fontFamily: 'monospace', marginBottom: 5 },
  loader: { position: 'absolute', top: '50%', left: '45%' },
  empty: { color: '#475569', textAlign: 'center', marginTop: 50 }
});
