import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Linking
} from 'react-native';

const SideMenu = ({ isVisible, onClose, navigation }) => {
  const [contactsExpanded, setContactsExpanded] = useState(false);

  const handleMenuItemPress = (item) => {
    if (item === 'Contatos') {
      setContactsExpanded(!contactsExpanded);
    } else {
      onClose();
      // Navegar para as telas correspondentes
        if (item === 'privacy') {
          navigation.navigate('PrivacyPolicy');
        } else if (item === 'about') {
          navigation.navigate('About');
        }
    }
  };

  const handleContactToggle = () => {
    setContactsExpanded(!contactsExpanded);
  };

  const handleContactAction = (action) => {
    onClose();
    
    if (action === 'phone') {
      // Abrir discador com o número
      Linking.openURL('tel:+5598999345232');
    } else if (action === 'whatsapp') {
      // Abrir WhatsApp
      Linking.openURL('https://wa.me/5598981470668?text=Olá! Entrei em contato através do app Tem Aki no Bairro.');
    } else if (action === 'email') {
      // Abrir cliente de email
      Linking.openURL('mailto:dsdodo18@hotmail.com?subject=Contato - Tem Aki no Bairro');
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.overlay} onPress={onClose} />
        <View style={styles.menu}>
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
              onPress={() => handleMenuItemPress('privacy')}
            >
              <View style={styles.menuItemIcon}>
                <Text style={styles.menuItemIconText}>📋</Text>
              </View>
              <Text style={styles.menuItemText}>Política de Privacidade{"\n"}e Termos de Uso</Text>
            </TouchableOpacity>

            <View style={styles.menuItemSeparator} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMenuItemPress('about')}
            >
              <View style={styles.menuItemIcon}>
                <Text style={styles.menuItemIconText}>ℹ</Text>
              </View>
              <Text style={styles.menuItemText}>Sobre o Aplicativo</Text>
            </TouchableOpacity>

            <View style={styles.menuItemSeparator} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleContactToggle}
            >
              <View style={styles.menuItemIcon}>
                <Text style={styles.menuItemIconText}>📞</Text>
              </View>
              <Text style={styles.menuItemText}>Contatos do Desenvolvedor</Text>
              <Text style={[styles.expandIcon, { transform: [{ rotate: contactsExpanded ? '180deg' : '0deg' }] }]}>▼</Text>
            </TouchableOpacity>

            {contactsExpanded && (
            <View style={styles.contactsSubmenu}>
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
                   <Text style={styles.contactIconText}>💬</Text>
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
            </View>
            )}
          </View>

          {/* Rodapé do menu */}
          <View style={styles.menuFooter}>
            <Text style={styles.footerText}>Tem Aki no Bairro</Text>
            <Text style={styles.footerVersion}>Versão 1.0.0</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menu: {
    width: '75%',
    backgroundColor: '#FF8C00',
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