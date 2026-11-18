import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteTask, getTasks, insertTask, toggleComplete, type Task } from '@/db/database';

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const locked = useRef(false);

  const refresh = useCallback(async (change?: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await change?.();
      setTasks(await getTasks());
    } catch {
      setError('Tapşırıqlara müraciət zamanı xəta baş verdi.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getTasks()
      .then(rows => { if (active) setTasks(rows); })
      .catch(() => { if (active) setError('Tapşırıqları yükləmək mümkün olmadı.'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  function add() {
    const value = title.trim();
    if (value) void refresh(async () => {
      await insertTask(value);
      setTitle('');
    });
  }

  return (
    <SafeAreaView style={styles.page}>
      <Text style={styles.heading}>Tapşırıqlarım</Text>
      <TextInput accessibilityLabel="Yeni tapşırıq" placeholder="Yeni tapşırıq" placeholderTextColor="#637168"
        value={title} onChangeText={setTitle} onSubmitEditing={add} editable={!busy} style={styles.input} />
      <Button title="Əlavə et" onPress={add} disabled={busy || !title.trim()} />
      {error ? <View><Text accessibilityRole="alert">{error}</Text><Button title="Yenilə" onPress={() => void refresh()} /></View> : null}
      <FlatList data={tasks} keyExtractor={item => String(item.id)} keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text>{busy ? 'Yüklənir…' : error ? '' : 'Hələ tapşırıq yoxdur.'}</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable style={styles.task} accessibilityRole="checkbox" accessibilityState={{ checked: !!item.completed }}
              disabled={busy} onPress={() => void refresh(() => toggleComplete(item.id, !item.completed))}>
              <Text style={[styles.label, !!item.completed && styles.done]}>{item.completed ? '☑' : '☐'}  {item.title}</Text>
            </Pressable>
            <Button title="Sil" color="#963e35" disabled={busy} onPress={() => void refresh(() => deleteTask(item.id))} />
          </View>
        )} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#fafbf7', padding: 24, gap: 16 },
  heading: { fontSize: 30, fontWeight: '700', color: '#192e24' },
  input: { borderWidth: 1, borderColor: '#85988b', borderRadius: 8, padding: 12, color: '#192e24' },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: '#d9e2da' },
  task: { flex: 1, paddingVertical: 16 },
  label: { fontSize: 18, color: '#192e24' },
  done: { textDecorationLine: 'line-through', color: '#57675d' },
});

