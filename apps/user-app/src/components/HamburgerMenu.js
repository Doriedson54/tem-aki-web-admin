import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const HamburgerMenu = ({ navigation, buttonContainerStyle, buttonInnerStyle }) => {
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-16)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(-16);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [visible, opacity, translateY]);

  const items = useMemo(
    () => [
      { label: 'Sobre o aplicativo', icon: 'ℹ️', route: 'About' },
      { label: 'Termos de uso', icon: '📄', route: 'TermsOfUse' },
      { label: 'Política de privacidade', icon: '🔒', route: 'PrivacyPolicy' },
      { label: 'Contatos do desenvolvedor', icon: '📞', route: 'DeveloperContacts' },
    ],
    []
  );

  const navigate = useCallback(
    (route) => {
      close();
      navigation.navigate(route);
    },
    [close, navigation]
  );

  return (
    <>
      <TouchableOpacity style={[styles.buttonOuter, buttonContainerStyle]} onPress={open} activeOpacity={0.86}>
        <View style={[styles.buttonInner, buttonInnerStyle]}>
          <View style={styles.line} />
          <View style={styles.line} />
          <View style={styles.line} />
        </View>
      </TouchableOpacity>

      <Modal transparent visible={visible} animationType="none" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Animated.View style={[styles.menuCard, { opacity, transform: [{ translateY }] }]}>
            {items.map((item, index) => (
              <React.Fragment key={item.route}>
                <TouchableOpacity style={styles.menuRow} onPress={() => navigate(item.route)} activeOpacity={0.86}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={styles.menuText}>{item.label}</Text>
                </TouchableOpacity>
                {index < items.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  buttonOuter: {
    width: 46,
    height: 46,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 12,
  },
  buttonInner: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 69, 19, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  line: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#ffffff',
    marginVertical: 2.2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    paddingTop: 62,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  menuCard: {
    width: 280,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  menuIcon: {
    fontSize: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: '#1f2937',
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.10)',
  },
});

export default HamburgerMenu;
