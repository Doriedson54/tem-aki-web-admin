import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  StyleSheet,
  TouchableWithoutFeedback,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.75; // 75% da largura da tela

const SideMenu = React.memo(({ isVisible, onClose, navigation }) => {
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [contactsExpanded, setContactsExpanded] = useState(false);
  const contactsHeight = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    // Limpar animação anterior se existir
    if (animationRef.current) {
      animationRef.current.stop();
    }

    if (isVisible) {
      // Abrir menu
      animationRef.current = Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
      animationRef.current.start();
    } else {
      // Fechar menu e resetar estado dos contatos
      setContactsExpanded(false);
      contactsHeight.setValue(0);
      
      animationRef.current = Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
      animationRef.current.start();
    }

    // Cleanup function
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [isVisible, slideAnim, overlayOpacity, contactsHeight]);

  const handleMenuItemPress = useCallback((screenName) => {
    onClose();
    const timeoutId = setTimeout(() => {
      navigation.navigate(screenName);
    }, 300);
    
    // Cleanup timeout se o componente for desmontado
    return () => clearTimeout(timeoutId);
  }, [onClose, navigation]);

  const handleContactPress = useCallback(() => {
    const toValue = contactsExpanded ? 0 : 180;
    setContactsExpanded(!contactsExpanded);
    
    Animated.timing(contactsHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [contactsExpanded, contactsHeight]);

  const handleContactAction = useCallback((action) => {
    switch(action) {
      case 'phone':
        Linking.openURL('tel:+5598999345232').catch(err => console.log('Erro ao abrir telefone:', err));
        break;
      case 'whatsapp':
        Linking.openURL('https://wa.me/5598981470668').catch(err => console.log('Erro ao abrir WhatsApp:', err));
        break;
      case 'email':
        Linking.openURL('mailto:dsdodo18@hotmail.com').catch(err => console.log('Erro ao abrir email:', err));
        break;
    }
  }, []);

  if (!isVisible && slideAnim._value === -MENU_WIDTH) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Overlay escuro */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
            }
          ]} 
        />
      </TouchableWithoutFeedback>

      {/* Menu lateral */}
      <Animated.View
        style={[
          styles.menu,
          {
            transform: [{ translateX: slideAnim }],
          }
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 140, 0, 0.5)', 'rgba(255, 165, 0, 0.5)', 'rgba(255, 184, 77, 0.5)']}
          style={styles.menuGradient}
        >
          {/* Cabeçalho do menu */}
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Menu</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Itens do menu */}
          <View style={styles.menuItems}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('PrivacyPolicy')}
            >
              <View style={styles.menuItemIcon}>
                <Text style={styles.menuItemIconText}>📋</Text>
              </View>
              <Text style={styles.menuItemText}>Política de Privacidade{"\n"}e Termos de Uso</Text>
            </TouchableOpacity>

            <View style={styles.menuItemSeparator} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('AboutApp')}
            >
              <View style={styles.menuItemIcon}>
                <Text style={styles.menuItemIconText}>ℹ</Text>
              </View>
              <Text style={styles.menuItemText}>Sobre o Aplicativo</Text>
            </TouchableOpacity>

            <View style={styles.menuItemSeparator} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleContactPress}
            >
              <View style={styles.menuItemIcon}>
                <Text style={styles.menuItemIconText}>📞</Text>
              </View>
              <Text style={styles.menuItemText}>Contatos do Desenvolvedor</Text>
              <Text style={[styles.expandIcon, { transform: [{ rotate: contactsExpanded ? '180deg' : '0deg' }] }]}>▼</Text>
            </TouchableOpacity>

            <Animated.View style={[styles.contactsSubmenu, { height: contactsHeight }]}>
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => handleContactAction('phone')}
              >
                <View style={styles.contactIcon}>
                  <Text style={styles.contactIconText}>📱</Text>
                </View>
                <Text style={styles.contactText}>Telefone: (98) 99934-5232</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                 style={styles.contactItem}
                 onPress={() => handleContactAction('whatsapp')}
               >
                 <View style={styles.contactIcon}>
                   <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                 </View>
                 <Text style={styles.contactText}>WhatsApp: (98) 98147-0668</Text>
               </TouchableOpacity>

              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => handleContactAction('email')}
              >
                <View style={styles.contactIcon}>
                  <Text style={styles.contactIconText}>✉️</Text>
                </View>
                <Text style={styles.contactText}>E-mail: dsdodo18@hotmail.com</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Rodapé do menu */}
          <View style={styles.menuFooter}>
            <Text style={styles.footerText}>Tem Aki no Bairro</Text>
            <Text style={styles.footerVersion}>Versão 1.0.0</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  menu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: MENU_WIDTH,
  },
  menuGradient: {
    flex: 1,
    paddingTop: 50,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  menuTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Comfortaa',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItems: {
    flex: 1,
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginBottom: 15,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemIconText: {
    fontSize: 20,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
  expandIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 10,
  },
  contactsSubmenu: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 50,
  },
  contactIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactIconText: {
    fontSize: 16,
  },
  contactText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    flexWrap: 'wrap',
  },
  menuItemSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 15,
    marginBottom: 15,
  },
  menuFooter: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  footerVersion: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
});

export default SideMenu;