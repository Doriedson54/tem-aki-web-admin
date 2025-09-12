import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

const AboutScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sobre o Aplicativo</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🏪</Text>
          </View>
          <Text style={styles.appName}>Negócios do Bairro</Text>
          <Text style={styles.version}>Versão 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nossa Missão</Text>
          <Text style={styles.paragraph}>
            Conectar pessoas aos negócios locais do seu bairro, fortalecendo a economia local e criando uma comunidade mais unida e próspera.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O que oferecemos</Text>
          
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📍</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Localização Inteligente</Text>
              <Text style={styles.featureDescription}>
                Encontre negócios próximos a você com facilidade
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔍</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Busca Avançada</Text>
              <Text style={styles.featureDescription}>
                Filtre por categoria, distância e avaliações
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⭐</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Avaliações Reais</Text>
              <Text style={styles.featureDescription}>
                Veja avaliações de outros usuários da comunidade
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💬</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Contato Direto</Text>
              <Text style={styles.featureDescription}>
                Conecte-se diretamente com os estabelecimentos
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desenvolvido com ❤️</Text>
          <Text style={styles.paragraph}>
            Este aplicativo foi desenvolvido pensando na valorização dos pequenos negócios e no fortalecimento da economia local. Acreditamos que cada compra local faz a diferença na vida de uma família e na prosperidade da comunidade.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tecnologias Utilizadas</Text>
          <Text style={styles.techList}>
            • React Native{"\n"}
            • Expo{"\n"}
            • Firebase{"\n"}
            • Google Maps API{"\n"}
            • Node.js
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agradecimentos</Text>
          <Text style={styles.paragraph}>
            Agradecemos a todos os comerciantes locais que acreditaram no projeto e aos usuários que nos ajudam a melhorar constantemente o aplicativo.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Negócios do Bairro{"\n"}
            Todos os direitos reservados
          </Text>
          <Text style={styles.contactInfo}>
            Desenvolvido por: Doriedson Serra{"\n"}
            Email: dsdodo18@hotmail.com{"\n"}
            Telefone: (98) 99934-5232
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#FF8C00',
    fontSize: 20,
    fontWeight: '900',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  version: {
    fontSize: 16,
    color: '#666666',
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    textAlign: 'justify',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 15,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  techList: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF8C00',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 15,
  },
  contactInfo: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AboutScreen;