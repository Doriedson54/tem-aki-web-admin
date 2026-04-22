import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AnimatedBackButton = ({ onPress, color = '#ffffff', size = 22, style }) => {
  const tilt = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tilt, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(tilt, { toValue: -1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [tilt]);

  const animatedStyle = useMemo(() => {
    const rotateY = tilt.interpolate({
      inputRange: [-1, 1],
      outputRange: ['-22deg', '22deg'],
    });
    const rotateZ = tilt.interpolate({
      inputRange: [-1, 1],
      outputRange: ['-8deg', '8deg'],
    });
    const translateY = tilt.interpolate({
      inputRange: [-1, 1],
      outputRange: [1, -1],
    });
    const scale = press.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.94],
    });

    return {
      transform: [
        { perspective: 900 },
        { translateY },
        { rotateY },
        { rotateZ },
        { scale },
      ],
    };
  }, [tilt, press]);

  const handlePressIn = () => {
    Animated.spring(press, { toValue: 1, useNativeDriver: true, friction: 6, tension: 120 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(press, { toValue: 0, useNativeDriver: true, friction: 6, tension: 120 }).start();
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} hitSlop={10}>
      <Animated.View style={[styles.container, animatedStyle, style]}>
        <Ionicons name="arrow-back" size={size} color={color} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
});

export default AnimatedBackButton;
