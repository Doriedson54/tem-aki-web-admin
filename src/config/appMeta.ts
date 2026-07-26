export const appMeta = {
  name: "Tem Aki no Bairro",
  version: __APP_VERSION__,
  favoritesStorageKey: "temaki-app-favorites",
  developer: {
    name: "Doriedson Serra",
    email: "dsdodo18@hotmail.com",
    phoneLabel: "(98) 99934-5232",
    phoneHref: "+5598999345232",
  },
  infoLinks: [
    { label: "Política de Privacidade", to: "/politica-de-privacidade" },
    { label: "Termos de Uso", to: "/terms-of-use" },
    { label: "Sobre o Aplicativo", to: "/about" },
  ],
} as const;
