import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Linking,
  Text,
  View,
  useWindowDimensions,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RenderHTML from 'react-native-render-html';
import ImageViewing from 'react-native-image-viewing';

const KnowledgeDetail = ({ route, navigation }) => {
  StatusBar.setTranslucent(true);
  StatusBar.setBackgroundColor('transparent');
  StatusBar.setBarStyle('dark-content');

  const { article } = route.params;
  const { width } = useWindowDimensions();

  const scrollRef = useRef(null);
  const headingPositions = useRef([]);

  const [html, setHtml] = useState('');
  const [imageVisible, setImageVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  // ====== ROWSPAN NORMALIZER FUNCTION ======
  const normalizeRowspanHTML = (html) => {
    return html.replace(
      /<table[\s\S]*?<\/table>/gi,
      (tableHtml) => {
        const rows = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi);
        if (!rows) return tableHtml;

        const activeRowspans = [];
        const newRows = [];

        rows.forEach((row) => {
          let cells = row.match(/<(td|th)[\s\S]*?<\/\1>/gi) || [];
          let finalCells = [];

          // Inject active rowspan cells first (empty cells)
          activeRowspans.forEach((r) => {
            finalCells.push('<td></td>'); // empty cell
            r.count--;
          });

          // Remove expired rowspans
          for (let i = activeRowspans.length - 1; i >= 0; i--) {
            if (activeRowspans[i].count <= 0) activeRowspans.splice(i, 1);
          }

          cells.forEach((cellHtml) => {
            const rowspanMatch = cellHtml.match(/rowspan=["'](\d+)["']/i);
            if (rowspanMatch) {
              const span = parseInt(rowspanMatch[1], 10);
              const cleanCell = cellHtml.replace(/rowspan=["']\d+["']/i, '');
              finalCells.push(cleanCell);

              if (span > 1) {
                activeRowspans.push({ html: cleanCell, count: span - 1 });
              }
            } else {
              finalCells.push(cellHtml);
            }
          });

          newRows.push(`<tr>${finalCells.join('')}</tr>`);
        });

        return tableHtml.replace(/<tr[\s\S]*?<\/tr>/gi, () => newRows.shift());
      }
    );
  };
  // ====== END ROWSPAN NORMALIZER ======

  useEffect(() => {
    let rawHtml = article?.['Article body'] || '';

    // Apply rowspan normalization here
    rawHtml = normalizeRowspanHTML(rawHtml);

    rawHtml = rawHtml
      .replace(/<tr>\s*(<td>(&nbsp;|\s)*<\/td>\s*)+<\/tr>/gi, '')
      .replace(/<p>(&nbsp;|\s)*<\/p>/gi, '');

    // Table wrapper for horizontal scroll
    rawHtml = rawHtml.replace(/<table/gi, '<div class="rn-table"><table');
    rawHtml = rawHtml.replace(/<\/table>/gi, '</table></div>');

    setHtml(rawHtml);
  }, [article]);

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

  const ImageRenderer = ({ tnode }) => {
    const uri = tnode.attributes.src;
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          setImageUrl(uri);
          setImageVisible(true);
        }}
      >
        <Image
          source={{ uri }}
          style={{ width: '100%', height: 200, resizeMode: 'contain', marginVertical: 10 }}
        />
      </TouchableOpacity>
    );
  };

  const renderers = useMemo(
    () => ({ h3: H3Renderer, img: ImageRenderer }),
    []
  );

  const renderersProps = useMemo(
    () => ({
      a: { onPress: (_, href) => href && Linking.openURL(href) },
      div: {
        wrapperComponent: ({ tnode, children }) => {
          if (tnode.attributes.class === 'rn-table') {
            // ✅ Horizontal ScrollView for tables
            return (
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View>{children}</View>
              </ScrollView>
            );
          }
          return <>{children}</>;
        },
      },
    }),
    []
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require('../../images/right_arrow.png')} style={styles.arrowIcon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Articles</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{article?.['Article title']}</Text>
        <View style={styles.categoryList}>
        <RenderHTML
          contentWidth={width}
          source={{ html }}
          renderers={renderers}
          tagsStyles={htmlStyles}
          renderersProps={{
            div: {
              wrapperComponent: ({ tnode, children }) => {
                if (tnode.attributes.class === 'rn-table') {
                  
                  return (
                    <FlatList
                      horizontal
                      showsHorizontalScrollIndicator={true}
                      style={{ marginVertical: 10 }}
                    >
                      <View style={{ flexDirection: 'row', minWidth: 700 }}>
                        {children}
                      </View>
                    </FlatList>
                  );
                }
                return <>{children}</>;
              },
            },
          }}
        />
        </View>
      </ScrollView>

      <ImageViewing
        images={imageUrl ? [{ uri: imageUrl }] : []}
        imageIndex={0}
        visible={imageVisible}
        onRequestClose={() => setImageVisible(false)}
      />
    </SafeAreaView>
  );
};

export default KnowledgeDetail;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  arrowIcon: { width: 12, height: 21 },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 60, backgroundColor: '#fff' },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center', flex: 1 },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 10 },
});

const htmlStyles = {
  table: { borderWidth: 1, borderColor: '#000', borderCollapse: 'collapse', minWidth: '100%' },
  tr: { flexDirection: 'row', display:'flex', },
  th: { borderWidth: 1, borderColor: '#000', padding: 5, backgroundColor: '#f5f7ff', fontWeight: '700', fontSize: 5, flex:1, },
  td: { borderWidth: 1, borderColor: '#000', padding: 5, flex:1, fontSize: 5, },
  p: { marginVertical: 8, fontSize: 14 },
  h3: { fontSize: 18, fontWeight: '700', marginVertical: 12 },
  a: { color: '#1a73e8', textDecorationLine: 'underline' },
};
