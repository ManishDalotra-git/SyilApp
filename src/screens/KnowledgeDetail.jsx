import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Linking,
  Text,
  View,
  useWindowDimensions,
  TouchableOpacity,
  StatusBar, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import RenderHTML from 'react-native-render-html';

const KnowledgeDetail = ({ route, navigation }) => {
  StatusBar.setTranslucent(true);
  StatusBar.setBackgroundColor('transparent');
  StatusBar.setBarStyle('dark-content');

  const { article } = route.params;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets(); // get safe area insets

  const scrollRef = useRef(null);
  const headingPositions = useRef([]);

  const [html, setHtml] = useState('');
  const [toc, setToc] = useState([]);
  const [showToc, setShowToc] = useState(false);

  useEffect(() => {
    let rawHtml = article?.['Article body'] || '';

    rawHtml = rawHtml
      .replace(/<tr>\s*(<td>(&nbsp;|\s)*<\/td>\s*)+<\/tr>/gi, '')
      .replace(/<p>(&nbsp;|\s)*<\/p>/gi, '');

    const headings = [];
    let index = 0;

    rawHtml = rawHtml.replace(/<h3[^>]*>(.*?)<\/h3>/gi, (_, content) => {
      headings.push({
        index,
        title: content.replace(/<[^>]+>/g, '').trim(),
      });
      index++;
      return `<h3>${content}</h3>`;
    });

    setHtml(rawHtml);
    setToc(headings);
  }, [article]);

  const scrollToSection = (index) => {
    const y = headingPositions.current[index];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({
        y: y - 10,
      });
      setShowToc(false);
    }
  };

  const H3Renderer = ({ TDefaultRenderer, ...props }) => {
    const currentIndex = headingPositions.current.length;
    return (
      <View
        onLayout={(e) => {
          headingPositions.current[currentIndex] = e.nativeEvent.layout.y;
        }}
      >
        <TDefaultRenderer {...props} />
      </View>
    );
  };

  const renderers = useMemo(() => ({ h3: H3Renderer }), []);
  const renderersProps = useMemo(
    () => ({
      a: {
        onPress: (_, href) => {
          if (href) Linking.openURL(href);
        },
      },
    }),
    []
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(Number(timestamp));
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea]}
    >
      {/* Header */}
      <View style={[styles.header, { height: 60, paddingTop: 0 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 0, bottom: 10, left: 10, right: 10 }}
        >
          <Image
              source={require('../../images/right_arrow.png')}
              style={styles.arrowIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Articles</Text>
      </View>

      {/* Scrollable content */}
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* META */}
        <View style={styles.metaContainer}>
          <Text style={styles.title}>{article?.['Article title']}</Text>

          {!!article?.Category && (
            <Text style={styles.metaText}>
              Category:{' '}
              <Text style={styles.metaValue}>{article.Category}</Text>
            </Text>
          )}

          {!!article?.Subcategory && (
            <Text style={styles.metaText}>
              Subcategory:{' '}
              <Text style={styles.metaValue}>{article.Subcategory}</Text>
            </Text>
          )}

          {!!article?.['Last modified date'] && (
            <Text style={styles.metaText}>
              Last Updated:{' '}
              <Text style={styles.metaValue}>
                {formatDate(article['Last modified date'])}
              </Text>
            </Text>
          )}
        </View>

        {/* TOC */}
        {toc.length > 0 && (
          <View style={styles.tocWrapper}>
            <Text style={styles.tocTitle}>Table of Contents</Text>

            <TouchableOpacity
              style={styles.tocDropdown}
              onPress={() => setShowToc(!showToc)}
            >
              <Text style={styles.tocPlaceholder}>Select section</Text>
              <Text>⌄</Text>
            </TouchableOpacity>

            {showToc &&
              toc.map((item) => (
                <TouchableOpacity
                  key={item.index}
                  style={styles.tocItem}
                  onPress={() => scrollToSection(item.index)}
                >
                  <Text>{item.title}</Text>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* BODY */}
        <RenderHTML
          contentWidth={width}
          source={{ html }}
          renderers={renderers}
          renderersProps={renderersProps}
          tagsStyles={htmlStyles}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default KnowledgeDetail;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  arrowIcon:{
    width:11.86,
    height:21.21,
  },
  header: {
    width: '100%',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    marginRight: 16,
  },
  backArrow: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign:'center',
    flexBasis:'87%',
  },

  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  metaContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  metaText: {
    fontSize: 14,
    color: '#555',
  },
  metaValue: {
    fontWeight: '600',
    color: '#000',
  },
  tocWrapper: {
    backgroundColor: '#ffe600',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    display:'none',
  },
  tocTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  tocDropdown: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tocPlaceholder: {
    color: '#555',
  },
  tocItem: {
    paddingVertical: 8,
  },
});

const htmlStyles = {
  p: {
    marginVertical: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 12,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#99acc2',
    marginVertical: 12,
  },
  td: {
    padding: 10,
  },
  a: {
    color: '#1a73e8',
    textDecorationLine: 'underline',
  },
};
