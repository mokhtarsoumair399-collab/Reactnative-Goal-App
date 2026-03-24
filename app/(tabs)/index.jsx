import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const STORAGE_KEY = 'goals';

export default function HomeScreen() {
  const [goalText, setGoalText] = useState('');
  const [goals, setGoals] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const canAdd = goalText.trim().length > 0;
  const canSaveEdit = editingText.trim().length > 0;

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setGoals(parsed);
          }
        }
      } catch (error) {
        console.warn('Failed to load goals', error);
      } finally {
        setIsHydrated(true);
      }
    };

    loadGoals();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const saveGoals = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
      } catch (error) {
        console.warn('Failed to save goals', error);
      }
    };

    saveGoals();
  }, [goals, isHydrated]);

  const addGoal = () => {
    const trimmed = goalText.trim();
    if (!trimmed) return;
    setGoals((current) => [{ id: Date.now().toString(), text: trimmed }, ...current]);
    setGoalText('');
  };

  const startEdit = (goal) => {
    setEditingId(goal.id);
    setEditingText(goal.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const saveEdit = () => {
    const trimmed = editingText.trim();
    if (!trimmed) return;

    setGoals((current) =>
      current.map((goal) => (goal.id === editingId ? { ...goal, text: trimmed } : goal)),
    );
    cancelEdit();
  };

  const deleteGoal = (id) => {
    setGoals((current) => current.filter((goal) => goal.id !== id));
    if (editingId === id) {
      cancelEdit();
    }
  };

  const renderRightActions = (id) => (
    <Pressable onPress={() => deleteGoal(id)} style={styles.swipeDelete}>
      <ThemedText style={styles.swipeDeleteText}>Delete</ThemedText>
    </Pressable>
  );

  const listEmpty = useMemo(
    () => (
      <ThemedText style={styles.emptyText}>
        No goals yet. Add one above to get started.
      </ThemedText>
    ),
    [],
  );

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <ThemedView style={styles.screen}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Goal Tracker</ThemedText>
          <ThemedText style={styles.subTitle}>Add goals and keep them visible.</ThemedText>
        </ThemedView>

        <ThemedView style={styles.inputRow}>
          <TextInput
            value={goalText}
            onChangeText={setGoalText}
            placeholder="Add a new goal"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={addGoal}
          />
          <Pressable
            onPress={addGoal}
            disabled={!canAdd}
            style={({ pressed }) => [
              styles.addButton,
              !canAdd && styles.addButtonDisabled,
              pressed && canAdd && styles.addButtonPressed,
            ]}>
            <ThemedText style={styles.addButtonText}>Add</ThemedText>
          </Pressable>
        </ThemedView>

        <FlatList
          data={goals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={listEmpty}
          renderItem={({ item }) => (
            <Swipeable renderRightActions={() => renderRightActions(item.id)}>
              <View style={styles.goalItem}>
                {editingId === item.id ? (
                  <TextInput
                    value={editingText}
                    onChangeText={setEditingText}
                    style={styles.inlineInput}
                    placeholder="Edit goal"
                    placeholderTextColor="#9ca3af"
                  />
                ) : (
                  <ThemedText style={styles.goalText}>{item.text}</ThemedText>
                )}

                <View style={styles.goalActions}>
                  {editingId === item.id ? (
                    <>
                      <Pressable
                        onPress={saveEdit}
                        disabled={!canSaveEdit}
                        style={({ pressed }) => [
                          styles.saveButton,
                          !canSaveEdit && styles.saveButtonDisabled,
                          pressed && canSaveEdit && styles.actionPressed,
                        ]}>
                        <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                      </Pressable>
                      <Pressable onPress={cancelEdit} style={styles.cancelButton}>
                        <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Pressable onPress={() => startEdit(item)} style={styles.editButton}>
                        <ThemedText style={styles.editButtonText}>Edit</ThemedText>
                      </Pressable>
                      <Pressable onPress={() => deleteGoal(item.id)} style={styles.deleteButton}>
                        <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            </Swipeable>
          )}
        />
      </ThemedView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  header: {
    marginBottom: 24,
    gap: 6,
  },
  subTitle: {
    opacity: 0.7,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  addButton: {
    minHeight: 48,
    minWidth: 86,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
    gap: 12,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
  },
  goalText: {
    color: '#111827',
    flex: 1,
  },
  inlineInput: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 10,
    color: '#111827',
    backgroundColor: '#ffffff',
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#e5e7eb',
  },
  editButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  deleteButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#111827',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  actionPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  swipeDelete: {
    width: 92,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 14,
    marginVertical: 6,
  },
  swipeDeleteText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyText: {
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 24,
  },
});
