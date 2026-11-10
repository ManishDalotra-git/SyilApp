
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchImageLibrary} from 'react-native-image-picker';

const ADMIN_EMAILS = ['manish.dalotra@techstriker.com','fabuikema@gmail.com',];
const API_BASE_URL = 'https://syilapp-w8ye.onrender.com';
const MAX_FILES = 5;

const Announcements = ({navigation}) => {
  const [userEmail, setUserEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      const first = await AsyncStorage.getItem('userFirstName');
      const last = await AsyncStorage.getItem('userLastName');

      setUserEmail(email || '');
      setFirstName(first || '');
      setLastName(last || '');
    };

    loadUser();
  }, []);

  const isAdmin = ADMIN_EMAILS.includes(
  userEmail.trim().toLowerCase()
);

  const handlePickMedia = async () => {
    if (publishing) {
      return;
    }

    const remaining = MAX_FILES - selectedMedia.length;

    if (remaining <= 0) {
      Alert.alert('Limit reached', `You can select up to ${MAX_FILES} files.`);
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: remaining,
        includeExtra: false,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert(
          'Picker error',
          result.errorMessage || 'Could not open media picker.',
        );
        return;
      }

      const assets = (result.assets || []).filter(
        asset => asset.uri && asset.type,
      );

      setSelectedMedia(current => [...current, ...assets].slice(0, MAX_FILES));
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not select media.');
    }
  };

  const removeMedia = index => {
    setSelectedMedia(current => current.filter((_, i) => i !== index));
  };

  
  const uploadMedia = async () => {
    if (selectedMedia.length === 0) {
      return [];
    }

    const formData = new FormData();

    selectedMedia.forEach((asset, index) => {
      const fallbackName = `announcement_${Date.now()}_${index}`;

      const uri = asset.uri;

      const name =
        asset.fileName ||
        uri.split('/').pop() ||
        fallbackName;

      formData.append('files', {
        uri,
        name,
        type: asset.type || 'application/octet-stream',
      });
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/upload-announcement-media`,
        {
          method: 'POST',
          body: formData,
        },
      );

      const data = await response.json();

      console.log('Announcement upload response:', data);
      console.log('Selected media count:', selectedMedia.length);
      console.log('Uploaded media count:', data.files?.length);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || data.error || 'Media upload failed.',
        );
      }

      if (
        !Array.isArray(data.files) ||
        data.files.length !== selectedMedia.length
      ) {
        throw new Error(
          `Upload count mismatch. Selected: ${selectedMedia.length}, Uploaded: ${
            data.files?.length || 0
          }`,
        );
      }

      return data.files.map((file, index) => ({
        hubspot_file_id: String(file.id),
        url: file.url,
        file_name:
          file.name ||
          selectedMedia[index].fileName ||
          `announcement_media_${index + 1}`,
        media_type:
          file.type ||
          (selectedMedia[index].type?.startsWith('video/')
            ? 'video'
            : 'image'),
      }));
    } catch (error) {
      console.error('Announcement media upload failed:', error);
      throw error;
    }
  };


  const handlePublish = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Required', 'Please enter title and description.');
      return;
    }

    if (!isAdmin) {
      Alert.alert('Access denied', 'Only the admin can publish announcements.');
      return;
    }

    try {
      setPublishing(true);

      // First upload selected media to HubSpot.
      const media = await uploadMedia();

      // Then create announcement with returned media details.
      const response = await fetch(`${API_BASE_URL}/announcements`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          userEmail,
          userName: `${firstName} ${lastName}`.trim(),
          media,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Could not publish announcement.');
      }

      Alert.alert('Success', 'Announcement published successfully!');
      setTitle('');
      setDescription('');
      setSelectedMedia([]);
    } catch (error) {
      console.error('Publish announcement error:', error);
      Alert.alert(
        'Publish failed',
        error.message || 'Please check the backend connection.',
      );
    } finally {
      setPublishing(false);
    }
  };

  if (!userEmail) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Loading user details...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          You do not have permission to create announcements.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">


      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Image
            source={require('../../images/circle_arrow.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>

        <Text allowFontScaling={false} style={styles.headerTitle}>
          Announcements
        </Text>
      </View>

      {/* <Text style={styles.heading}>Announcements</Text> */}

      <Text style={styles.subheading}>
        Create a news update for dealers and customers.
      </Text>

      <Text style={styles.label}>Announcement Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter announcement title"
        placeholderTextColor="#888"
        value={title}
        onChangeText={setTitle}
        editable={!publishing}
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.description]}
        placeholder="Write your announcement..."
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
        editable={!publishing}
      />

      <TouchableOpacity
        style={styles.mediaButton}
        onPress={handlePickMedia}
        disabled={publishing}>
        <Text style={styles.mediaButtonText}>+ Add Image / Video</Text>
      </TouchableOpacity>

      {selectedMedia.length > 0 && (
        <View style={styles.mediaSection}>
          <Text style={styles.mediaHeading}>
            Selected media ({selectedMedia.length}/{MAX_FILES})
          </Text>

          {selectedMedia.map((asset, index) => (
            <View key={`${asset.uri}-${index}`} style={styles.mediaItem}>
              {asset.type?.startsWith('image/') ? (
                <Image source={{uri: asset.uri}} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, styles.videoThumbnail]}>
                  <Text style={styles.videoIcon}>▶</Text>
                  <Text style={styles.videoText}>VIDEO</Text>
                </View>
              )}

              <View style={styles.mediaInfo}>
                <Text numberOfLines={2} style={styles.fileName}>
                  {asset.fileName || `Media ${index + 1}`}
                </Text>
                <Text style={styles.fileType}>
                  {asset.type?.startsWith('video/') ? 'Video' : 'Image'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => removeMedia(index)}
                disabled={publishing}
                style={styles.removeButton}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.publishButton, publishing && styles.disabledButton]}
        onPress={handlePublish}
        disabled={publishing}>
        {publishing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.publishButtonText}>
            Publish Announcement
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff', paddingTop: 25},

  header: {
    height: 65,
    flexDirection: 'row',
    alignItems: 'center',
  },

  arrowIcon: {
    width: 32,
    height: 32,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    width: '82%',
    textAlign: 'center',
  },


  content: {padding: 16, paddingBottom: 40},
  heading: {fontSize: 26, fontWeight: '700', color: '#000'},
  subheading: {
    fontSize: 14, color: '#000', marginTop: 6, marginBottom: 0,
  },
  label: {
    fontSize: 15, fontWeight: '600', color: '#000',
    marginBottom: 8, marginTop: 16,
  },
  input: {
    fontSize: 15, color: '#000',
    borderRadius: 6,
    padding: 15,
    marginTop: 6,
    backgroundColor:'#F5F5F7',
  },
  description: {minHeight: 150},
  mediaButton: {
    borderWidth: 1, borderColor: '#9b9b9b', borderStyle: 'dashed',
    borderRadius: 100, padding: 16, alignItems: 'center', marginTop: 22,
  },
  mediaButtonText: {color: '#000', fontSize: 15, fontWeight: '600'},
  mediaSection: {marginTop: 18},
  mediaHeading: {
    fontSize: 15, fontWeight: '700', color: '#000', marginBottom: 10,
  },
  mediaItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 10, padding: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#E1E6EF',
  },
  thumbnail: {
    width: 64, height: 64, borderRadius: 8, backgroundColor: '#E9EEF5',
  },
  videoThumbnail: {alignItems: 'center', justifyContent: 'center'},
  videoIcon: {fontSize: 22, color: '#0052CC'},
  videoText: {fontSize: 10, fontWeight: '700', color: '#253858'},
  mediaInfo: {flex: 1, marginHorizontal: 10},
  fileName: {fontSize: 13, color: '#253858'},
  fileType: {fontSize: 12, color: '#68778D', marginTop: 4},
  removeButton: {padding: 6},
  removeText: {color: '#DE350B', fontWeight: '600', fontSize: 12},
  publishButton: {
    backgroundColor:'#FFEA00',
    borderRadius:100,
    padding:15,
    alignItems:'center',
    marginTop:20,
  },
  disabledButton: {opacity: 0.65},
  publishButtonText: {fontSize: 16,
    fontWeight: '600',
    Color:'#000',},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  errorText: {color: '#C9372C', fontSize: 16, textAlign: 'center'},
});

export default Announcements;
