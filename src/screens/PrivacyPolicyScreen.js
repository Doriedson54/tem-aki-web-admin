import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

const PrivacyPolicyScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>◀</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Política de Privacidade e Termos de Uso</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>POLÍTICA DE PRIVACIDADE</Text>
          
          <Text style={styles.paragraph}>
            O aplicativo "Negócios do Bairro" respeita a privacidade dos seus usuários e está comprometido em proteger as informações pessoais que você compartilha conosco.
          </Text>

          <Text style={styles.subTitle}>1. Coleta de Informações</Text>
          <Text style={styles.paragraph}>
            • Coletamos apenas as informações necessárias para o funcionamento do aplicativo{"\n"}
            • Dados de localização para mostrar negócios próximos{"\n"}
            • Informações de contato quando você se cadastra{"\n"}
            • Dados de uso para melhorar a experiência do usuário
          </Text>

          <Text style={styles.subTitle}>2. Uso das Informações</Text>
          <Text style={styles.paragraph}>
            • Personalizar sua experiência no aplicativo{"\n"}
            • Conectar você com negócios locais{"\n"}
            • Enviar notificações relevantes{"\n"}
            • Melhorar nossos serviços
          </Text>

          <Text style={styles.subTitle}>3. Compartilhamento de Dados</Text>
          <Text style={styles.paragraph}>
            • Não vendemos suas informações pessoais{"\n"}
            • Compartilhamos dados apenas com negócios quando você interage com eles{"\n"}
            • Podemos compartilhar dados agregados e anônimos para análises
          </Text>

          <Text style={styles.subTitle}>4. Segurança</Text>
          <Text style={styles.paragraph}>
            • Utilizamos medidas de segurança para proteger suas informações{"\n"}
            • Dados são criptografados durante a transmissão{"\n"}
            • Acesso restrito às informações pessoais
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TERMOS DE USO</Text>
          
          <Text style={styles.subTitle}>1. Aceitação dos Termos</Text>
          <Text style={styles.paragraph}>
            Ao usar o aplicativo "Negócios do Bairro", você concorda com estes termos de uso.
          </Text>

          <Text style={styles.subTitle}>2. Uso Permitido</Text>
          <Text style={styles.paragraph}>
            • Use o aplicativo apenas para fins legais{"\n"}
            • Não publique conteúdo ofensivo ou inadequado{"\n"}
            • Respeite os direitos de outros usuários e negócios{"\n"}
            • Não tente hackear ou comprometer a segurança do aplicativo
          </Text>

          <Text style={styles.subTitle}>3. Responsabilidades</Text>
          <Text style={styles.paragraph}>
            • Você é responsável pela veracidade das informações fornecidas{"\n"}
            • O aplicativo não se responsabiliza por transações entre usuários e negócios{"\n"}
            • Verificamos negócios, mas não garantimos a qualidade dos serviços
          </Text>

          <Text style={styles.subTitle}>4. Modificações</Text>
          <Text style={styles.paragraph}>
            • Podemos atualizar estes termos periodicamente{"\n"}
            • Usuários serão notificados sobre mudanças importantes{"\n"}
            • O uso continuado implica aceitação dos novos termos
          </Text>

          <Text style={styles.subTitle}>5. Contato</Text>
          <Text style={styles.paragraph}>
            Para dúvidas sobre esta política ou termos de uso, entre em contato:{"\n"}
            • Email: dsdodo18@hotmail.com{"\n"}
            • Telefone: (98) 99934-5232
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Última atualização: Janeiro de 2024
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
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF8C00',
    marginBottom: 15,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 15,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'justify',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
});

export default PrivacyPolicyScreen;