import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar
} from 'react-native';

import articles from '../../assets/articles.json';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

const defaultMessages = [
  {
    id: '1',
    sender: 'bot',
    text: "Hello! Welcome to SYIL Support. I'm Alexa, your AI assistant 🙂"
  },
  {
    id: '2',
    sender: 'bot',
    text: "Is your question about the machine currently registered to your account?"
  }
];

// 🔍 Article matching logic
const findAnswerFromArticles = (question) => {

    

  const q = question.toLowerCase();

  const matchedArticle = articles.find(article =>
    article["Article title"]?.toLowerCase().includes(q) ||
    article["Category"]?.toLowerCase().includes(q) ||
    article["Article body"]?.toLowerCase().includes(q)
  );

  if (matchedArticle) {
    return matchedArticle["Article body"]
      .replace(/<[^>]+>/g, '')   // remove HTML
      .replace(/\s+/g, ' ')
      .substring(0, 600) + '...';
  }

  return "Sorry, I couldn't find an answer in our knowledge base.";
};

const AskAlex = () => {

    const navigation = useNavigation();

    const route = useRoute();
    const currentRoute = route.name;  


  const [messages, setMessages] = useState(defaultMessages);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input
    };

    const botMessage = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      text: findAnswerFromArticles(input)
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    setInput('');
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageBubble,
        item.sender === 'user'
          ? styles.userBubble
          : styles.botBubble
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (

    <SafeAreaView style={styles.safeArea}>
          {/* ---------- Header ---------- */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image
                source={require('../../images/right_arrow.png')}
                style={styles.arrowIcon}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Ask Alex</Text>
          </View>


    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Chat Messages */}
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.chatContainer}
      />

      {/* Input Box */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type your message..."
          value={input}
          onChangeText={setInput}
          style={styles.input}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>


<View style={styles.footer}>
        <TouchableOpacity style={[
            styles.footerItem,
            currentRoute === 'Home' && styles.activeFooterItem,
        ]} 
        onPress={() => navigation.navigate('Home')}
        >
        <Image source={require('../../images/home.png')} style={[
            styles.footerIcon,
            currentRoute === 'Home' && styles.activeFooterIcon,
            ]} />
        <Text style={[
            styles.footerText,
            currentRoute === 'Home' && styles.activeFooterText,
            ]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={[
            styles.footerItem,
            currentRoute === 'KnowledgeBase' && styles.activeFooterItem,
        ]}
        onPress={() => navigation.navigate('KnowledgeBase')}
        >
        <Image
            source={require('../../images/knowledge.png')}
            style={[
            styles.footerIcon,
            currentRoute === 'KnowledgeBase' && styles.activeFooterIcon,
            ]}
        />
        <Text
            style={[
            styles.footerText,
            currentRoute === 'KnowledgeBase' && styles.activeFooterText,
            ]}
        >
            Knowledge
        </Text>
        </TouchableOpacity>


        <TouchableOpacity style={[
            styles.footerItem,
            currentRoute === 'Ticket' && styles.activeFooterItem,
        ]}
        onPress={() => navigation.navigate('Ticket')}
        >
        <Image source={require('../../images/submit.png')} style={[
            styles.footerIcon,
            currentRoute === 'Ticket' && styles.activeFooterIcon,
            ]} />
        <Text style={[
            styles.footerText,
            currentRoute === 'Ticket' && styles.activeFooterText,
            ]}>Submit Ticket</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[
            styles.footerItem,
            currentRoute === 'ViewTicket' && styles.activeFooterItem,
        ]} 
        onPress={() => navigation.navigate('ViewTicket')}
        >
        <Image source={require('../../images/view.png')} style={[
            styles.footerIcon,
            currentRoute === 'ViewTicket' && styles.activeFooterIcon,
            ]} />
        <Text style={[
            styles.footerText,
            currentRoute === 'ViewTicket' && styles.activeFooterText,
            ]}>View Tickets</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[
            styles.footerItem,
            currentRoute === 'More' && styles.activeFooterItem,
        ]} onPress={() => navigation.navigate('More')}> 
        <Image source={require('../../images/more.png')} style={[
            styles.footerIcon,
            currentRoute === 'More' && styles.activeFooterIcon,
            ]} />
        <Text style={[
            styles.footerText,
            currentRoute === 'More' && styles.activeFooterText,
            ]}>More</Text>
        </TouchableOpacity>
      </View>


    </SafeAreaView>
  );
};

export default AskAlex;

// 🎨 Styles
const styles = StyleSheet.create({
    safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom:70,
  },
  header: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  arrowIcon: {
    width: 11.86,
    height: 21.21,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    width: '94%',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },

  chatContainer: {
    padding: 16
  },

  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 12,
    marginVertical: 6
  },

  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#F2F2F2'
  },

  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFEA00'
  },

  messageText: {
    fontSize: 14,
    color: '#000'
  },

  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff'
  },

  input: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44
  },

  sendButton: {
    marginLeft: 10,
    backgroundColor: '#FFEA00',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },

  sendText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  footer: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  //height: 80,
  flexDirection: 'row',
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: '#eee',
  justifyContent: 'space-around',
  alignItems: 'center',
  paddingHorizontal:16,
  boxShadow:'0 0 5px 0px #dfdfdf'
},
footerItem: {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical:16,
  paddingBottom:25,
},
footerIcon: {
  width: 22,
  height: 22,
  marginBottom: 4,
  tintColor: '#666666',
},
footerText: {
  fontSize: 12,
  color: '#666666',
},
activeFooterItem:{
  boxShadow:'0px -2px 0px 0px #FFEA00'
},
activeFooterIcon:{
  tintColor: '#000',
},
activeFooterText:{
  color:'#000',
  fontWeight:500,
},
});
