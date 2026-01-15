import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView, Modal, Linking,  StatusBar, Platform, 
} from 'react-native';
import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage'; 

const Login = () => {


  StatusBar.setTranslucent(true);
  StatusBar.setBackgroundColor('transparent');
  StatusBar.setBarStyle('light-content');

  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

    // const handleSubmit = async () => {
    // setLoading(true); 
    // try {
    //     const response = await fetch(
    //     'http://192.168.0.74:3000/check_login_detail',
    //         {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({
    //             email: username,
    //             password: password,
    //             }),
    //         }
    //     );
    //     const result = await response.json();
    //     console.log('Login Result:', result);
    //     if (!response.ok) {
    //         setLoading(false); 
    //         alert(result.message || 'Login failed');
    //         return;
    //     }
    //     navigation.replace('Home');
    //     setLoading(false);
    //     } catch (error) {
    //         setLoading(false);
    //         console.log('Network Error:', error);
    //         alert('Network request failed.');
    //     }
    // };


//'http://192.168.0.74:3000/check_login_detail'

const handleSubmit = async () => {
  setLoading(true);

  try {
      const response = await fetch(
        'http://192.168.0.74:3000/check_login_detail',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                email: username,
                password: password,
                }),
            }
      );

    const result = await response.json();
    if (!response.ok) {
      setLoading(false);
      alert(result.message || 'Login failed');
      return;
    }

    // ✅ LOGIN SUCCESS
    await AsyncStorage.setItem('isLoggedIn', 'true');
    await AsyncStorage.setItem(
      'lastLoginTime',
      Date.now().toString()
    );

    setLoading(false);
    navigation.replace('Home');

  } catch (error) {
    setLoading(false);
    alert('Network error');
  }
};




  return (
    // <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}></SafeAreaView>
    <ImageBackground
      source={require('../../images/Login_System.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.container}
        // keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        
        {/* Logo */}
        <Image
          source={require('../../images/syillogo1.png')}
          style={styles.logo}
        />

        {/* Welcome Text */}
        <Text style={styles.welcome}>Welcome back!</Text>

        {/* White Card */}
        <View style={styles.card}>
          <Text style={styles.signIn}>Sign In</Text>
          <Text style={styles.subText}>
            Enter Your serial number and password to sign in the Customer Portal.
          </Text>

          {/* Username */}
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Your Email Address"
            value={username}
            onChangeText={setUsername}
            placeholderTextColor="#999"
          />

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
                style={styles.passwordInput}
                placeholder="Enter Your Password"
                secureTextEntry={secure}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#999"
            />

            <TouchableOpacity onPress={() => setSecure(!secure)}>
                <Image
                    source={
                        secure
                        ? require('../../images/hide_icon.png')
                        : require('../../images/show_icon.png')
                    }
                    style={[
                        styles.eyeIcon,
                        secure ? styles.hideIcon : styles.showIcon
                    ]}
                />
            </TouchableOpacity>
          </View>

          <Text onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>Forgot Password?</Text>

          {/* Login Button */}
          <TouchableOpacity disabled={loading} 
          style={[
            styles.button, loading && { opacity: 0.6 }
          ]} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer} onPress={() => Linking.openURL('mailto:support@example.com')} >
          Need Help? <Text style={styles.support}>Contact Support</Text>
        </Text>


        

      </ScrollView>

      <Modal visible={loading} transparent animationType="fade">
            <View style={styles.loadingContainer}>
                {/* <Image
                source={require('../../images/loading.gif')}
                style={styles.loadingGif}
                /> */}
                <Text style={{ fontSize:24,fontWeight:700 }}>Please wait...</Text>
            </View>
        </Modal>
    </ImageBackground>
  );
};

export default Login;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 60 : 20,
    paddingBottom: 30,
  },
  logo: {
    width: 120,
    height: 50,
    resizeMode: 'contain',
    marginTop: 0,
    alignSelf: 'flex-start',
    marginLeft: 0,
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
    width: '100%',
    borderRadius: 25,
    padding: 20,
    marginVertical: 20,
  },
  signIn: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
    color:"#000",
  },
  subText: {
    textAlign: 'center',
    color: '#000',
    fontSize: 16,
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    marginBottom: 5,
    marginTop: 10,
    fontSize:20,
  },
  input: {
    backgroundColor: '#F2F2F2',
    borderRadius: 100,
    paddingHorizontal: 15,
    height: 48,
    fontSize:16,
    textTransform:'lowercase',
  },
  forgot: {
    textAlign: 'right',
    color: '#555',
    marginVertical: 10,
  },
  button: {
    backgroundColor: '#FFEA00',
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  footer: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  support: {
    color: '#FFEA00',
    fontWeight: '700',
    fontSize: 20,
  },
    passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 100,
    paddingHorizontal: 15,
    height: 48,
    },
    passwordInput: {
    flex: 1,
    fontSize: 16,
    color:'#000',
    },
    eyeIcon: {
    width: 22,
    resizeMode: 'contain',
    },
    hideIcon: {
    height: 19,
    },
    showIcon: {
    height: 16,
    },
    loadingContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    },
    loadingGif: {
    width: 150,
    height: 150,
    },
});
