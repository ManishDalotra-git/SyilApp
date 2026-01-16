// import React, { useEffect, useState, useMemo } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   TextInput,
//   Image,
//   Pressable, StatusBar, Platform, ImageBackground,ScrollView,
// } from 'react-native';
// import { readCSV } from '../utils/csvReader';

// const KnowledgeBase = ({ navigation }) => {

//   StatusBar.setTranslucent(true);
//   StatusBar.setBackgroundColor('transparent');
//   StatusBar.setBarStyle('dark-content');
  
//   const [articles, setArticles] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState(null);

//   useEffect(() => {
//     readCSV().then(data => {
//       const cleanData = data.filter(
//         item => item['Article title'] && item['Article body']
//       );
//       setArticles(cleanData);
//       setLoading(false);
//     });
//   }, []);

//   const categories = useMemo(() => {
//     const unique = [...new Set(articles.map(a => a.Category))];
//     return unique.slice(0, 10);
//   }, [articles]);

//   const filteredArticles = useMemo(() => {
//     return articles.filter(item => {
//       const matchSearch =
//         item['Article title']
//           ?.toLowerCase()
//           .includes(search.toLowerCase());

//       const matchCategory = selectedCategory
//         ? item.Category === selectedCategory
//         : true;

//       return matchSearch && matchCategory;
//     });
//   }, [articles, search, selectedCategory]);

//   const renderItem = ({ item }) => (
//     <TouchableOpacity
//       style={styles.articleCard}
//       onPress={() =>
//         navigation.navigate('KnowledgeDetail', { article: item })
//       }
//     >
//       <Image
//         source={require('../../images/catg_list_icon.png')}
//         style={styles.articleIcon}
//       />

//       <View style={{ flex: 1 }}>
//         <Text style={styles.articleTitle}>
//           {/* {item.Subcategory?.trim()
//             ? item.Subcategory
//             : item['Article title']} */}
//             {item['Article title']}
//         </Text>
//         <Text style={styles.articleSub}>
//           {item.Subcategory?.trim()
//             ? item.Subcategory
//             : item.Category}
//           {/* Category: {item.Category} */}
//         </Text>
//       </View>

//       <Image
//         source={require('../../images/left_arrow.png')}
//         style={styles.Leftarrow}
//       />
//     </TouchableOpacity>
//   );

//   if (loading) {
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" />
//         <Text>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <ImageBackground
//       style={styles.background}
//       resizeMode="cover"
//     >
//       <View style={styles.container}>
//         <View style={styles.containerInner}>

//           {/* HEADER */}
//           <View style={styles.flexClass}>
//             <Pressable 
//             onPress={() => navigation.goBack()}
//             //onPress={() => navigation.navigate('Home')} 
//             >
//               <Image
//                 source={require('../../images/right_arrow.png')}
//                 style={styles.rightarrowIcon}
//               />
//             </Pressable>
//             <Image
//                 source={require('../../images/syil_logo_black.png')}
//                 style={styles.logoSyil}
//             />
//             <Pressable onPress={() => navigation.navigate('Ticket')} >
//               <Image
//                 source={require('../../images/ticket.png')}
//                 style={styles.ticketIcon}
//               />
//             </Pressable>
//           </View>

          


//           {/* 🔹 SEARCH */}
//           <View style={styles.searchBox}>
//             <Image
//               source={require('../../images/search_icon.png')}
//               style={styles.searchIcon}
//             />
//             <TextInput
//               placeholder="Search Procedures"
//               value={search}
//               onChangeText={setSearch}
//               style={styles.searchInput}
//               placeholderTextColor="#999"
//             />
//           </View>

//           {/* 🔹 CATEGORY CARDS */}
//           <View style={styles.categoryList}>
//           <FlatList
//             data={categories}
//             horizontal
//             showsHorizontalScrollIndicator={false}
//             keyExtractor={(item, index) => index.toString()}
//             contentContainerStyle={styles.categoryRow}
//             renderItem={({ item }) => (
//               <TouchableOpacity
//                 style={[
//                   styles.categoryCardBase,
//                   selectedCategory === item && styles.activeCategory,
//                 ]}
//                 onPress={() =>
//                   setSelectedCategory(
//                     selectedCategory === item ? null : item
//                   )
//                 }
//               >
//                 <Image
//                   source={require('../../images/catg_icon.png')}
//                   style={styles.categoryIcon}
//                 />
//                 <Text style={styles.categoryText} numberOfLines={1} allowFontScaling={false}>
//                   {item}
//                 </Text>
//               </TouchableOpacity>
//             )}
//           />
//           </View>

//           {/* 🔹 CATEGORY CARDS */}
//           <Text style={styles.popularTitle}>
//             Popular Articles
//           </Text>

//           {/* 🔹 ARTICLE LIST */}
//           <View style={styles.articleListWrapper}>
//           <FlatList
//             data={filteredArticles}
//             keyExtractor={(item, index) => index.toString()}
//             renderItem={renderItem}
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={styles.articleListContent}
//             keyboardShouldPersistTaps="handled"

//             ListFooterComponent={<View style={{ height: 550 }} />}
//           />
//           </View>

//         </View>
//       </View>
//     </ImageBackground>
//   );
// };

// export default KnowledgeBase;


// const styles = StyleSheet.create({
//   background: {
//     flex: 1,
//     justifyContent:'flex-start',
//   },
//   container: {
//     flex: 1,
//     paddingHorizontal: 16,
//     paddingTop: Platform.OS === 'android' ? 60 : 20,
//     backgroundColor:'#fff',
//   },
//   containerInner:{},
//   flexClass:{
//     display:'flex',
//     justifyContent:'space-between',
//     alignItems:'center',
//     flexDirection:'row',
//   },
//   rightarrowIcon:{
//     width:11.86,
//     height:21.21,
//   },
//   logoSyil:{
//     width:87.6,
//     height: 24,
//   },
//   ticketIcon:{
//     width:26.88,
//     height:21.88,
//   },
//   header: {
//     height: 60,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   icon: { width: 24, height: 24 },
//   logo: { width: 80, height: 24, resizeMode: 'contain' },
//   categoryRow: {
//     marginBottom:0,
//     marginTop:15,
//     height:100,
//   },
//   activeCategory: {
//     backgroundColor: '#FFEA00',
//     padding: 10,
//     borderRadius: 10,
//     height:86,
//     backgroundColor: '#FFEA00',
//   },
//   categoryCardBase: {
//     alignItems: 'center',
//     padding: 10,
//     borderRadius: 10,
//     width: 90,
//     marginRight: 10,
//     borderWidth: 1,
//     borderColor: '#F5F5F7',
//     backgroundColor: '#fff',
//     height:86,
//   },
//   categoryIcon: { width: 41, height: 41, marginBottom: 6 },
//   categoryText: { fontSize: 12, textAlign: 'center', marginBottom:0, },
//   articleListMain:{
//     marginTop:0,
//   },
//   popularTitle:{
//     fontSize:20,
//     fontWeight:700,
//     marginVertical:10,
//   },
//   articleListWrapper: {
//     backgroundColor: '#F5F5F7',
//     marginTop: 10,
//     overflow: 'hidden',
//   },
//   articleListContent: {
//     paddingTop: 10,
//     paddingBottom: 30,
//   },
//   articleCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderColor: '#FFF',
//   },
//   articleIcon: { width: 41, height: 41, marginRight: 8 },
//   Leftarrow: {width:11.86,height:21.21,},
//   articleTitle: { fontSize: 14, fontWeight: '600', color:'#000', paddingRight:20, },
//   articleSub: { fontSize: 12, color: '#777' },
//   loaderContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   searchBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#F5F5F7',
//     marginTop: 26,
//     marginBottom: 8,
//     borderRadius: 25,
//     height: 45,
//   },
//   searchIcon: {
//     width: 18,
//     height: 18,
//     marginRight: 8,
//     marginLeft:16,
//     tintColor: '#777',
//   },
//   searchInput: {
//     flex: 1,
//     fontSize: 14,
//     color: '#000',
//   },
// });



import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  Pressable,
  StatusBar,
  Platform,
  ImageBackground,
} from 'react-native';

// ✅ JSON import
import articlesData from '../../assets/articles.json';

const KnowledgeBase = ({ navigation }) => {
  StatusBar.setTranslucent(true);
  StatusBar.setBackgroundColor('transparent');
  StatusBar.setBarStyle('dark-content');

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ✅ Load data from JSON instead of CSV
  useEffect(() => {
    const cleanData = articlesData.filter(
      item => item['Article title'] && item['Article body']
    );

    setArticles(cleanData);
    setLoading(false);
  }, []);

  // ✅ Categories (same logic)
  const categories = useMemo(() => {
    const unique = [...new Set(articles.map(a => a.Category))];
    return unique;
    //return unique.slice(0, 10);
  }, [articles]);

  // ✅ Search + Category filter (unchanged)
  const filteredArticles = useMemo(() => {
    return articles.filter(item => {
      const matchSearch =
        item['Article title']
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchCategory = selectedCategory
        ? item.Category === selectedCategory
        : true;

      return matchSearch && matchCategory;
    });
  }, [articles, search, selectedCategory]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.articleCard}
      onPress={() =>
        navigation.navigate('KnowledgeDetail', { article: item })
      }
    >
      <Image
        source={require('../../images/catg_list_icon.png')}
        style={styles.articleIcon}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.articleTitle}>
          {item['Article title']}
        </Text>
        <Text style={styles.articleSub}>
          {item.Subcategory?.trim()
            ? item.Subcategory
            : item.Category}
        </Text>
      </View>

      <Image
        source={require('../../images/left_arrow.png')}
        style={styles.Leftarrow}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ImageBackground style={styles.background} resizeMode="cover">
      <View style={styles.container}>
        <View style={styles.containerInner}>

          {/* HEADER */}
          <View style={styles.flexClass}>
            <Pressable onPress={() => navigation.goBack()}>
              <Image
                source={require('../../images/right_arrow.png')}
                style={styles.rightarrowIcon}
              />
            </Pressable>

            <Image
              source={require('../../images/syil_logo_black.png')}
              style={styles.logoSyil}
            />

            <Pressable onPress={() => navigation.navigate('Ticket')}>
              <Image
                source={require('../../images/ticket.png')}
                style={styles.ticketIcon}
              />
            </Pressable>
          </View>

          {/* SEARCH */}
          <View style={styles.searchBox}>
            <Image
              source={require('../../images/search_icon.png')}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search Procedures"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              placeholderTextColor="#999"
            />
          </View>

          {/* CATEGORY LIST */}
          <View style={styles.categoryList}>
            <FlatList
              data={categories}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.categoryRow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryCardBase,
                    selectedCategory === item && styles.activeCategory,
                  ]}
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory === item ? null : item
                    )
                  }
                >
                  <Image
                    source={require('../../images/catg_icon.png')}
                    style={styles.categoryIcon}
                  />
                  <Text style={styles.categoryText} numberOfLines={1}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <Text style={styles.popularTitle}>Popular Articles</Text>

          {/* ARTICLE LIST */}
          <View style={styles.articleListWrapper}>
            <FlatList
              data={filteredArticles}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.articleListContent}
              ListFooterComponent={<View style={{ height: 550 }} />}
            />
          </View>

        </View>
      </View>
    </ImageBackground>
  );
};

export default KnowledgeBase;

/* ================= STYLES (UNCHANGED) ================= */

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 60 : 20,
    backgroundColor: '#fff',
  },
  containerInner: {},
  flexClass: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightarrowIcon: { width: 11.86, height: 21.21 },
  logoSyil: { width: 87.6, height: 24 },
  ticketIcon: { width: 26.88, height: 21.88 },

  categoryRow: { marginTop: 15, height: 100 },
  activeCategory: {
    backgroundColor: '#FFEA00',
    padding: 10,
    borderRadius: 10,
    height: 86,
  },
  categoryCardBase: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    width: 90,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#F5F5F7',
    backgroundColor: '#fff',
    height: 86,
  },
  categoryIcon: { width: 41, height: 41, marginBottom: 6 },
  categoryText: { fontSize: 12, textAlign: 'center' },

  popularTitle: { fontSize: 20, fontWeight: '700', marginVertical: 10 },

  articleListWrapper: { backgroundColor: '#F5F5F7', marginTop: 10 },
  articleListContent: { paddingTop: 10, paddingBottom: 30 },

  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#FFF',
  },
  articleIcon: { width: 41, height: 41, marginRight: 8 },
  Leftarrow: { width: 11.86, height: 21.21 },
  articleTitle: { fontSize: 14, fontWeight: '600', color: '#000' },
  articleSub: { fontSize: 12, color: '#777' },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    marginTop: 26,
    borderRadius: 25,
    height: 45,
  },
  searchIcon: {
    width: 18,
    height: 18,
    marginHorizontal: 16,
    tintColor: '#777',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#000' },
});