import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent, TouchableOpacity } from 'react-native';

interface WheelPickerProps {
  items: string[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  itemHeight?: number;
}

export default function WheelPicker({
  items,
  selectedIndex,
  onIndexChange,
  itemHeight = 40,
}: WheelPickerProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  // Add padding items so first and last can be centered
  const paddedItems = ['', ...items, ''];

  useEffect(() => {
    // Initial scroll to selected item
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: selectedIndex * itemHeight, animated: false });
    }, 100);
  }, []); // Only run once on mount

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    
    // Ensure index is within bounds
    const safeIndex = Math.max(0, Math.min(items.length - 1, index));
    
    // Snap to the calculated index
    scrollViewRef.current?.scrollTo({ y: safeIndex * itemHeight, animated: true });
    
    if (safeIndex !== selectedIndex) {
      onIndexChange(safeIndex);
    }
  };

  const handleScrollEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    const safeIndex = Math.max(0, Math.min(items.length - 1, index));
    scrollViewRef.current?.scrollTo({ y: safeIndex * itemHeight, animated: true });
    
    if (safeIndex !== selectedIndex) {
      onIndexChange(safeIndex);
    }
  };

  return (
    <View style={[styles.container, { height: itemHeight * 3 }]}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        contentContainerStyle={{ paddingVertical: 0 }}
      >
        {paddedItems.map((item, index) => {
          // Adjust index to match actual items array
          const actualIndex = index - 1;
          const isSelected = actualIndex === selectedIndex;
          
          return (
            <TouchableOpacity 
              key={index} 
              style={[styles.itemContainer, { height: itemHeight }]}
              activeOpacity={0.7}
              onPress={() => {
                if (actualIndex >= 0 && actualIndex < items.length) {
                  scrollViewRef.current?.scrollTo({ y: actualIndex * itemHeight, animated: true });
                  onIndexChange(actualIndex);
                }
              }}
            >
              <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {/* Highlight bars */}
      <View style={[styles.highlightTop, { top: itemHeight - 1 }]} />
      <View style={[styles.highlightBottom, { top: itemHeight * 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  itemContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 16,
    color: '#5A6275',
    fontWeight: '600',
  },
  selectedItemText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  highlightTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#3D4660',
  },
  highlightBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#3D4660',
  },
});
