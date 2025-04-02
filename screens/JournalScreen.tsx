import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  Modal, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { supabase } from '../utils/supabaseClient';
import { getCurrentUser } from '../services/authService';
import { getCurrentSubscriptionTier } from '../services/subscriptionService';
import { format } from 'date-fns';

// Define Journal Entry type
interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  mood_rating?: number | null;
}

export default function JournalScreen({ navigation }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newEntryTitle, setNewEntryTitle] = useState('');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isViewMode, setIsViewMode] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Load journal entries
  useEffect(() => {
    loadJournalEntries();
    checkSubscriptionStatus();
  }, []);

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    try {
      const tier = await getCurrentSubscriptionTier();
      setIsPremium(tier === 'premium');
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setIsPremium(false);
    }
  };

  // Load journal entries from Supabase
  const loadJournalEntries = async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.log('No authenticated user found');
        setIsLoading(false);
        return;
      }

      // Check if journal_entries table exists, if not create it
      await createJournalTableIfNeeded();

      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching journal entries:', error);
        Alert.alert('Error', 'Failed to load journal entries. Please try again.');
      } else {
        setEntries(data || []);
      }
    } catch (error) {
      console.error('Error in loadJournalEntries:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create journal_entries table if it doesn't exist
  const createJournalTableIfNeeded = async () => {
    try {
      // Check if table exists
      const { data, error } = await supabase
        .from('journal_entries')
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') { // Table doesn't exist error code
        console.log('Journal entries table does not exist, creating it...');
        
        // Create the table using SQL
        const { error: createError } = await supabase.rpc('create_journal_entries_table');
        
        if (createError) {
          console.error('Error creating journal entries table:', createError);
        } else {
          console.log('Journal entries table created successfully');
        }
      }
    } catch (error) {
      console.error('Error checking/creating journal table:', error);
    }
  };

  // Save a new journal entry
  const saveJournalEntry = async () => {
    if (!newEntryTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for your journal entry');
      return;
    }

    setIsSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save a journal entry');
        setIsSaving(false);
        return;
      }

      // Check entry limit for free users
      if (!isPremium && entries.length >= 5) {
        Alert.alert(
          'Entry Limit Reached',
          'Free users can only create 5 journal entries. Upgrade to Premium for unlimited journaling!',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Upgrade', 
              onPress: () => {
                setModalVisible(false);
                navigation.navigate('SubscriptionComparison', { source: 'limit' });
              }
            }
          ]
        );
        setIsSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from('journal_entries')
        .insert([
          {
            user_id: user.id,
            title: newEntryTitle.trim(),
            content: newEntryContent.trim(),
          }
        ])
        .select();

      if (error) {
        console.error('Error saving journal entry:', error);
        Alert.alert('Error', 'Failed to save journal entry. Please try again.');
      } else {
        console.log('Journal entry saved successfully:', data);
        setNewEntryTitle('');
        setNewEntryContent('');
        setModalVisible(false);
        loadJournalEntries(); // Refresh the list
      }
    } catch (error) {
      console.error('Error in saveJournalEntry:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Update an existing journal entry
  const updateJournalEntry = async () => {
    if (!editTitle.trim() || !selectedEntry) {
      Alert.alert('Error', 'Please enter a title for your journal entry');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('journal_entries')
        .update({
          title: editTitle.trim(),
          content: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEntry.id);

      if (error) {
        console.error('Error updating journal entry:', error);
        Alert.alert('Error', 'Failed to update journal entry. Please try again.');
      } else {
        console.log('Journal entry updated successfully');
        setIsViewMode(true);
        setIsEditing(false);
        loadJournalEntries(); // Refresh the list
      }
    } catch (error) {
      console.error('Error in updateJournalEntry:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a journal entry
  const deleteJournalEntry = async () => {
    if (!selectedEntry) return;

    Alert.alert(
      'Delete Journal Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('journal_entries')
                .delete()
                .eq('id', selectedEntry.id);

              if (error) {
                console.error('Error deleting journal entry:', error);
                Alert.alert('Error', 'Failed to delete journal entry. Please try again.');
              } else {
                console.log('Journal entry deleted successfully');
                setSelectedEntry(null);
                setIsViewMode(true);
                loadJournalEntries(); // Refresh the list
              }
            } catch (error) {
              console.error('Error in deleteJournalEntry:', error);
              Alert.alert('Error', 'An unexpected error occurred. Please try again.');
            }
          }
        }
      ]
    );
  };

  // View a journal entry
  const viewJournalEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setIsViewMode(true);
    setIsEditing(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Render journal entry item
  const renderJournalEntry = ({ item }: { item: JournalEntry }) => (
    <TouchableOpacity 
      style={styles.entryItem}
      onPress={() => viewJournalEntry(item)}
    >
      <View style={styles.entryHeader}>
        <Text style={styles.entryTitle} numberOfLines={1} ellipsizeMode="tail">
          {item.title}
        </Text>
        <Text style={styles.entryDate}>
          {formatDate(item.created_at)}
        </Text>
      </View>
      <Text style={styles.entryPreview} numberOfLines={2} ellipsizeMode="tail">
        {item.content}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journal</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading journal entries...</Text>
        </View>
      ) : (
        <>
          {entries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="journal-outline" size={64} color={theme.colors.subtext} />
              <Text style={styles.emptyTitle}>No Journal Entries Yet</Text>
              <Text style={styles.emptyText}>
                Start journaling to track your thoughts, feelings, and experiences.
              </Text>
              <TouchableOpacity 
                style={styles.createButton}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.createButtonText}>Create First Entry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={entries}
              renderItem={renderJournalEntry}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}

      {/* New Entry Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Journal Entry</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor={theme.colors.subtext}
              value={newEntryTitle}
              onChangeText={setNewEntryTitle}
              maxLength={100}
            />
            
            <TextInput
              style={styles.contentInput}
              placeholder="Write your thoughts here..."
              placeholderTextColor={theme.colors.subtext}
              value={newEntryContent}
              onChangeText={setNewEntryContent}
              multiline
              textAlignVertical="top"
            />
            
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                (!newEntryTitle.trim() || isSaving) && styles.saveButtonDisabled
              ]}
              onPress={saveJournalEntry}
              disabled={!newEntryTitle.trim() || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Save Entry</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* View/Edit Entry Modal */}
      <Modal
        visible={selectedEntry !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (isEditing) {
            Alert.alert(
              'Discard Changes',
              'Are you sure you want to discard your changes?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Discard', 
                  style: 'destructive',
                  onPress: () => {
                    setSelectedEntry(null);
                    setIsEditing(false);
                    setIsViewMode(true);
                  }
                }
              ]
            );
          } else {
            setSelectedEntry(null);
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isViewMode ? 'Journal Entry' : 'Edit Entry'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  if (isEditing) {
                    Alert.alert(
                      'Discard Changes',
                      'Are you sure you want to discard your changes?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Discard', 
                          style: 'destructive',
                          onPress: () => {
                            setSelectedEntry(null);
                            setIsEditing(false);
                            setIsViewMode(true);
                          }
                        }
                      ]
                    );
                  } else {
                    setSelectedEntry(null);
                  }
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            
            {isViewMode ? (
              // View mode
              <ScrollView style={styles.viewContainer}>
                <Text style={styles.viewTitle}>{selectedEntry?.title}</Text>
                <Text style={styles.viewDate}>
                  {selectedEntry && formatDate(selectedEntry.created_at)}
                  {selectedEntry && selectedEntry.updated_at !== selectedEntry.created_at && 
                    ` (Edited: ${formatDate(selectedEntry.updated_at)})`}
                </Text>
                <Text style={styles.viewContent}>{selectedEntry?.content}</Text>
              </ScrollView>
            ) : (
              // Edit mode
              <>
                <TextInput
                  style={styles.titleInput}
                  placeholder="Title"
                  placeholderTextColor={theme.colors.subtext}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  maxLength={100}
                />
                
                <TextInput
                  style={styles.contentInput}
                  placeholder="Write your thoughts here..."
                  placeholderTextColor={theme.colors.subtext}
                  value={editContent}
                  onChangeText={setEditContent}
                  multiline
                  textAlignVertical="top"
                />
              </>
            )}
            
            <View style={styles.actionButtonsContainer}>
              {isViewMode ? (
                <>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => {
                      setIsViewMode(false);
                      setIsEditing(true);
                    }}
                  >
                    <Ionicons name="create-outline" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={deleteJournalEntry}
                  >
                    <Ionicons name="trash-outline" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={[
                      styles.actionButton, 
                      styles.saveEditButton,
                      (!editTitle.trim() || isSaving) && styles.saveButtonDisabled
                    ]}
                    onPress={updateJournalEntry}
                    disabled={!editTitle.trim() || isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="save-outline" size={20} color="white" />
                        <Text style={styles.actionButtonText}>Save</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => {
                      Alert.alert(
                        'Discard Changes',
                        'Are you sure you want to discard your changes?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Discard', 
                            style: 'destructive',
                            onPress: () => {
                              if (selectedEntry) {
                                setEditTitle(selectedEntry.title);
                                setEditContent(selectedEntry.content);
                              }
                              setIsViewMode(true);
                              setIsEditing(false);
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.subtext,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.subtext,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    ...theme.shadows.medium,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
  },
  listContainer: {
    padding: 16,
  },
  entryItem: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.small,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    flex: 1,
  },
  entryDate: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginLeft: 8,
  },
  entryPreview: {
    fontSize: 14,
    color: theme.colors.subtext,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
    ...theme.shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  titleInput: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 12,
  },
  contentInput: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    height: 200,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.medium,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
  },
  viewContainer: {
    marginBottom: 16,
  },
  viewTitle: {
    fontSize: 22,
    fontWeight: theme.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  viewDate: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 16,
  },
  viewContent: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 12,
    flex: 1,
    marginHorizontal: 6,
    ...theme.shadows.small,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: theme.fontWeights.semibold,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: theme.colors.primary,
  },
  deleteButton: {
    backgroundColor: theme.colors.error,
  },
  saveEditButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButton: {
    backgroundColor: theme.colors.subtext,
  },
});