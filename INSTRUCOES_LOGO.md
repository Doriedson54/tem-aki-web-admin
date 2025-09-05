# Instruções para Adicionar o GIF da Logomarca

## Passos para incluir o GIF da logomarca:

1. **Adicione o arquivo GIF** na pasta `src/assets/` com o nome `logo.gif`

2. **Atualize o arquivo HomeScreen.js:**
   - Descomente a linha de import: `import logoGif from '../assets/logo.gif';`
   - Substitua o placeholder atual por:
   ```jsx
   <Image source={logoGif} style={styles.logoImage} />
   ```

3. **Localização do código a ser alterado:**
   - Arquivo: `src/screens/HomeScreen.js`
   - Procure pelo comentário: `/* Placeholder temporário - substitua por: */`
   - Substitua todo o bloco `<View style={styles.logoPlaceholder}>` pela tag `<Image>`

## Configurações atuais:
- **Posição:** Canto superior esquerdo da tela inicial
- **Tamanho:** 60x60 pixels
- **Estilo:** Circular com sombra

## Observações:
- O placeholder atual mostra "LOGO" em um círculo laranja
- O GIF será exibido automaticamente quando adicionado
- Mantenha o tamanho 60x60 para consistência visual