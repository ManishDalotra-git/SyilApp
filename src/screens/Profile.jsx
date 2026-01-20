import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform
} from 'react-native';

const Profile = ({ navigation }) => {

  StatusBar.setBarStyle('dark-content');
  StatusBar.setBackgroundColor('#fff');

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={require('../../images/right_arrow.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ask Alex</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>

        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Image
              source={require('../../images/profileEditor.png')}
              style={styles.avatarIcon}
            />
          </View>

          {/* <View style={styles.editBadge}>
            <Text style={styles.editText}>✎</Text>
          </View> */}
        </View>

        <Text style={styles.name}>Ajay Rana</Text>
        <Text style={styles.email}>design@techstriker.com</Text>

      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn}>
        <Image
          source={require('../../images/logout.png')}
          style={styles.logoutIcon}
        />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 40 : 20
  },

  header: {
    height: 40,
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

  profileSection: {
    alignItems: 'center',
    marginTop: 20
  },

  avatarWrapper: {
    position: 'relative',
    marginBottom: 16
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },

  avatarIcon: {
    width: 109.5,
    height: 104,
  },

  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEA00',
    alignItems: 'center',
    justifyContent: 'center'
  },

  editText: {
    fontSize: 14,
    fontWeight: 'bold'
  },

  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000'
  },

  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEA00',
    marginHorizontal: 24,
    borderRadius: 30,
    paddingVertical: 14,
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0
  },

  logoutIcon: {
    width: 18,
    height: 18,
    marginRight: 8
  },

  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000'
  }
});
