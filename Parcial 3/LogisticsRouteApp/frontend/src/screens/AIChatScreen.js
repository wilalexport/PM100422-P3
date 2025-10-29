import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, IconButton, Card, ActivityIndicator } from 'react-native-paper';
import { sendMessageToAI, getDashboardStats, getCurrentUser } from '../services/supabaseService';

const AIChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: '¡Hola! Soy tu asistente de LogisticsRoute. Puedo ayudarte con:\n\n• Consejos para optimizar rutas\n• Cómo ahorrar combustible\n• Usar funciones de la app\n• Analizar tus estadísticas\n\n¿En qué puedo ayudarte?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState({});
  const scrollViewRef = useRef();

  useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const stats = await getDashboardStats(currentUser.id);
        if (stats) {
          setUserContext(stats);
        }
      }
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await sendMessageToAI(userMessage.text, userContext);

      const aiMessage = {
        id: Date.now() + 1,
        text: response.success ? response.message : 'Lo siento, hubo un error. Intenta nuevamente.',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Lo siento, no pude procesar tu mensaje.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const QuickQuestion = ({ text, onPress }) => (
    <Card style={styles.quickQuestionCard} onPress={onPress}>
      <Card.Content style={styles.quickQuestionContent}>
        <Text style={styles.quickQuestionText}>{text}</Text>
      </Card.Content>
    </Card>
  );

  const handleQuickQuestion = (question) => {
    setInputText(question);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="#FFFFFF"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Asistente IA</Text>
          <Text style={styles.headerSubtitle}>Powered by Gemini</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userBubble : styles.aiBubble
            ]}
          >
            <Text style={[
              styles.messageText,
              message.isUser ? styles.userText : styles.aiText
            ]}>
              {message.text}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#0047AB" />
            <Text style={styles.loadingText}>Escribiendo...</Text>
          </View>
        )}

        {messages.length === 1 && !loading && (
          <View style={styles.quickQuestionsContainer}>
            <Text style={styles.quickQuestionsTitle}>Preguntas rápidas:</Text>
            <QuickQuestion
              text="¿Cómo optimizo mis rutas?"
              onPress={() => handleQuickQuestion('¿Cómo optimizo mis rutas?')}
            />
            <QuickQuestion
              text="Dame consejos para ahorrar combustible"
              onPress={() => handleQuickQuestion('Dame consejos para ahorrar combustible')}
            />
            <QuickQuestion
              text="¿Cómo funciona la app?"
              onPress={() => handleQuickQuestion('¿Cómo funciona la app?')}
            />
            <QuickQuestion
              text="Analiza mis estadísticas"
              onPress={() => handleQuickQuestion('Analiza mis estadísticas y dame recomendaciones')}
            />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          mode="outlined"
          placeholder="Escribe tu pregunta..."
          value={inputText}
          onChangeText={setInputText}
          style={styles.input}
          outlineColor="#E0E0E0"
          activeOutlineColor="#0047AB"
          multiline
          maxLength={500}
          disabled={loading}
        />
        <IconButton
          icon="send"
          iconColor="#FFFFFF"
          size={24}
          style={[
            styles.sendButton,
            (!inputText.trim() || loading) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#0047AB',
    paddingHorizontal: 8,
    paddingVertical: 12,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0047AB',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#333333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666666',
    fontStyle: 'italic',
  },
  quickQuestionsContainer: {
    marginTop: 16,
  },
  quickQuestionsTitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    fontWeight: '600',
  },
  quickQuestionCard: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  quickQuestionContent: {
    paddingVertical: 8,
  },
  quickQuestionText: {
    fontSize: 14,
    color: '#0047AB',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#0047AB',
    marginBottom: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
});

export default AIChatScreen;
