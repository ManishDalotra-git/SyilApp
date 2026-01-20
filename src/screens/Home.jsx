import { StyleSheet, Text, View, ImageBackground , Pressable, Image, ScrollView, StatusBar, Platform,  } from 'react-native'
import React from 'react'
import { useNavigation } from '@react-navigation/native';

const Home = () => {

  StatusBar.setTranslucent(true);
  StatusBar.setBackgroundColor('transparent');
  StatusBar.setBarStyle('light-content'); 
   
  const navigation = useNavigation();
  return (
    <ImageBackground source={require('../../images/Login_System.png')}  style={styles.background}
      resizeMode="cover">
      <ScrollView contentContainerStyle={styles.container}>
      <View>
        <Image source={require('../../images/syil_logo_white.png')} style={styles.logo} />
      </View>
      <Text style={styles.welcome}>Dealer News</Text>

      <Pressable onPress={() => navigation.navigate('KnowledgeBase')} style={styles.card}>
        <View style={styles.cardFlex} >
          <Image style={styles.cardImage} source={require('../../images/knowledge-base.png')} /> 
          <Image style={styles.arrow} source={require('../../images/arrow.png')} /> 
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Knowledge Base</Text>
          <Text style={styles.cardDesc}>
            Lorem ipsum dolor sit amet consectetur. Sapien id eget arcu in. Imperdiet ullamcorper quis duis facilisis rhoncus bibendum.
          </Text>
        </View>
      </Pressable>

      <Pressable onPress={() => navigation.navigate('Ticket')} style={styles.card}>
        <View style={styles.cardFlex}>
          <Image style={styles.cardImage} source={require('../../images/Contact_support.png')} /> 
          <Image style={styles.arrow} source={require('../../images/arrow.png')} /> 
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Contact Support</Text>
          <Text style={styles.cardDesc}>
            Lorem ipsum dolor sit amet consectetur. Sapien id eget arcu in. Imperdiet ullamcorper quis duis facilisis rhoncus bibendum.
          </Text>
        </View>
      </Pressable>

      </ScrollView>
    </ImageBackground>
  )
}

export default Home

const styles = StyleSheet.create({
  background: { 
    flex:1, 
  },
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 60 : 20,
    paddingBottom: 30,
  },
  heightAuto:{
    alignItems: 'center',
    paddingBottom: 40,
    height:'100%',
  },
  logo: {
    width: 120,
    height: 50,
    resizeMode: 'contain',
    marginTop: 0,
    alignSelf: 'center',
    marginLeft: 0,
    marginVertical:'auto',
    justifyContent:'center',
  },
  welcome: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
    marginTop: 50,
    textAlign:'center'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    marginBottom: 22,
    height:'auto',
  },
  cardImage:{
    width:50,
    height:50,
  },
  cardFlex:{
    display:'flex',
    flexWrap:'nowrap',
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center'
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    marginTop:10
  },
  cardDesc: {
    fontSize: 16,
    color: '#000',
  },
  arrow: {
    fontSize: 26,
    color: '#000',
    marginLeft: 10,
  },
})